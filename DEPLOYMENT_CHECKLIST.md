# Teacher Subject Access Control - Deployment Checklist

## Pre-Deployment

### 1. Backup Database
```bash
# Create a backup before applying changes
pg_dump -U your_user kindy_connect > backup_before_subject_restrictions_$(date +%Y%m%d).sql
```

### 2. Verify Current State
```sql
-- Check if subjects column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'subjects';

-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'marks';

-- Count teachers without subjects
SELECT COUNT(*) as teachers_without_subjects
FROM users 
WHERE role = 'teacher' AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);
```

## Deployment Steps

### Step 1: Apply Database Migration
```bash
# Connect to your database and run migration
psql -U your_user -d kindy_connect -f database/migrations/add_subject_restrictions.sql

# Expected output:
# DROP POLICY (3 policies dropped)
# CREATE POLICY (3 policies created)
```

### Step 2: Verify Migration Success
```sql
-- Check policies were created
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'marks';

-- Should see 4 policies:
-- marks_select_policy (SELECT)
-- marks_insert_policy (INSERT)
-- marks_update_policy (UPDATE)
-- marks_delete_policy (DELETE)
```

### Step 3: Update Existing Teachers
```sql
-- OPTION A: Assign all subjects to all teachers (temporary, until admin assigns proper subjects)
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' 
AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);

-- OPTION B: Assign subjects based on existing marks (smart assignment)
-- This assigns subjects to teachers based on what they've already taught
WITH teacher_subjects AS (
  SELECT DISTINCT m.recorded_by, array_agg(DISTINCT m.subject) as taught_subjects
  FROM marks m
  GROUP BY m.recorded_by
)
UPDATE users u
SET subjects = COALESCE(ts.taught_subjects, ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science'])
FROM teacher_subjects ts
WHERE u.id = ts.recorded_by 
AND u.role = 'teacher'
AND (u.subjects IS NULL OR array_length(u.subjects, 1) IS NULL);

-- Verify teachers now have subjects
SELECT id, name, role, subjects 
FROM users 
WHERE role = 'teacher'
ORDER BY name;
```

### Step 4: Deploy Application Code
```bash
# Build the application with new changes
npm run build

# Restart the server (method depends on your deployment)
pm2 restart kindy-connect  # if using PM2
# OR
systemctl restart kindy-connect  # if using systemd
# OR
# Redeploy via your CI/CD pipeline
```

### Step 5: Verify Application Functionality
```bash
# Check server logs for any errors
tail -f /var/log/kindy-connect/error.log

# OR if using PM2
pm2 logs kindy-connect
```

## Post-Deployment Testing

### Test 1: Teacher with Limited Subjects ✓
1. **Login** as a teacher with only "Math" and "Science" subjects
2. **Navigate** to Marks page
3. **Verify** only Math and Science appear in subject dropdown
4. **Try to add** a Math mark → Should succeed
5. **Check database** directly for Reading marks → Should not see any

### Test 2: Teacher Cannot Bypass UI ✗
1. **Open browser console**
2. **Attempt direct API call** (if you know the endpoint):
   ```javascript
   // This should fail at application or database layer
   fetch('/api/marks', {
     method: 'POST',
     body: JSON.stringify({
       mark: { pupilId: 'p1', subject: 'Reading', ... },
       actorId: 'teacher-id'
     })
   })
   ```
3. **Expected**: Error message about unauthorized subject access

### Test 3: Admin Has Full Access ✓
1. **Login** as admin
2. **Navigate** to Marks page
3. **Verify** all subjects appear in dropdown
4. **Try to add** marks for any subject → Should succeed

### Test 4: Check Error Messages ✓
1. **Login** as teacher with limited subjects
2. **Try to edit** a mark for an unauthorized subject (via any means)
3. **Expected error**: "Unauthorized: You are not assigned to teach [Subject]"

### Test 5: Performance Check ⚡
1. **Navigate** to Marks page with many pupils
2. **Check page load time** (should be similar to before)
3. **Add/edit marks** (should complete in < 1 second)

## Rollback Procedure (If Needed)

### If Issues Arise
```sql
-- Restore original policies (without subject restrictions)
DROP POLICY IF EXISTS "marks_select_policy" ON marks;
DROP POLICY IF EXISTS "marks_insert_policy" ON marks;
DROP POLICY IF EXISTS "marks_update_policy" ON marks;

-- Recreate original policies
CREATE POLICY "marks_select_policy" ON marks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        JOIN pupils ON pupils.id = marks.pupil_id
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND (
            users.role IN ('admin', 'deputy')
            OR (users.role = 'teacher' AND users.class_id = pupils.class_id)
        )
    )
);

CREATE POLICY "marks_insert_policy" ON marks FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        JOIN pupils ON pupils.id = marks.pupil_id
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND (
            users.role IN ('admin', 'deputy')
            OR (users.role = 'teacher' AND users.class_id = pupils.class_id)
        )
    )
);

CREATE POLICY "marks_update_policy" ON marks FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        JOIN pupils ON pupils.id = marks.pupil_id
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND (
            users.role IN ('admin', 'deputy')
            OR (users.role = 'teacher' AND users.class_id = pupils.class_id)
        )
    )
);

-- Redeploy previous application version
git revert HEAD
npm run build
pm2 restart kindy-connect
```

## Monitoring

### Queries to Monitor

```sql
-- Teachers without subjects (should be 0 after deployment)
SELECT id, name, email, subjects
FROM users 
WHERE role = 'teacher' 
AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);

-- Recent marks by subject (to verify access control)
SELECT m.id, m.subject, m.recorded_by, u.name as teacher_name, u.subjects
FROM marks m
JOIN users u ON u.id = m.recorded_by
WHERE m.recorded_at > CURRENT_DATE - INTERVAL '7 days'
ORDER BY m.recorded_at DESC
LIMIT 20;

-- Check for authorization errors in logs
-- (This depends on your logging setup)
```

### Application Logs to Watch

Look for these patterns:
- ✅ "Mark added successfully"
- ✅ "Mark updated successfully"
- ⚠️ "Unauthorized: You are not assigned to teach"
- ⚠️ "Unauthorized: You can only add marks for pupils in your assigned class"
- ❌ "row-level security policy violation" (PostgreSQL error)

## Success Criteria

✅ All RLS policies created successfully
✅ All teachers have subjects assigned
✅ Application starts without errors
✅ Teachers see only their assigned subjects
✅ Admins see all subjects
✅ Unauthorized access attempts are blocked
✅ Error messages are clear and helpful
✅ Page load times remain acceptable
✅ No regression in existing functionality

## Communication

### Notify Users
After successful deployment, inform:

**School Administrators**:
> "We've enhanced security for teacher accounts. Teachers can now only access subjects they are assigned to teach. Please review teacher subject assignments in the Teachers page."

**Teachers**:
> "You may notice that you only see certain subjects in the Marks page. This is because you are now restricted to subjects you are assigned to teach. If you believe you should have access to additional subjects, please contact your school administrator."

## Support

If you encounter issues:
1. Check `TEACHER_SUBJECT_RESTRICTIONS.md` for detailed feature documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check `ACCESS_CONTROL_FLOW.md` for visual flow diagrams
4. Review database logs: `SELECT * FROM pg_stat_activity WHERE datname = 'kindy_connect';`
5. Review application logs for authorization errors

## Completion Sign-off

- [ ] Database backup created
- [ ] Migration applied successfully
- [ ] Policies verified in database
- [ ] Teachers have subjects assigned
- [ ] Application deployed successfully
- [ ] Testing completed
- [ ] Performance verified
- [ ] Users notified
- [ ] Documentation reviewed

**Deployed by**: _________________  
**Date**: _________________  
**Time**: _________________  
**Notes**: _________________

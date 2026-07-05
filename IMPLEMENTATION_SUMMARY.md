# Teacher Subject Access Control - Implementation Summary

## What Was Implemented

Teachers are now restricted to only access subjects they are assigned to teach. This ensures proper authorization and data security across the application.

## Changes Made

### 1. Database Layer (Security Policies)
**File**: `database/rls-policies.sql`

Updated Row Level Security (RLS) policies for the `marks` table to include subject restrictions:

- **SELECT Policy**: Teachers can only view marks for subjects in their `subjects` array
- **INSERT Policy**: Teachers can only add marks for subjects they are assigned to teach
- **UPDATE Policy**: Teachers can only update marks for subjects they are assigned to teach

**Key Change**: Added `AND marks.subject = ANY(users.subjects)` condition to all teacher policies.

### 2. Migration Script
**File**: `database/migrations/add_subject_restrictions.sql`

Created a migration script that:
- Drops existing marks policies
- Recreates policies with subject restrictions
- Can be applied to existing databases without data loss

**How to Apply**:
```bash
psql -U your_user -d kindy_connect -f database/migrations/add_subject_restrictions.sql
```

### 3. Server-Side Validation
**File**: `src/lib/db-functions.ts`

Enhanced `addMark` and `updateMark` server functions with authorization checks:

**addMark changes**:
- Validates teacher is assigned to the pupil's class
- Validates teacher is assigned to the subject
- Returns clear error messages for unauthorized attempts

**updateMark changes**:
- Added optional `actorId` parameter for authorization
- Validates teacher can update marks for the subject
- Handles both current subject and updated subject scenarios

### 4. Frontend Integration
**File**: `src/lib/mock-store.tsx`

Updated the `updateMark` function to pass `actorId`:
- Ensures server-side authorization is properly triggered
- Maintains audit trail with correct user information

**File**: `src/routes/app.marks.tsx`
- Already had UI-level subject filtering (no changes needed)
- Teachers only see their assigned subjects in dropdown

### 5. Documentation
**Files**: 
- `TEACHER_SUBJECT_RESTRICTIONS.md` - Comprehensive feature documentation
- `IMPLEMENTATION_SUMMARY.md` - This summary
- `database/migrations/add_subject_restrictions.sql` - Inline documentation

## Security Layers

The implementation provides **three layers of security**:

1. **UI Layer** (Frontend)
   - Subject dropdown filtered to show only assigned subjects
   - Prevents accidental unauthorized access

2. **Application Layer** (Server Functions)
   - Explicit authorization checks in `addMark` and `updateMark`
   - Clear error messages for troubleshooting

3. **Database Layer** (RLS Policies)
   - PostgreSQL enforces restrictions at the data level
   - Cannot be bypassed even if application code is compromised

## Testing Recommendations

### 1. Test Teacher with Limited Subjects
```sql
-- Create test teacher
INSERT INTO users (id, name, email, role, status, school_id, class_id, subjects, password, registered_at)
VALUES ('test-t1', 'Math Teacher', 'math-test@school.com', 'teacher', 'verified', 's1', 'c1', 
        ARRAY['Math', 'Science'], 'admin123', CURRENT_DATE);

-- Login as this teacher and try to:
-- ✓ Add Math mark (should work)
-- ✗ Add Reading mark (should fail)
-- ✓ View Math marks (should work)
-- ✗ View Reading marks (should not appear)
```

### 2. Test Admin Access
```sql
-- Admins should be able to:
-- ✓ Add marks for any subject
-- ✓ View marks for all subjects
-- ✓ Update marks for all subjects
```

### 3. Test Edge Cases
- Teacher with empty subjects array (should fail all operations)
- Teacher with NULL subjects (should fail all operations)
- Teacher trying to update mark's subject to one they're not assigned to (should fail)

## Error Messages

Users will see clear error messages when unauthorized:

- `"Unauthorized: You can only add marks for pupils in your assigned class"`
- `"Unauthorized: You are not assigned to teach [Subject Name]"`
- `"Unauthorized: You can only update marks for pupils in your assigned class"`

## Rollback Plan

If issues arise, you can rollback the policies:

```sql
-- Restore original policies (without subject restrictions)
DROP POLICY IF EXISTS "marks_select_policy" ON marks;
DROP POLICY IF EXISTS "marks_insert_policy" ON marks;
DROP POLICY IF EXISTS "marks_update_policy" ON marks;

-- Recreate without subject check
CREATE POLICY "marks_select_policy" ON marks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users JOIN pupils ON pupils.id = marks.pupil_id
        WHERE users.id = auth.uid()::text AND users.status = 'verified'
        AND (users.role IN ('admin', 'deputy') OR (users.role = 'teacher' AND users.class_id = pupils.class_id))
    )
);

-- Repeat for INSERT and UPDATE policies
```

## Performance Considerations

- RLS policies use indexed columns (`users.id`, `pupils.class_id`)
- Subject array check `= ANY(users.subjects)` is efficient for small arrays
- No additional database queries added to critical path
- Authorization checks happen in single query with JOINs

## Backwards Compatibility

- Existing functionality for admins/deputies unchanged
- Teachers without subjects assigned will be unable to access marks (by design)
- Migration script can be run safely on production databases

## Next Steps

1. **Apply Migration**: Run the migration script on your database
2. **Update Teachers**: Ensure all teachers have subjects assigned
3. **Test Thoroughly**: Test with different user roles and subjects
4. **Monitor**: Check application logs for authorization errors
5. **Train Users**: Inform admins about the new subject assignment requirement

## Support

For issues or questions:
1. Check `TEACHER_SUBJECT_RESTRICTIONS.md` for detailed documentation
2. Review error messages in browser console and server logs
3. Verify teacher's `subjects` array: `SELECT id, name, subjects FROM users WHERE role = 'teacher';`
4. Confirm RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'marks';`

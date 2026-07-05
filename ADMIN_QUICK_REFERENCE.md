# Admin Quick Reference - Teacher Subject Access Control

## What Changed?

Teachers are now **restricted to only access subjects they are assigned to teach**. This improves data security and prevents unauthorized access to marks.

## As an Admin, You Need To:

### 1. Assign Subjects to New Teachers

When creating a new teacher account:
1. Go to **Teachers** page
2. Click **"Create User"**
3. Fill in teacher details
4. **Select at least one subject** from the checkboxes:
   - ☐ Reading
   - ☐ Math
   - ☐ Writing
   - ☐ Art
   - ☐ Music
   - ☐ Physical Education
   - ☐ Science
5. Click **"Create User"**

⚠️ **Important**: You MUST select at least one subject, or the teacher won't be able to add any marks!

### 2. Update Existing Teachers (If Needed)

If a teacher needs access to additional subjects or has no subjects assigned:

**Using SQL** (if you have database access):
```sql
-- View current teacher subjects
SELECT id, name, subjects FROM users WHERE role = 'teacher' ORDER BY name;

-- Update a specific teacher
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Science'] 
WHERE id = 'teacher-id-here';

-- Give a teacher access to all subjects
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE id = 'teacher-id-here';
```

## What Teachers See

### Math & Science Teacher Example

**Teacher: John Doe**
**Assigned Subjects**: Math, Science

**What they CAN do**:
- ✅ View Math marks
- ✅ View Science marks
- ✅ Add Math marks for their class
- ✅ Add Science marks for their class
- ✅ Edit Math and Science marks

**What they CANNOT do**:
- ❌ View Reading marks
- ❌ View Writing marks
- ❌ Add marks for Art, Music, PE
- ❌ Edit marks for subjects they're not assigned to

### All Subjects Teacher Example

**Teacher: Jane Smith**
**Assigned Subjects**: Reading, Math, Writing, Art, Music, Physical Education, Science

**What they CAN do**:
- ✅ View marks for ANY subject
- ✅ Add marks for ANY subject
- ✅ Edit marks for ANY subject
- ✅ Full access (like a substitute teacher)

## Common Questions

### Q: A teacher says they can't see certain subjects. What do I do?
**A**: The teacher is not assigned to those subjects. Update their subject assignments in the database or re-create their account with the correct subjects.

### Q: Can I assign different subjects to the same teacher for different terms?
**A**: Currently, subject assignments are not term-specific. A teacher either has access to a subject or doesn't. Consider using the "all subjects" approach for flexible teachers.

### Q: What if a teacher needs temporary access to cover another teacher's subject?
**A**: 
- **Option 1**: Update their subjects array to include the temporary subject
- **Option 2**: Have an admin add the marks on behalf of the teacher
- **Option 3**: Create a temporary substitute teacher account with needed subjects

### Q: Can a teacher teach the same subject to multiple classes?
**A**: Yes! Subject restrictions only apply to the subjects themselves, not the classes. A teacher assigned to one class can teach multiple subjects to that class.

### Q: As an admin, am I affected by these restrictions?
**A**: No! Admins, deputies, and super admins have **full access** to all subjects across all classes. Only teachers are restricted.

### Q: What happens if I don't assign any subjects to a teacher?
**A**: The teacher won't be able to:
- View any marks
- Add any marks
- Edit any marks

They will see empty dropdowns and receive error messages when trying to add marks.

### Q: How do I know which subjects a teacher currently has access to?
**A**: Run this query in the database:
```sql
SELECT id, name, subjects 
FROM users 
WHERE role = 'teacher' 
ORDER BY name;
```

## Error Messages You Might See

If you try to perform operations on behalf of a teacher (via API or database):

❌ **"Unauthorized: You are not assigned to teach [Subject]"**
- Means: The teacher is trying to add/edit a mark for a subject they don't have access to
- Fix: Assign the subject to the teacher or have an admin add the mark

❌ **"Unauthorized: You can only add marks for pupils in your assigned class"**
- Means: The teacher is trying to add marks for a pupil in a different class
- Fix: Verify the pupil's class assignment matches the teacher's class

❌ **"row-level security policy violation"** (Database error)
- Means: Database-level security blocked the operation
- Fix: Check teacher's class and subject assignments

## Best Practices

### 1. Subject Assignment Strategy

**Option A - Specialized Teachers** (Recommended):
- Assign specific subjects to each teacher based on their expertise
- Example: Math teacher gets Math & Science, Language teacher gets Reading & Writing

**Option B - Generalist Teachers**:
- Assign all subjects to teachers who teach multiple subjects
- Useful for small schools or substitute teachers

**Option C - Mixed Approach**:
- Most teachers get specific subjects
- One or two "substitute" teachers get all subjects for flexibility

### 2. Regular Audits

Periodically check teacher subject assignments:
```sql
-- Teachers with no subjects (should be 0)
SELECT id, name, subjects 
FROM users 
WHERE role = 'teacher' 
AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);

-- Teachers with all subjects
SELECT id, name 
FROM users 
WHERE role = 'teacher' 
AND subjects @> ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science'];
```

### 3. Onboarding New Teachers

When a new teacher joins:
1. ✅ Create their user account
2. ✅ **Assign subjects immediately** (don't skip this!)
3. ✅ Assign them to a class
4. ✅ Have them test by adding a sample mark
5. ✅ Verify they can only see their assigned subjects

## Quick Commands Cheat Sheet

```sql
-- View all teachers and their subjects
SELECT name, subjects FROM users WHERE role = 'teacher';

-- Assign subjects to a teacher
UPDATE users SET subjects = ARRAY['Math', 'Science'] WHERE id = 'teacher-id';

-- Give a teacher all subjects
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE id = 'teacher-id';

-- Find teachers without subjects
SELECT id, name FROM users 
WHERE role = 'teacher' 
AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);

-- Fix all teachers without subjects (give them all subjects)
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' 
AND (subjects IS NULL OR array_length(subjects, 1) IS NULL);
```

## Security Benefits

✅ **Data Privacy**: Teachers can only see marks for their subjects
✅ **Accountability**: Clear audit trail of who can access what
✅ **Access Control**: Prevents accidental or unauthorized mark entry
✅ **Compliance**: Supports data protection requirements
✅ **Role Clarity**: Clear separation of responsibilities

## Support Contacts

For technical issues or questions:
- Review `TEACHER_SUBJECT_RESTRICTIONS.md` for complete documentation
- Review `DEPLOYMENT_CHECKLIST.md` for troubleshooting steps
- Contact your system administrator
- Check application logs for detailed error messages

---

**Remember**: Teachers need **both** a class assignment AND subject assignments to use the Marks page effectively!

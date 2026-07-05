# Teacher Subject Restrictions Feature

## Overview
Teachers can now be restricted to specific subjects they are assigned to teach. This ensures teachers can only add and edit marks for subjects they are authorized to handle.

## How It Works

### 1. Database Schema
- Added `subjects` column to the `users` table (TEXT ARRAY type)
- Stores an array of subject names for each teacher
- Example: `['Math', 'Science']` or `['Reading', 'Writing', 'Art']`

### 2. User Creation
When creating a teacher account, administrators must:
1. Select "Teacher" as the role
2. Choose at least one subject from the available subjects:
   - Reading
   - Math
   - Writing
   - Art
   - Music
   - Physical Education
   - Science

### 3. Subject Filtering in Marks Page
- **Teachers**: Can only see subjects they are assigned to
- **Admins/Deputies/Super Admins**: Can see all subjects

## Example Use Cases

**Teacher specialization:**
- Peter Otieno: Assigned to Math & Science only
- Lucy Achieng: Assigned to Reading & Writing only
- James Kariuki: Assigned to all subjects (substitute teacher)

**Workflow:**
1. School Admin creates teacher account
2. Admin selects subjects the teacher will handle
3. Teacher logs in and sees only their assigned subjects in the marks page
4. Teacher can only add/edit marks for pupils in their class and their assigned subjects

## Database Migration

To apply this feature to an existing database, run:

```sql
-- Add subjects column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT[];

-- Update existing teachers with all subjects (default)
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;
```

Or run the migration file:
```bash
psql -d your_database < database/migrations/005_add_subjects_to_users.sql
```

Or use the quick apply script:
```bash
psql -d your_database < database/apply-subject-migration.sql
```

## Seed Data Examples

The seed file includes teachers with different subject assignments:
- **u4 (Peter Otieno)**: Math, Science
- **u5 (Lucy Achieng)**: Reading, Writing
- **u6 (James Kariuki)**: All subjects
- **u7 (Sarah Muthoni)**: Art, Music

## UI Changes

### User Creation Dialog
- New "Subjects" section appears when "Teacher" role is selected
- Checkboxes for each available subject
- Required: At least one subject must be selected
- Validation error if no subjects selected

### Marks Page
- Subject dropdown automatically filtered based on teacher's assignments
- Teachers see only their assigned subjects
- Admins see all subjects

## Security Benefits

1. **Data Isolation**: Teachers cannot access marks for subjects they don't teach
2. **Role-Based Access**: Clear separation of responsibilities
3. **Audit Trail**: Each mark is tied to a specific teacher and subject
4. **Principle of Least Privilege**: Teachers only have access to data they need

## Future Enhancements

Possible improvements:
- Edit teacher subject assignments from the UI
- Subject-based class assignments (e.g., Math teacher for Class A, Science teacher for Class B)
- Subject-specific permissions (view-only vs edit)
- Reports showing which teachers handle which subjects

## Testing

To test this feature:
1. Login as School Admin (e.g., u1)
2. Go to "Users" page
3. Click "Create User"
4. Select "Teacher" role
5. Select 1-2 subjects (e.g., Math and Science)
6. Create the teacher account
7. Logout and login as the new teacher
8. Go to "Marks & Grades" page
9. Verify only selected subjects appear in the dropdown

## Notes

- Super Admins and School Admins can see and assign all subjects
- Deputies can see all subjects for their school
- Teachers without assigned subjects will see no subjects (should be avoided)
- When creating teachers through the UI, subject selection is mandatory

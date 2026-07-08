# Teacher Subject Restrictions Feature

## Overview

Teachers are restricted to only access subjects they are assigned to teach. This ensures teachers can only view, add, and edit marks for subjects they are authorized to handle, within the classes they are assigned to.

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

### 3. Access Control Implementation

#### Frontend Filtering (UI Level)

- **Marks Page**: Teachers only see subjects they are assigned to in the subject dropdown
- **Subject Selection**: The `availableSubjects` array is filtered based on `currentUser.subjects`
- **Admins/Deputies/Super Admins**: Can see all subjects without restriction

#### Database Security (Row Level Security)

Enhanced RLS policies enforce subject restrictions at the database level:

**SELECT Policy:**

- Teachers can only view marks for:
  - Pupils in their assigned class (`class_id` match)
  - Subjects in their subjects array (`marks.subject = ANY(users.subjects)`)
- Admins and deputies can view all marks in their school
- Super admins can view all marks across all schools

**INSERT Policy:**

- Teachers can only add marks for:
  - Pupils in their assigned class
  - Subjects they are assigned to teach
- Admins and deputies can add marks for any subject

**UPDATE Policy:**

- Teachers can only update marks for:
  - Pupils in their assigned class
  - Subjects they are assigned to teach
- Admins and deputies can update any marks

**DELETE Policy:**

- Only admins can delete marks (teachers cannot delete any marks)

### 4. Subject Filtering in Marks Page

The marks page implements client-side filtering:

```typescript
const availableSubjects = useMemo(() => {
  if (isTeacher && currentUser?.subjects && currentUser.subjects.length > 0) {
    return subjects.filter((s) => currentUser.subjects?.includes(s));
  }
  return subjects;
}, [isTeacher, currentUser]);
```

This ensures teachers only see their assigned subjects in the UI.

## Example Use Cases

**Teacher specialization:**

- Peter Otieno: Assigned to Math & Science only
  - Can view/add/edit marks for Math and Science
  - Cannot access Reading, Writing, Art, Music, or PE marks
- Lucy Achieng: Assigned to Reading & Writing only
  - Can view/add/edit marks for Reading and Writing
  - Cannot access other subjects
- James Kariuki: Assigned to all subjects (substitute teacher)
  - Can view/add/edit marks for all subjects

**Workflow:**

1. School Admin creates teacher account
2. Admin selects subjects the teacher will handle
3. Teacher logs in and sees only their assigned subjects in the marks page
4. Teacher attempts to add a mark for Math (assigned subject) → Success
5. Teacher attempts to add a mark for Art (not assigned) → Blocked by RLS policy
6. Database enforces the restriction even if UI is bypassed

## Security Features

### Multi-Layer Protection

1. **UI Layer**: Subject dropdown filtered to show only assigned subjects
2. **Database Layer**: RLS policies block unauthorized access at data level
3. **Server Functions**: Validation ensures proper data flow

### Bypass Prevention

- Even if a teacher modifies the frontend code or uses API directly, the database RLS policies will block unauthorized operations
- RLS policies check both class assignment AND subject assignment
- Policies use `auth.uid()` to match current user, preventing impersonation

## Database Migration

To apply this feature to an existing database, run the migration script:

```bash
psql -U your_user -d kindy_connect -f database/migrations/add_subject_restrictions.sql
```

Or apply manually:

```sql
-- Drop and recreate marks policies with subject restrictions
-- See: database/migrations/add_subject_restrictions.sql
```

### Updating Existing Teachers

If you have existing teachers without subject assignments:

```sql
-- Update a specific teacher with subjects
UPDATE users
SET subjects = ARRAY['Reading', 'Math', 'Writing']
WHERE id = 'teacher-id-here' AND role = 'teacher';

-- Set all subjects for existing teachers (temporary - until admin assigns proper subjects)
UPDATE users
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;
```

## Testing the Feature

### 1. Create Test Teachers

```sql
-- Teacher with limited subjects
INSERT INTO users (id, name, email, role, status, school_id, class_id, subjects, password, registered_at)
VALUES ('t1', 'Math Teacher', 'math@school.com', 'teacher', 'verified', 's1', 'c1', ARRAY['Math', 'Science'], 'admin123', CURRENT_DATE);

-- Teacher with all subjects
INSERT INTO users (id, name, email, role, status, school_id, class_id, subjects, password, registered_at)
VALUES ('t2', 'All Subjects Teacher', 'all@school.com', 'teacher', 'verified', 's1', 'c1', ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science'], 'admin123', CURRENT_DATE);
```

### 2. Test Access Control

```sql
-- As Math Teacher (t1)
SET SESSION ROLE authenticated;
SET SESSION "request.jwt.claims" TO '{"sub": "t1"}';

-- This should work (Math is assigned)
INSERT INTO marks (id, pupil_id, subject, term, year, score, max_score, recorded_by, recorded_at)
VALUES ('m1', 'p1', 'Math', 'Term 1', '2025', 85, 100, 't1', CURRENT_TIMESTAMP);

-- This should fail (Reading is not assigned)
INSERT INTO marks (id, pupil_id, subject, term, year, score, max_score, recorded_by, recorded_at)
VALUES ('m2', 'p1', 'Reading', 'Term 1', '2025', 90, 100, 't1', CURRENT_TIMESTAMP);
-- Expected: Policy violation error
```

### 3. Test UI Filtering

1. Log in as a teacher with limited subjects (e.g., only Math and Science)
2. Navigate to Marks page
3. Verify subject dropdown only shows Math and Science
4. Try to add a mark - should only work for assigned subjects

## Troubleshooting

### Teachers Cannot See Any Marks

**Cause**: Teacher's `subjects` array is empty or NULL
**Fix**:

```sql
UPDATE users SET subjects = ARRAY['Reading', 'Math'] WHERE id = 'teacher-id' AND role = 'teacher';
```

### Teachers Can See All Subjects

**Cause**:

- RLS policies not applied
- Teacher has all subjects in their array
  **Fix**:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'marks';
-- Should show rowsecurity = true

-- Check teacher's subjects
SELECT id, name, subjects FROM users WHERE role = 'teacher';
```

### Policy Errors When Adding Marks

**Cause**: Trying to add marks for non-assigned subjects
**Fix**: Ensure subject is in teacher's `subjects` array or use admin account

## Technical Implementation Details

### Database Schema

```sql
-- users table includes subjects column
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'deputy', 'teacher')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    phone VARCHAR(50) UNIQUE,
    class_id VARCHAR(50),
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
    password VARCHAR(255) NOT NULL,
    school_id VARCHAR(50),
    subjects TEXT[]  -- Array of subject names
);
```

### RLS Policy Structure

```sql
-- Example: marks_insert_policy
CREATE POLICY "marks_insert_policy" ON marks
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        JOIN pupils ON pupils.id = marks.pupil_id
        WHERE users.id = auth.uid()::text
        AND users.status = 'verified'
        AND (
            users.role IN ('admin', 'deputy')
            OR (
                users.role = 'teacher'
                AND users.class_id = pupils.class_id        -- Class restriction
                AND marks.subject = ANY(users.subjects)     -- Subject restriction
            )
        )
    )
);
```

### Frontend Implementation

Location: `src/routes/app.marks.tsx`

```typescript
// Filter subjects based on teacher assignment
const availableSubjects = useMemo(() => {
  if (isTeacher && currentUser?.subjects && currentUser.subjects.length > 0) {
    return subjects.filter((s) => currentUser.subjects?.includes(s));
  }
  return subjects;
}, [isTeacher, currentUser]);
```

## Future Enhancements

1. **Subject Management Page**: UI for admins to manage teacher subject assignments
2. **Bulk Subject Assignment**: Assign subjects to multiple teachers at once
3. **Subject History**: Track when subjects were assigned/removed from teachers
4. **Subject-Level Reports**: Generate reports showing which teachers handle which subjects
5. **Subject Load Balancing**: Dashboard showing teacher workload by subject
   UPDATE users
   SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
   WHERE role = 'teacher' AND subjects IS NULL;

````

Or run the migration file:
```bash
psql -d your_database < database/migrations/005_add_subjects_to_users.sql
````

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

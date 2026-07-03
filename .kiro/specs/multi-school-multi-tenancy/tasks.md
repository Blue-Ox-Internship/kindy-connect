# Implementation Plan: Multi-School Multi-Tenancy

## Overview

This implementation plan transforms Kindy Connect from a single-school system into a multi-tenant SaaS platform. The approach prioritizes database-level security through Row Level Security (RLS) policies, then builds the application layer on top. Implementation proceeds incrementally: database migrations → RLS policies → session management → server functions → UI components → testing.

## Tasks

- [ ] 1. Database schema migrations and constraints
  - Create migration file for multi-tenancy schema updates
  - Add CHECK constraints on users table (super_admin must have null school_id, others must have non-null school_id)
  - Add indexes on school_id columns if not present
  - Verify foreign key constraints are properly set
  - _Requirements: 3.1, 9.1, 9.4, 9.5_

- [ ] 2. Implement Row Level Security (RLS) policies
  - [ ] 2.1 Create RLS utility functions for setting session context
    - Write `setRLSContext(sql, userId)` function in `db.ts`
    - Function should query user role and school_id
    - Set `app.user_id` and `app.school_id` PostgreSQL session variables
    - _Requirements: 10.7, 11.1, 11.2_

  - [ ] 2.2 Create RLS policies for users table
    - Enable RLS on users table
    - Create super_admin bypass policy
    - Create school_scoped_access policy filtering by school_id
    - _Requirements: 10.1, 10.7_

  - [ ] 2.3 Create RLS policies for classes table
    - Enable RLS on classes table
    - Create super_admin bypass policy
    - Create school_scoped_access policy filtering by school_id
    - _Requirements: 10.4, 10.7_


  - [ ] 2.4 Create RLS policies for pupils table
    - Enable RLS on pupils table
    - Create super_admin bypass policy
    - Create school_scoped_access policy filtering by school_id
    - _Requirements: 10.2, 10.7_

  - [ ] 2.5 Create RLS policies for parents table
    - Enable RLS on parents table
    - Create super_admin bypass policy
    - Create school_scoped_access policy filtering by school_id
    - _Requirements: 10.3, 10.7_

  - [ ] 2.6 Create RLS policies for attendance table
    - Enable RLS on attendance table
    - Create super_admin bypass policy
    - Create school_scoped_access policy joining to pupils.school_id
    - _Requirements: 10.5, 10.7_

  - [ ] 2.7 Create RLS policies for notifications table
    - Enable RLS on notifications table
    - Create super_admin bypass policy
    - Create school_scoped_access policy joining to pupils.school_id
    - _Requirements: 10.6, 10.7_

  - [ ] 2.8 Create RLS policies for marks table
    - Enable RLS on marks table
    - Create super_admin bypass policy
    - Create school_scoped_access policy joining to pupils.school_id
    - _Requirements: 10.6, 10.7_


- [ ] 3. Update server functions with RLS context
  - [ ] 3.1 Update getInitialData to set RLS context
    - Call setRLSContext at start of transaction
    - Extract userId from session/request
    - Wrap queries in sql.begin transaction
    - _Requirements: 11.1, 11.2_

  - [ ] 3.2 Update authentication functions (loginUser, registerUser)
    - Validate school_id requirements based on role
    - Ensure super_admin gets null school_id
    - Ensure other roles get non-null school_id
    - _Requirements: 1.6, 3.1, 7.2, 7.5_

  - [ ] 3.3 Update pupil management functions (addPupil, updatePupil)
    - Add RLS context setting
    - Ensure school_id is set from currentUser context
    - Validate cross-school updates are blocked
    - _Requirements: 11.2, 11.3, 16.2_

  - [ ] 3.4 Update user management functions (approveTeacher, rejectTeacher)
    - Add RLS context setting
    - Ensure school_id filtering is applied
    - _Requirements: 3.2, 11.2_

  - [ ] 3.5 Update attendance functions (markArrival, markDeparture)
    - Add RLS context setting
    - Verify pupil belongs to user's school before marking
    - _Requirements: 4.4, 11.2_

  - [ ] 3.6 Update marks functions (addMark, updateMark, deleteMark)
    - Add RLS context setting
    - Verify pupil belongs to user's school before operations
    - _Requirements: 4.5, 11.2_

  - [ ] 3.7 Update parent functions (addParent)
    - Add RLS context setting
    - Set school_id from currentUser context
    - _Requirements: 11.2, 17.1_


  - [ ] 3.8 Update class management functions (addClass, updateClass, deleteClass)
    - Add RLS context setting
    - Set school_id from currentUser context or explicit parameter (for super_admin)
    - Validate teacher assignments are within same school
    - _Requirements: 11.2, 16.2, 16.4_

- [ ] 4. Checkpoint - Test RLS policies and server functions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update React Context (MockStoreProvider)
  - [ ] 5.1 Add selectedSchoolId state for Super Admin context switching
    - Add `selectedSchoolId: string | null` to state
    - Add `setSchoolContext(schoolId)` function
    - Persist selectedSchoolId in sessionStorage
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 5.2 Update filtering logic for Super Admin context
    - Modify filtered data useMemo hooks
    - If super_admin AND selectedSchoolId is set, filter by selectedSchoolId
    - If super_admin AND selectedSchoolId is null, return all data
    - If not super_admin, filter by currentUser.schoolId
    - _Requirements: 1.2, 6.1, 8.2_

  - [ ] 5.3 Add school management functions to store context
    - Expose addSchool, updateSchool, deleteSchool (already exist in db-functions)
    - Ensure state updates correctly after school operations
    - _Requirements: 1.3, 2.1, 2.4, 2.6_


- [ ] 6. Implement Super Admin UI components
  - [ ] 6.1 Create SchoolSelector component
    - Dropdown showing all schools
    - "All Schools" option for system-wide view
    - Only visible to super_admin role
    - Update selectedSchoolId on change
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ] 6.2 Create Super Admin Dashboard
    - System statistics cards (total schools, pupils, admins, activity)
    - Schools table with columns: name, pupils count, classes count, staff count
    - Actions: View, Edit, Delete
    - Recent audit logs (system-wide)
    - _Requirements: 1.5, 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.3 Create Schools Management Page
    - Route: `/app/schools`
    - Table listing all schools
    - Add School button with form dialog
    - Edit School action with pre-filled form
    - Delete School action with cascade warning
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 15.1, 15.2_

  - [ ] 6.4 Add SchoolSelector to app shell
    - Import SchoolSelector into app-shell.tsx
    - Place in sidebar above navigation menu
    - Only render for super_admin users
    - _Requirements: 8.1, 8.3_


- [ ] 7. Update School Admin and Teacher dashboards
  - [ ] 7.1 Add school name display to app shell
    - Show school name in sidebar for school-scoped users
    - Fetch school name from schools table using currentUser.schoolId
    - _Requirements: 6.2, 8.3_

  - [ ] 7.2 Update School Admin dashboard to show school-filtered data
    - Display school-specific statistics
    - Filter pupils, classes, attendance by school
    - _Requirements: 6.1, 6.3_

  - [ ] 7.3 Update Teacher dashboard to show class-filtered data
    - Show only assigned class data
    - Filter by teacher's classId
    - _Requirements: 6.4_

- [ ] 8. Update navigation menu based on role
  - [ ] 8.1 Create role-based navigation configuration
    - Define menu items for super_admin: Dashboard, Schools, Users, Classes, Audit
    - Define menu items for admin/deputy: Dashboard, Pupils, Parents, Teachers, Classes, Attendance, Marks, Reports, Audit
    - Define menu items for teacher: My Class, Attendance, Marks
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 8.2 Implement route guards for role-based access
    - Prevent direct URL access to unauthorized routes
    - Redirect to appropriate dashboard if access denied
    - _Requirements: 13.4, 13.5_

  - [ ] 8.3 Hide Schools menu from school-scoped users
    - Only show Schools navigation item to super_admin
    - _Requirements: 13.4_


- [ ] 9. Implement privilege escalation prevention
  - [ ] 9.1 Add validation to user creation functions
    - Block School Admin from creating super_admin users
    - Block School Admin from creating users with different school_id
    - Only allow super_admin to create super_admin users
    - _Requirements: 14.1, 14.2, 18.1, 18.3_

  - [ ] 9.2 Add validation to user update functions
    - Block School Admin from changing their role to super_admin
    - Block School Admin from removing their school_id
    - Log failed privilege escalation attempts
    - _Requirements: 14.3, 14.4, 14.5_

  - [ ] 9.3 Update registerUser function with role-based validation
    - Validate school_id presence based on role
    - Enforce super_admin cannot register with school_id
    - Enforce other roles must register with school_id
    - _Requirements: 7.2, 7.4, 7.5_

- [ ] 10. Implement safe school deletion
  - [ ] 10.1 Add confirmation dialog for school deletion
    - Show warning with data counts (pupils, classes, users)
    - Require two-step confirmation
    - _Requirements: 15.1, 15.3_

  - [ ] 10.2 Add option to deactivate instead of delete
    - Add `active` boolean field to schools table (optional enhancement)
    - Offer "Deactivate" as alternative to "Delete"
    - _Requirements: 15.5_

  - [ ] 10.3 Log school deletion to audit trail
    - Record school name and data counts in audit log
    - Include timestamp and actor details
    - _Requirements: 12.2, 15.4_


- [ ] 11. Update notification system for multi-tenancy
  - [ ] 11.1 Verify parent notifications respect school boundaries
    - Check that markArrival/markDeparture only notify parents in same school
    - Filter parents by pupil's school_id
    - _Requirements: 17.2, 17.4_

  - [ ] 11.2 Update notification generation to include school context
    - Ensure notification queries are school-scoped
    - Test cross-school notification prevention
    - _Requirements: 4.6, 17.3_

- [ ] 12. Update reporting functions for multi-tenancy
  - [ ] 12.1 Add school_id filtering to attendance reports
    - Filter report data by currentUser.schoolId for school-scoped users
    - Allow super_admin to generate per-school or system-wide reports
    - _Requirements: 20.1, 20.4_

  - [ ] 12.2 Add school_id filtering to marks reports
    - Filter report data by currentUser.schoolId for school-scoped users
    - Include school name in exported reports
    - _Requirements: 20.2, 20.5_

  - [ ] 12.3 Update report statistics calculations
    - Calculate averages and totals based on school-filtered data
    - Ensure school-scoped users see only their school's statistics
    - _Requirements: 20.3_

- [ ] 13. Checkpoint - Test multi-tenancy end-to-end
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 14. Update audit logging for multi-tenancy
  - [ ] 14.1 Add school_id context to audit log entries
    - Update audit log functions to include school context
    - Filter audit logs by school for school-scoped users
    - _Requirements: 4.7, 12.4_

  - [ ] 14.2 Log school management operations
    - Log school creation with school name and timestamp
    - Log school deletion with school name and timestamp
    - Log school updates
    - _Requirements: 12.1, 12.2_

  - [ ] 14.3 Log user creation with school context
    - Include school_id in user creation audit logs
    - Show school name in log display
    - _Requirements: 12.3_

  - [ ] 14.4 Add audit log filtering by school
    - Allow super_admin to filter logs by school
    - Automatically filter for school-scoped users
    - _Requirements: 12.5_

- [ ] 15. Update existing UI components for multi-tenancy
  - [ ] 15.1 Update users table to show school column
    - Add school name column (for super_admin view)
    - Filter by school_id for school-scoped users
    - _Requirements: 3.3, 3.4_

  - [ ] 15.2 Update classes table to show school column
    - Add school name column (for super_admin view)
    - Filter by school_id for school-scoped users
    - _Requirements: 16.3_

  - [ ] 15.3 Update pupils management to enforce school context
    - Set school_id automatically for school-scoped users
    - Allow super_admin to select school when creating pupil
    - _Requirements: 16.2, 16.5_


  - [ ] 15.4 Update class management forms to include school selector
    - Show school dropdown for super_admin when creating class
    - Auto-set school_id for school-scoped users
    - Validate teacher assignment within same school
    - _Requirements: 16.1, 16.4_

- [ ] 16. Implement session management enhancements
  - [ ] 16.1 Persist school context in session
    - Store selectedSchoolId in sessionStorage (for super_admin)
    - Restore context on page reload
    - _Requirements: 19.3, 19.4_

  - [ ] 16.2 Add session validation middleware
    - Validate school_id on every authenticated request
    - Clear invalid sessions
    - _Requirements: 19.2_

  - [ ] 16.3 Store school_id in session for school-scoped users
    - Set school_id in session on login
    - Use for RLS context in server functions
    - _Requirements: 19.1_

- [ ] 17. Write unit tests for core functionality
  - [ ]* 17.1 Test user validation constraints
    - Test super_admin has null school_id
    - Test other roles have non-null school_id
    - Test validation errors

  - [ ]* 17.2 Test data filtering logic
    - Test filtered pupils only include current school
    - Test super_admin sees all data
    - Test school context switching

  - [ ]* 17.3 Test privilege escalation prevention
    - Test School Admin cannot create super_admin
    - Test School Admin cannot change own role
    - Test authorization errors are logged


- [ ] 18. Write integration tests for multi-tenancy
  - [ ]* 18.1 Test RLS policy enforcement
    - Test school_scoped queries only return matching school_id
    - Test super_admin bypass
    - Test cross-school access attempts are blocked

  - [ ]* 18.2 Test school CRUD with cascading
    - Test school creation
    - Test school update
    - Test school deletion cascades to users, classes, pupils

  - [ ]* 18.3 Test notification tenant isolation
    - Test notifications only sent to same-school parents
    - Test cross-school notification prevention

  - [ ]* 18.4 Test audit logging with school context
    - Test audit logs include school context
    - Test filtering by school for school-scoped users
    - Test super_admin can view all logs

- [ ] 19. Write property-based tests
  - [ ]* 19.1 Property 1: School-scoped users cannot access other schools' data
    - **Property 1: School-scoped users cannot access other schools' data**
    - **Validates: Requirements 3.2, 4.2, 4.4, 4.5, 6.1**

  - [ ]* 19.2 Property 2: Super Admin has unrestricted access
    - **Property 2: Super Admin has unrestricted access**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 19.3 Property 3: RLS policies enforce tenant boundaries
    - **Property 3: RLS policies enforce tenant boundaries**
    - **Validates: Requirements 4.3, 10.1, 10.2, 10.3, 10.4**


  - [ ]* 19.4 Property 4: School deletion cascades correctly
    - **Property 4: School deletion cascades correctly**
    - **Validates: Requirements 2.4, 15.2**

  - [ ]* 19.5 Property 5: User role constraints are enforced
    - **Property 5: User role constraints are enforced**
    - **Validates: Requirements 1.6, 3.1, 14.4**

  - [ ]* 19.6 Property 6: School context switching preserves data isolation
    - **Property 6: School context switching preserves data isolation**
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [ ]* 19.7 Property 7: Notifications respect tenant boundaries
    - **Property 7: Notifications respect tenant boundaries**
    - **Validates: Requirements 4.6, 17.2, 17.4**

  - [ ]* 19.8 Property 8: Cross-school user creation is prevented
    - **Property 8: Cross-school user creation is prevented**
    - **Validates: Requirements 3.4, 14.2**

  - [ ]* 19.9 Property 9: Audit logs maintain school context
    - **Property 9: Audit logs maintain school context**
    - **Validates: Requirements 4.7, 12.4**

  - [ ]* 19.10 Property 10: Reports respect tenant isolation
    - **Property 10: Reports respect tenant isolation**
    - **Validates: Requirements 20.1, 20.2, 20.3**

- [ ] 20. Final checkpoint - Verify all requirements and test coverage
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- RLS policies are the primary security mechanism; client-side filtering is for UX only


# Requirements Document: Multi-School Multi-Tenancy

## Introduction

The Kindy Connect application currently operates as a single-school kindergarten management system. This feature transforms it into a multi-tenant platform where a Super Admin manages multiple schools, and each school operates independently with its own isolated data, dashboard, and role-based access control. Each school has its own roles (School Admin, Deputy, Teachers) who can only access their school's data.

## Glossary

- **System**: The Kindy Connect multi-tenant platform
- **Super_Admin**: A system-wide administrator who manages all schools and has access to all data (user ID: KC001)
- **School**: A distinct organizational tenant within the system with isolated data
- **School_Admin**: An administrator who manages only their assigned school
- **Deputy**: A deputy administrator with elevated privileges within a school
- **Teacher**: A teaching staff member with limited privileges within a school
- **School_Data**: All data belonging to a specific school (pupils, parents, attendance, marks, classes, users)
- **Tenant_Isolation**: The guarantee that one school cannot access another school's data
- **Database**: The underlying PostgreSQL database storing all system data
- **RLS_Policy**: Row Level Security policy enforcing data isolation at the database level
- **Session**: An authenticated user's active connection to the system
- **School_Selector**: UI component allowing Super Admin to switch between school contexts

## Requirements

### Requirement 1: Super Admin Role and System Management

**User Story:** As a system administrator, I want a Super Admin role that can manage all schools, so that I can oversee the entire multi-tenant platform.

#### Acceptance Criteria

1. THE System SHALL support a role named "super_admin" distinct from school-level roles
2. WHEN a Super Admin authenticates, THE System SHALL grant access to all schools and their data
3. THE Super_Admin SHALL have permissions to create, update, and delete schools
4. THE Super_Admin SHALL have read-only access to all School_Data across all schools
5. THE System SHALL display a Super Admin dashboard showing aggregate statistics for all schools
6. THE Super_Admin SHALL NOT be assigned to any specific school (school_id is null)
7. THE System SHALL use "KC001" as the user ID for the Super Admin account

### Requirement 2: School Entity and Registration

**User Story:** As a Super Admin, I want to create and manage school entities, so that I can onboard new schools to the platform.

#### Acceptance Criteria

1. THE System SHALL maintain a schools table with fields: id, name, address, phone, email, registered_at
2. WHEN a Super Admin creates a school, THE System SHALL generate a unique school identifier
3. THE System SHALL require school name to be non-empty when creating a school
4. WHEN a Super Admin deletes a school, THE System SHALL cascade delete all associated School_Data
5. THE System SHALL prevent school deletion if active pupils exist (for safety)
6. THE System SHALL allow Super Admin to update school details (name, address, phone, email)

### Requirement 3: School-Scoped User Roles

**User Story:** As a school administrator, I want my staff roles to be scoped to my school only, so that my staff cannot access other schools' data.

#### Acceptance Criteria

1. THE System SHALL require all users with roles "admin", "deputy", or "teacher" to have a non-null school_id
2. WHEN a user with school-scoped role authenticates, THE System SHALL restrict access to only their assigned school's data
3. THE System SHALL prevent School_Admin from viewing or modifying users from other schools
4. THE System SHALL prevent School_Admin from creating users for other schools
5. WHEN a school is deleted, THE System SHALL remove or reassign all users associated with that school

### Requirement 4: Data Isolation and Tenant Boundaries

**User Story:** As a school administrator, I want complete data isolation from other schools, so that my school's sensitive information remains private.

#### Acceptance Criteria

1. THE System SHALL add school_id column to tables: users, pupils, parents, classes
2. WHEN a school-scoped user queries any table, THE System SHALL filter results to only their school_id
3. THE System SHALL enforce tenant isolation at the database level using Row Level Security (RLS) policies
4. WHEN a Teacher queries attendance records, THE System SHALL return only records for pupils belonging to their school
5. WHEN a School_Admin queries marks, THE System SHALL return only marks for pupils in their school
6. THE System SHALL enforce tenant isolation for notifications, ensuring parents only receive notifications for their school's pupils
7. THE System SHALL filter audit logs by school context for school-scoped users

### Requirement 5: Super Admin Dashboard and School Overview

**User Story:** As a Super Admin, I want a system-wide dashboard showing all schools, so that I can monitor platform health and activity.

#### Acceptance Criteria

1. THE System SHALL display a Super Admin dashboard showing: total schools, total pupils, total admins, and system activity count
2. WHEN Super Admin views the dashboard, THE System SHALL display a table listing all schools with their pupil count, class count, and staff count
3. THE System SHALL show recent audit logs from all schools in the Super Admin dashboard
4. THE Super_Admin dashboard SHALL include navigation links to: Schools management, Users management, Classes management, and Audit logs
5. THE System SHALL update dashboard statistics in real-time when schools or users are added/removed

### Requirement 6: School-Specific Dashboards

**User Story:** As a School Admin, I want my dashboard to show only my school's data, so that I can focus on managing my school without distraction.

#### Acceptance Criteria

1. WHEN a School_Admin views the dashboard, THE System SHALL display only pupils, classes, and attendance from their school
2. THE System SHALL display the school name in the application shell sidebar for school-scoped users
3. THE System SHALL show statistics filtered by school_id: total pupils in school, classes in school, present today in school, absent today in school
4. WHEN a Teacher views the dashboard, THE System SHALL display only their assigned class within their school
5. THE System SHALL prevent school-scoped users from accessing the Super Admin dashboard route

### Requirement 7: Multi-Tenant User Registration

**User Story:** As a new school registering on the platform, I want to create a school account with an admin, so that I can start using the system.

#### Acceptance Criteria

1. WHEN a new user registers as a School Admin, THE System SHALL allow creation of a new school during registration
2. THE System SHALL create both the school entity and the admin user in a single transaction
3. WHEN a Super Admin creates a school, THE System SHALL optionally create an initial School_Admin user for that school
4. THE System SHALL require school selection when creating users with school-scoped roles
5. THE System SHALL automatically assign the correct school_id to users during school-based registration

### Requirement 8: School Selector for Super Admin

**User Story:** As a Super Admin, I want to switch between school contexts, so that I can perform administrative tasks within a specific school.

#### Acceptance Criteria

1. THE System SHALL provide a School_Selector UI component visible only to Super Admin
2. WHEN Super Admin selects a school, THE System SHALL update the session context to that school
3. WHEN Super Admin is in a school context, THE System SHALL display that school's name in the application shell
4. THE System SHALL allow Super Admin to return to system-wide view (no school selected)
5. THE School_Selector SHALL display a searchable list of all schools

### Requirement 9: Database Schema Migration for Multi-Tenancy

**User Story:** As a system administrator, I want to migrate the existing single-school database to multi-tenant structure, so that existing data is preserved.

#### Acceptance Criteria

1. THE System SHALL add school_id column to tables: users, classes, pupils, parents (if not already present)
2. THE System SHALL create a default school entity for existing data migration
3. WHEN migration runs, THE System SHALL assign all existing records to the default school
4. THE System SHALL create database indexes on school_id columns for query performance
5. THE System SHALL add foreign key constraints linking school_id to the schools table

### Requirement 10: Row Level Security Policies

**User Story:** As a system administrator, I want database-level security policies, so that tenant isolation is enforced regardless of application code.

#### Acceptance Criteria

1. THE System SHALL create RLS policies on users table restricting access based on school_id
2. THE System SHALL create RLS policies on pupils table restricting access based on school_id
3. THE System SHALL create RLS policies on parents table restricting access based on school_id
4. THE System SHALL create RLS policies on classes table restricting access based on school_id
5. THE System SHALL create RLS policies on attendance table restricting access based on pupil's school_id
6. THE System SHALL create RLS policies on marks table restricting access based on pupil's school_id
7. THE System SHALL exempt Super Admin from RLS restrictions (bypass RLS for super_admin role)
8. THE System SHALL enable RLS policies on all multi-tenant tables

### Requirement 11: School Context in API Requests

**User Story:** As a developer, I want all API requests to include school context, so that data queries are automatically filtered by tenant.

#### Acceptance Criteria

1. WHEN a school-scoped user makes an API request, THE System SHALL extract school_id from the session
2. THE System SHALL inject school_id into database queries for school-scoped users
3. THE System SHALL reject API requests that attempt to access data from a different school_id than the user's assigned school
4. WHEN Super Admin makes an API request without school context, THE System SHALL allow access to all schools
5. THE System SHALL log unauthorized access attempts in the audit log

### Requirement 12: Audit Logging for Multi-Tenant Operations

**User Story:** As a Super Admin, I want audit logs for all tenant-related operations, so that I can track school management activities.

#### Acceptance Criteria

1. WHEN a Super Admin creates a school, THE System SHALL log the action with school name and timestamp
2. WHEN a Super Admin deletes a school, THE System SHALL log the action with school name and timestamp
3. WHEN a School_Admin creates a user, THE System SHALL log the action with user details and school context
4. THE System SHALL include school_id in all audit log entries for school-scoped actions
5. THE System SHALL allow Super Admin to filter audit logs by school

### Requirement 13: Navigation and Access Control by Role

**User Story:** As a user, I want my navigation menu to show only features relevant to my role, so that I'm not confused by inaccessible features.

#### Acceptance Criteria

1. WHEN Super Admin navigates, THE System SHALL display menu items: Dashboard, Schools, Users, Classes, Audit log
2. WHEN School_Admin navigates, THE System SHALL display menu items: Dashboard, Pupils, Parents, Teachers, Classes, Attendance, Marks, Reports, Audit log
3. WHEN Teacher navigates, THE System SHALL display menu items: My class, Attendance, Marks
4. THE System SHALL hide the Schools menu item from school-scoped users
5. THE System SHALL prevent direct URL access to routes not permitted by the user's role

### Requirement 14: School Admin Cannot Elevate to Super Admin

**User Story:** As a system security administrator, I want to prevent privilege escalation, so that School Admins cannot grant themselves Super Admin access.

#### Acceptance Criteria

1. THE System SHALL restrict creation of super_admin users to existing Super Admin accounts only
2. WHEN a School_Admin attempts to create a super_admin user, THE System SHALL reject the request
3. THE System SHALL prevent School_Admin from modifying their own role to super_admin
4. THE System SHALL prevent School_Admin from removing their school_id assignment
5. THE System SHALL log all failed privilege escalation attempts

### Requirement 15: School Deletion Safety and Cascade Rules

**User Story:** As a Super Admin, I want safe school deletion with clear warnings, so that I don't accidentally delete active school data.

#### Acceptance Criteria

1. WHEN a Super Admin deletes a school with active pupils, THE System SHALL display a confirmation warning listing data to be deleted
2. THE System SHALL cascade delete all users, classes, pupils, parents, attendance, marks when school is deleted
3. THE System SHALL prevent accidental deletion by requiring explicit confirmation
4. WHEN a school is deleted, THE System SHALL create an audit log entry recording the deletion and data counts
5. THE System SHALL offer an alternative to deactivate a school instead of deleting it

### Requirement 16: School-Scoped Class Management

**User Story:** As a School Admin, I want to manage classes within my school, so that I can organize pupils and assign teachers.

#### Acceptance Criteria

1. THE System SHALL require school_id when creating a class
2. WHEN a School_Admin creates a class, THE System SHALL automatically assign their school_id
3. WHEN a School_Admin views classes, THE System SHALL display only classes from their school
4. THE System SHALL prevent assigning teachers from other schools to a class
5. THE System SHALL prevent assigning pupils from other schools to a class

### Requirement 17: Parent and Notification Multi-Tenancy

**User Story:** As a parent, I want to only receive notifications about my child's school, so that I'm not confused by notifications from other schools.

#### Acceptance Criteria

1. THE System SHALL assign school_id to all parent records based on their associated pupils' school
2. WHEN generating notifications, THE System SHALL only send notifications to parents within the same school as the pupil
3. THE System SHALL filter notification delivery logs by school context for school-scoped users
4. THE System SHALL prevent cross-school notification delivery
5. WHEN a pupil transfers schools, THE System SHALL update parent school_id associations

### Requirement 18: Super Admin User Creation Across Schools

**User Story:** As a Super Admin, I want to create users for any school, so that I can help schools onboard their staff.

#### Acceptance Criteria

1. WHEN Super Admin creates a user, THE System SHALL allow selection of any school from a dropdown
2. THE System SHALL require school_id when Super Admin creates school-scoped roles (admin, deputy, teacher)
3. THE System SHALL allow Super Admin to create users without school_id only for super_admin role
4. WHEN Super Admin creates a School_Admin, THE System SHALL automatically set status to "verified"
5. THE System SHALL send welcome notifications to newly created school staff

### Requirement 19: Multi-Tenant Session Management

**User Story:** As a user, I want my session to maintain my school context, so that I don't see data from other schools.

#### Acceptance Criteria

1. WHEN a school-scoped user logs in, THE System SHALL store their school_id in the session
2. THE System SHALL validate school_id on every authenticated request
3. WHEN a Super Admin selects a school context, THE System SHALL update the session with the selected school_id
4. THE System SHALL clear school context from session when Super Admin returns to system-wide view
5. THE System SHALL expire sessions and require re-authentication after inactivity

### Requirement 20: Reporting and Analytics Per School

**User Story:** As a School Admin, I want reports scoped to my school only, so that I can analyze my school's performance without data from other schools.

#### Acceptance Criteria

1. WHEN a School_Admin generates an attendance report, THE System SHALL include only pupils from their school
2. WHEN a School_Admin generates a marks report, THE System SHALL include only pupils from their school
3. THE System SHALL calculate statistics (averages, totals) based only on the user's school data
4. WHEN Super Admin generates reports, THE System SHALL offer options to report per-school or system-wide
5. THE System SHALL include school name in all exported reports for school-scoped users

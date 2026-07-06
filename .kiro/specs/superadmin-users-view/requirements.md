# Requirements Document

## Introduction

The Superadmin Users View feature enables superadministrators to view and manage all users across all schools in the Kindy Connect system. Currently, the system has a "Teachers" page that shows users based on role-specific permissions, but there is no dedicated comprehensive view for superadmins to see all system users. This feature provides superadmins with a centralized interface to view, search, filter, and manage all user accounts (super_admin, admin, deputy, and teacher roles) across the entire platform.

## Glossary

- **Superadmin**: A user with the role `super_admin` who has system-wide access across all schools
- **User**: Any account in the system with one of the following roles: super_admin, admin, deputy, or teacher
- **School_Admin**: A user with the role `admin` who manages a specific school
- **Deputy**: A user with the role `deputy` who has limited administrative permissions within a school
- **Teacher**: A user with the role `teacher` who teaches classes within a school
- **Users_View**: The interface component that displays the list of all users in the system
- **User_Status**: The verification state of a user account, which can be pending, verified, or rejected
- **System**: The Kindy Connect application
- **Navigation_Menu**: The application menu that contains links to different sections of the system

## Requirements

### Requirement 1: Superadmin Access to Users View

**User Story:** As a superadmin, I want to access a dedicated users view page, so that I can see and manage all users in the system from a centralized location.

#### Acceptance Criteria

1. THE Navigation_Menu SHALL display a "Users" link for users with super_admin role
2. THE Navigation_Menu SHALL NOT display a "Users" link for users with admin, deputy, or teacher roles
3. WHEN a superadmin clicks the "Users" link, THE System SHALL navigate to the Users_View page
4. THE Users_View page SHALL be accessible only to users with super_admin role
5. WHEN a non-superadmin attempts to access the Users_View page directly, THE System SHALL redirect them to the dashboard with an error message

### Requirement 2: Display All Users

**User Story:** As a superadmin, I want to see all users in the system regardless of their school or role, so that I have complete visibility into user accounts.

#### Acceptance Criteria

1. THE Users_View SHALL display all users with roles super_admin, admin, deputy, and teacher
2. FOR EACH user, THE Users_View SHALL display the user ID, name, email, role, school name, status, and registration date
3. THE Users_View SHALL display users in a tabular format with sortable columns
4. WHEN the Users_View loads, THE System SHALL fetch all user records from the database
5. THE Users_View SHALL display the total count of users shown

### Requirement 3: Search and Filter Users

**User Story:** As a superadmin, I want to search and filter users by multiple criteria, so that I can quickly find specific users or groups of users.

#### Acceptance Criteria

1. THE Users_View SHALL provide a search input field
2. WHEN a superadmin enters text in the search field, THE System SHALL filter users where the text matches the user ID, name, or email (case-insensitive partial match)
3. THE Users_View SHALL provide a filter dropdown for school selection
4. WHEN a superadmin selects a school from the dropdown, THE System SHALL display only users associated with that school
5. THE Users_View SHALL provide a filter dropdown for role selection
6. WHEN a superadmin selects a role from the dropdown, THE System SHALL display only users with that role
7. THE Users_View SHALL provide a filter dropdown for status selection
8. WHEN a superadmin selects a status from the dropdown, THE System SHALL display only users with that status
9. THE System SHALL apply all active filters simultaneously (search text AND school AND role AND status)
10. THE Users_View SHALL display the count of filtered results

### Requirement 4: User Status Management

**User Story:** As a superadmin, I want to view users organized by their verification status, so that I can easily identify and process pending user requests.

#### Acceptance Criteria

1. THE Users_View SHALL organize users into three tabs: Pending, Verified, and Rejected
2. THE Pending tab SHALL display users with status "pending"
3. THE Verified tab SHALL display users with status "verified"
4. THE Rejected tab SHALL display users with status "rejected"
5. WHEN a superadmin switches tabs, THE System SHALL maintain active search and filter criteria
6. THE System SHALL display the count of users in each status category on the respective tab label

### Requirement 5: User Details Display

**User Story:** As a superadmin, I want to see comprehensive details for each user, so that I can understand their account configuration and context.

#### Acceptance Criteria

1. FOR EACH user in the list, THE Users_View SHALL display the user ID
2. FOR EACH user in the list, THE Users_View SHALL display the full name
3. FOR EACH user in the list, THE Users_View SHALL display the email address
4. FOR EACH user in the list, THE Users_View SHALL display the phone number (if available)
5. FOR EACH user in the list, THE Users_View SHALL display the role as a visual badge
6. FOR EACH user in the list, THE Users_View SHALL display the associated school name (not school ID)
7. FOR EACH user in the list, THE Users_View SHALL display the registration date in a human-readable format
8. FOR EACH teacher user, THE Users_View SHALL display the assigned subjects
9. FOR EACH user with super_admin role, THE Users_View SHALL display "(System-wide)" instead of a school name

### Requirement 6: User Approval Actions

**User Story:** As a superadmin, I want to approve or reject pending user requests, so that I can control who gains access to the system.

#### Acceptance Criteria

1. WHEN a user has status "pending", THE Users_View SHALL display an "Approve" action button
2. WHEN a user has status "pending", THE Users_View SHALL display a "Reject" action button
3. WHEN a superadmin clicks the "Approve" button, THE System SHALL update the user status to "verified"
4. WHEN a superadmin clicks the "Reject" button, THE System SHALL update the user status to "rejected"
5. WHEN a status update succeeds, THE System SHALL display a success notification
6. WHEN a status update fails, THE System SHALL display an error notification with details
7. WHEN a user status is updated, THE System SHALL move the user to the appropriate tab
8. THE System SHALL log all user approval and rejection actions in the audit_logs table

### Requirement 7: User Deletion

**User Story:** As a superadmin, I want to delete user accounts, so that I can remove inactive or incorrect accounts from the system.

#### Acceptance Criteria

1. FOR EACH user in the list, THE Users_View SHALL display a "Delete" action button
2. WHEN a superadmin clicks the "Delete" button, THE System SHALL display a confirmation dialog
3. THE confirmation dialog SHALL display the user's name and role
4. THE confirmation dialog SHALL warn about data implications of deletion
5. WHEN a superadmin confirms deletion, THE System SHALL delete the user account from the database
6. WHEN a user deletion succeeds, THE System SHALL display a success notification
7. WHEN a user deletion fails, THE System SHALL display an error notification with details
8. THE System SHALL prevent deletion of the currently logged-in superadmin account
9. THE System SHALL log all user deletion actions in the audit_logs table

### Requirement 8: Create New User

**User Story:** As a superadmin, I want to create new user accounts from the users view, so that I can onboard users across any school in the system.

#### Acceptance Criteria

1. THE Users_View SHALL display a "Create User" button
2. WHEN a superadmin clicks the "Create User" button, THE System SHALL display a user creation dialog
3. THE user creation dialog SHALL provide input fields for: user ID, name, email, phone, role, school, and password
4. THE user creation dialog SHALL provide a school selection dropdown showing all schools
5. THE user creation dialog SHALL provide a role selection dropdown with options: super_admin, admin, deputy, teacher
6. WHEN the role "teacher" is selected, THE user creation dialog SHALL display a subjects multi-select field
7. WHEN the role "super_admin" is selected, THE System SHALL allow creation without a school selection
8. WHEN a superadmin submits the form with valid data, THE System SHALL create a new user account with status "verified"
9. WHEN user creation succeeds, THE System SHALL display a success notification and close the dialog
10. WHEN user creation fails, THE System SHALL display an error notification with validation details
11. THE System SHALL validate that the email is unique before creating the user
12. THE System SHALL log all user creation actions in the audit_logs table

### Requirement 9: Responsive and Accessible Interface

**User Story:** As a superadmin, I want the users view to be accessible and responsive, so that I can manage users effectively on different devices.

#### Acceptance Criteria

1. THE Users_View SHALL be responsive and usable on desktop screens (1024px and wider)
2. THE Users_View SHALL be responsive and usable on tablet screens (768px to 1023px)
3. THE Users_View SHALL be responsive and usable on mobile screens (below 768px)
4. THE Users_View SHALL use semantic HTML elements for accessibility
5. THE Users_View SHALL provide keyboard navigation support for all interactive elements
6. THE Users_View SHALL use appropriate ARIA labels for screen reader compatibility
7. THE Users_View SHALL provide sufficient color contrast for text and interactive elements (WCAG AA compliant)

### Requirement 10: Performance and Loading States

**User Story:** As a superadmin, I want the users view to load efficiently and provide feedback during operations, so that I understand the system status.

#### Acceptance Criteria

1. WHEN the Users_View is loading data, THE System SHALL display a loading indicator
2. THE System SHALL fetch user data asynchronously without blocking the user interface
3. WHEN a filter or search is applied, THE System SHALL update the display within 500ms
4. WHEN an action (approve, reject, delete) is processing, THE System SHALL disable the action button and show a loading state
5. WHEN the user count exceeds 100 users, THE System SHALL implement pagination with 50 users per page
6. THE System SHALL cache user data for 30 seconds to reduce unnecessary database queries
7. WHEN data is stale, THE System SHALL refresh automatically when the Users_View regains focus

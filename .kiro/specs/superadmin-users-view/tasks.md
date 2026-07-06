# Implementation Plan: Superadmin Users View

## Overview

This implementation plan breaks down the Superadmin Users View feature into discrete, actionable development tasks. The feature creates a new `/app/users` route that enables superadministrators to view, search, filter, and manage all users across the entire Kindy Connect platform. The implementation follows existing patterns from `app.teachers.tsx` and reuses established UI components and store actions.

## Tasks

- [ ] 1. Create the users route file and basic page structure
  - Create `src/routes/app.users.tsx` following TanStack Router patterns
  - Define route using `createFileRoute` with appropriate metadata
  - Set up the basic UsersPage component structure with AppShell wrapper
  - Implement access control check for `super_admin` role
  - Display unauthorized message for non-superadmin users
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 2. Implement search and filter state management
  - [ ] 2.1 Set up local state for search and filters
    - Create state for search query (searchQuery)
    - Create state for school filter (schoolFilter)
    - Create state for role filter (roleFilter)
    - Create state for status filter (handled by tab selection)
    - Initialize filter states with appropriate default values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 2.2 Implement filtering logic with useMemo
    - Create derived filtered user list using useMemo hook
    - Apply search filter (ID, name, email - case-insensitive partial match)
    - Apply school filter (all schools or specific school)
    - Apply role filter (all roles or specific role)
    - Combine all filters with AND logic
    - _Requirements: 3.2, 3.4, 3.6, 3.8, 3.9, 2.1_

  - [ ] 2.3 Create tab-specific user lists
    - Create pending users list using useMemo (filter by status "pending")
    - Create verified users list using useMemo (filter by status "verified")
    - Create rejected users list using useMemo (filter by status "rejected")
    - Calculate and display count for each status category
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ] 3. Build the search and filter UI components
  - [ ] 3.1 Create search input component
    - Add search input field with Search icon
    - Wire up to searchQuery state
    - Display placeholder text "Search by ID, name, or email..."
    - _Requirements: 3.1, 3.2_

  - [ ] 3.2 Create filter dropdown components
    - Add school filter dropdown with "All Schools" option
    - Populate school dropdown from schools data
    - Add role filter dropdown with "All Roles" option and role options (super_admin, admin, deputy, teacher)
    - Wire up dropdowns to filter state
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.3 Display filter results count
    - Show total count of filtered users in card description
    - Update count dynamically as filters change
    - _Requirements: 2.5, 3.10_

- [ ] 4. Implement the tabbed status view
  - Add Tabs component with three tabs: Pending, Verified, Rejected
  - Display user count badges on each tab label
  - Ensure active search and filter criteria persist across tab switches
  - Configure default tab to "pending"
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 5. Create the user table component
  - [ ] 5.1 Build table structure and headers
    - Create Table component with appropriate headers
    - Add columns: User ID, Name, Email, Phone, Role, School, Registered, Status
    - Implement responsive column visibility
    - _Requirements: 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 5.2 Implement user row rendering
    - Render each user as a table row with all properties
    - Display role as a Badge component with appropriate styling
    - Display status as a Badge with color coding (verified: default, rejected: destructive, pending: secondary)
    - Format registration date to human-readable format (YYYY-MM-DD)
    - Display school name from schools data (not school ID)
    - Display "(System-wide)" for super_admin users instead of school name
    - Display subjects for teacher role users
    - Show phone number if available
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 5.3 Handle empty state
    - Display "No accounts in this category" message when list is empty
    - Center the message in the table
    - _Requirements: 2.2, 2.3_

- [ ] 6. Implement user approval and rejection actions
  - [ ] 6.1 Add action buttons for pending users
    - Add "Approve" button with Check icon for pending users
    - Add "Reject" button with X icon for pending users
    - Wire buttons to store actions (approveTeacher, rejectTeacher)
    - _Requirements: 6.1, 6.2_

  - [ ] 6.2 Implement approval handler
    - Call approveTeacher store action with user ID
    - Display success toast notification on successful approval
    - Display error toast notification on failure
    - Move user to Verified tab after successful approval
    - _Requirements: 6.3, 6.5, 6.7, 6.8_

  - [ ] 6.3 Implement rejection handler
    - Call rejectTeacher store action with user ID
    - Display success toast notification on successful rejection
    - Display error toast notification on failure
    - Move user to Rejected tab after successful rejection
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 7. Implement user deletion functionality
  - [ ] 7.1 Add delete button to user rows
    - Display "Delete" button with Trash2 icon for all users in Verified and Rejected tabs
    - Conditionally disable delete button for currently logged-in superadmin
    - _Requirements: 7.1, 7.8_

  - [ ] 7.2 Create delete confirmation dialog
    - Display confirmation dialog when delete button is clicked
    - Show user's name and role in the dialog
    - Add warning message about data implications
    - Provide "Cancel" and "Confirm Delete" buttons
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 7.3 Implement delete handler
    - Call deleteUser store action with user ID on confirmation
    - Display success toast notification on successful deletion
    - Display error toast notification on failure
    - Remove user from the displayed list after successful deletion
    - _Requirements: 7.5, 7.6, 7.7, 7.9_

- [ ] 8. Checkpoint - Basic viewing and management complete
  - Verify users view displays correctly with all filters
  - Test approval and rejection workflows
  - Test deletion workflow with confirmation
  - Verify tab switching maintains filters
  - Ensure all tests pass, ask the user if questions arise

- [ ] 9. Implement create user functionality
  - [ ] 9.1 Set up create user dialog and form state
    - Add "Create User" button in CardHeader
    - Create Dialog component for user creation
    - Set up form state with fields: id, name, email, phone, role, schoolId, password, subjects
    - Initialize form with default values
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 9.2 Build create user form inputs
    - Add User ID input field
    - Add Name input field
    - Add Email input field (type="email")
    - Add Phone input field
    - Add Role dropdown with options: super_admin, admin, deputy, teacher
    - Add School dropdown (conditionally shown when role is not super_admin)
    - Add Password input field with default value
    - Add Subjects multi-select checkboxes (conditionally shown when role is teacher)
    - Wire all inputs to form state
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 9.3 Implement form validation
    - Validate all required fields are filled
    - Validate email format
    - Validate at least one subject selected for teacher role
    - Validate school selection for non-super_admin roles
    - Display validation errors with toast notifications
    - _Requirements: 8.10, 8.11_

  - [ ] 9.4 Implement user creation handler
    - Call registerUser store action with form data
    - Set user status to "verified" for admin-created accounts
    - Handle conditional schoolId (undefined for super_admin role)
    - Handle conditional subjects (only for teacher role)
    - Display success toast notification on successful creation
    - Display error toast notification on failure
    - Close dialog and reset form on success
    - _Requirements: 8.8, 8.9, 8.10, 8.11, 8.12_

- [ ] 10. Update navigation menu
  - Open `src/components/app-shell.tsx`
  - Add conditional "Users" navigation link that displays only for super_admin role
  - Use Link component to navigate to "/app/users"
  - Position link appropriately in the navigation menu
  - _Requirements: 1.1, 1.2_

- [ ] 11. Implement loading and performance optimizations
  - [ ] 11.1 Add loading states
    - Display loading indicator when data is being fetched
    - Disable action buttons and show loading state during async operations
    - Use Skeleton components or spinner for initial page load
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 11.2 Optimize performance
    - Ensure useMemo is used for all filtered lists
    - Verify filter updates happen within 500ms
    - Implement pagination if user count exceeds 100 (50 users per page)
    - _Requirements: 10.3, 10.5_

- [ ] 12. Implement responsive design
  - Add responsive styles for desktop (1024px+)
  - Add responsive styles for tablet (768px-1023px)
  - Add responsive styles for mobile (below 768px)
  - Ensure filters stack vertically on mobile
  - Ensure table scrolls horizontally on small screens
  - Test all breakpoints and adjust as needed
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 13. Enhance accessibility
  - [ ] 13.1 Add semantic HTML and ARIA labels
    - Use semantic HTML elements (table, th, td)
    - Add appropriate ARIA labels to form inputs
    - Add aria-label to icon-only buttons
    - Ensure all interactive elements are keyboard accessible
    - _Requirements: 9.4, 9.5, 9.6_

  - [ ] 13.2 Implement keyboard navigation
    - Verify tab order is logical
    - Ensure focus indicators are visible
    - Implement focus trap in dialogs
    - Return focus to trigger element when dialog closes
    - _Requirements: 9.5_

  - [ ] 13.3 Verify color contrast
    - Check text contrast meets WCAG AA standards (4.5:1)
    - Check interactive element contrast meets standards (3:1)
    - Test with color blindness simulators if available
    - _Requirements: 9.7_

- [ ] 14. Final checkpoint and integration testing
  - Test complete user management workflow end-to-end
  - Verify all requirements are met
  - Test error scenarios (network failures, validation errors)
  - Verify audit logging for all actions (if audit_logs integration exists)
  - Test with different screen sizes and devices
  - Verify keyboard navigation and screen reader compatibility
  - Ensure all tests pass, ask the user if questions arise

## Notes

- This feature does NOT include property-based tests as the design document has no Correctness Properties section
- Unit tests and integration tests should be created to verify search, filter, CRUD operations, and access control
- All code should follow existing patterns from `app.teachers.tsx` for consistency
- Reuse existing UI components (Card, Table, Dialog, Tabs, Badge, Button, Input) wherever possible
- Use existing store actions (approveTeacher, rejectTeacher, deleteUser, registerUser) without modification
- Checkpoint tasks ensure incremental validation and provide opportunities for user feedback
- Responsive design and accessibility are critical for superadmin workflows
- All user management actions should be logged to audit_logs table if the integration exists

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "10"] },
    { "id": 1, "tasks": ["2.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "4", "5.1", "9.2"] },
    { "id": 3, "tasks": ["2.3", "3.2", "5.2", "9.3"] },
    { "id": 4, "tasks": ["3.3", "5.3", "6.1", "7.1", "9.4"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.2", "11.1"] },
    { "id": 6, "tasks": ["7.3", "11.2"] },
    { "id": 7, "tasks": ["8", "12", "13.1"] },
    { "id": 8, "tasks": ["13.2", "13.3"] },
    { "id": 9, "tasks": ["14"] }
  ]
}
```

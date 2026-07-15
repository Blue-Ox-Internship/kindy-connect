# Implementation Plan: Shared Password Authentication

## Overview

This implementation plan breaks down the shared password authentication feature into discrete, actionable development tasks. The feature extends the existing Kindy Connect authentication system to support dual-password mechanisms: individual passwords for superadmins and a shared password for all other user roles (teachers, school admins, deputies).

The implementation follows a layered architecture approach, building from utilities up through services to handler modifications. Each task is designed to be incremental, with testing integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up authentication module structure and install dependencies
  - Create new directory `src/lib/auth/` for authentication modules
  - Install bcrypt package: `npm install bcrypt @types/bcrypt`
  - Create index file to export authentication modules
  - _Requirements: 4.2, 7.1_

- [ ] 2. Implement password utility functions
  - [ ] 2.1 Create password-utils.ts with hashPassword and comparePasswords functions
    - Implement `hashPassword(password: string): Promise<string>` using bcrypt with work factor 12
    - Implement `comparePasswords(password: string, hash: string): Promise<boolean>` with timing-safe comparison
    - Add input validation for empty/null passwords
    - Add proper TypeScript types and JSDoc documentation
    - _Requirements: 4.2, 4.4_

  - [ ]\* 2.2 Write property test for password hash format validation
    - **Property 7: Password Hash Format Validation**
    - **Validates: Requirements 4.2**
    - Generate arbitrary plaintext passwords (length 8-72)
    - Assert output matches bcrypt hash format regex: `/^\$2[aby]\$\d{2}\$.{53}$/`
    - Verify hash starts with $2a$ or $2b$

  - [ ]\* 2.3 Write property test for password comparison round-trip
    - **Property 12: Password Comparison Round-Trip**
    - **Validates: Requirements 1.1, 2.1, 4.4**
    - Generate random password P and hash it to produce H
    - Assert comparePasswords(P, H) returns true
    - Generate different password P' and assert comparePasswords(P', H) returns false

  - [ ]\* 2.4 Write unit tests for password utilities edge cases
    - Test empty password handling
    - Test passwords with special characters and unicode
    - Test password length at bcrypt limit (72 characters)
    - Test null/undefined input handling

- [ ] 3. Implement authentication configuration module
  - [ ] 3.1 Create config.ts with environment variable management
    - Implement `getSharedPasswordHash(): string` that reads SHARED_PASSWORD_HASH from environment
    - Implement `getSessionExpirationMs(): number` with default 8 hours (28,800,000ms)
    - Add validation to throw error if SHARED_PASSWORD_HASH is not set
    - Add TypeScript types for configuration interface
    - _Requirements: 4.1, 4.3, 6.2_

  - [ ]\* 3.2 Write unit tests for configuration module
    - Test getSharedPasswordHash with valid environment variable
    - Test error thrown when SHARED_PASSWORD_HASH is missing
    - Test getSessionExpirationMs returns correct default value

- [ ] 4. Checkpoint - Verify utilities and configuration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement authentication service module
  - [ ] 5.1 Create auth-service.ts with core authentication logic
    - Define `AuthenticationResult` interface with success, user, sessionToken, error fields
    - Implement `authenticate(userId: string, password: string): Promise<AuthenticationResult>` function
    - Add user lookup from database using existing sql client
    - Implement role-based routing logic (superadmin vs non-superadmin)
    - Add generic error message handling for all failure scenarios
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2_

  - [ ] 5.2 Implement superadmin authentication function
    - Create `authenticateSuperadmin(user: User, password: string): Promise<boolean>`
    - Validate password against user's individual password hash from database
    - Use comparePasswords utility for timing-safe comparison
    - Return boolean indicating authentication success
    - _Requirements: 1.1, 1.2_

  - [ ] 5.3 Implement non-superadmin authentication function
    - Create `authenticateNonSuperadmin(user: User, password: string): Promise<boolean>`
    - Validate password against shared password hash from configuration
    - Use comparePasswords utility for timing-safe comparison
    - Ignore user's individual password field
    - Return boolean indicating authentication success
    - _Requirements: 2.1, 2.2_

  - [ ] 5.4 Implement session token creation function
    - Create `createSessionToken(user: User): string` function
    - Generate JWT containing userId, userRole, issuedAt, and expiresAt fields
    - Use VITE_AUTH_SECRET environment variable for JWT signing
    - Calculate expiration as issuedAt + 8 hours
    - _Requirements: 1.3, 2.3, 6.1, 6.2, 6.3_

  - [ ]\* 5.5 Write property test for superadmin individual password validation
    - **Property 1: Superadmin Individual Password Validation**
    - **Validates: Requirements 1.1**
    - Generate arbitrary superadmin user and password
    - Hash password and store as user's individual password
    - Call authenticate and assert success
    - Verify system validated against individual hash (not shared password)

  - [ ]\* 5.6 Write property test for incorrect password rejection
    - **Property 2: Incorrect Password Rejection**
    - **Validates: Requirements 1.2, 2.2**
    - Generate user with correct password
    - Generate different incorrect password
    - Call authenticate with incorrect password
    - Assert authentication fails with generic error message

  - [ ]\* 5.7 Write property test for non-superadmin shared password validation
    - **Property 3: Non-Superadmin Shared Password Validation**
    - **Validates: Requirements 2.1**
    - Generate non-superadmin user (admin/deputy/teacher role)
    - Store individual password in user record (should be ignored)
    - Call authenticate with shared password
    - Assert authentication succeeds
    - Verify system used shared password, not individual password field

  - [ ]\* 5.8 Write property test for unique user identification with shared password
    - **Property 4: Unique User Identification with Shared Password**
    - **Validates: Requirements 2.4**
    - Generate two distinct non-superadmin users
    - Authenticate both with shared password
    - Assert both authentications succeed
    - Assert session tokens contain different user IDs

  - [ ]\* 5.9 Write property test for role-based authentication routing
    - **Property 5: Role-Based Authentication Routing**
    - **Validates: Requirements 3.1, 3.3, 3.4**
    - Generate user with random role (super_admin/admin/deputy/teacher)
    - Call authenticate with appropriate password
    - Assert system retrieved user role from database
    - Assert correct validation path was used based on role

  - [ ]\* 5.10 Write property test for invalid user rejection
    - **Property 6: Invalid User Rejection**
    - **Validates: Requirements 3.2**
    - Generate non-existent user ID
    - Call authenticate with random password
    - Assert authentication fails with generic error message

  - [ ]\* 5.11 Write property test for generic error messages
    - **Property 8: Generic Error Messages**
    - **Validates: Requirements 5.1, 5.2, 5.4**
    - Generate various failure scenarios (non-existent user, incorrect password)
    - Assert all failures return same error message: "Authentication failed"
    - Verify no user-specific or role information in error messages

  - [ ]\* 5.12 Write property test for session token content
    - **Property 10: Session Token Content**
    - **Validates: Requirements 1.3, 2.3, 6.1, 6.3**
    - Generate user with any role and authenticate successfully
    - Decode session token
    - Assert token contains userId matching authenticated user
    - Assert token contains userRole matching user's role

  - [ ]\* 5.13 Write property test for session expiration calculation
    - **Property 11: Session Expiration Calculation**
    - **Validates: Requirements 6.2**
    - Create session token at arbitrary time T
    - Decode token and verify expiresAt equals issuedAt + 8 hours (28,800,000ms)

  - [ ]\* 5.14 Write unit tests for authentication service
    - Test typical superadmin login (happy path)
    - Test typical non-superadmin login (happy path)
    - Test database connection failure handling
    - Test invalid bcrypt hash format handling
    - Test concurrent non-superadmin logins with shared password

- [ ] 6. Checkpoint - Verify authentication service
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement audit logging for authentication failures
  - [ ] 7.1 Add authentication failure logging to auth-service
    - Import or create audit logging utility
    - Add log entries for authentication failures with userId, timestamp, and error type
    - Ensure logs contain internal details while client receives generic errors
    - Log to appropriate destination (console, file, or audit_logs table)
    - _Requirements: 5.3_

  - [ ]\* 7.2 Write property test for authentication failure audit logging
    - **Property 9: Authentication Failure Audit Logging**
    - **Validates: Requirements 5.3**
    - Generate authentication failure scenario
    - Call authenticate with incorrect credentials
    - Assert logger was called with audit entry containing userId, timestamp, error type
    - Assert client receives only generic error message

- [ ] 8. Update loginUser handler in db-functions.ts
  - [ ] 8.1 Modify loginUser to accept password parameter
    - Update validator to accept `{ id: string; password: string }`
    - Import authenticate function from auth-service
    - Replace current user lookup logic with authenticate call
    - Maintain existing teacher status verification logic
    - Return null for authentication failures (maintain current error handling pattern)
    - Add proper error handling and logging
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.3, 3.4, 7.2_

  - [ ]\* 8.2 Write integration tests for loginUser handler
    - Test loginUser with valid superadmin credentials
    - Test loginUser with valid non-superadmin credentials using shared password
    - Test loginUser with invalid credentials
    - Test loginUser with non-existent user ID
    - Test teacher status verification still works

  - [ ]\* 8.3 Write property test for backward compatibility
    - **Property 13: Backward Compatibility for Existing Superadmins**
    - **Validates: Requirements 7.2, 7.3**
    - Create superadmin user with pre-existing bcrypt password hash
    - Call authenticate with original password
    - Assert authentication succeeds without modification
    - Assert no password reset required
    - Verify user's password hash unchanged after authentication

- [ ] 9. Update environment configuration files
  - [ ] 9.1 Add SHARED_PASSWORD_HASH to .env.example
    - Add comment explaining this should be a bcrypt hash of the shared password
    - Add comment with example command to generate hash: `bcrypt.hash("your-password", 12)`
    - Do not add actual hash value to .env.example
    - _Requirements: 4.1_

  - [ ] 9.2 Create documentation for generating shared password hash
    - Create utility script or document steps to generate bcrypt hash for shared password
    - Include instructions for system administrators
    - Document how to update shared password without system restart

- [ ] 10. Update frontend login form (if needed)
  - [ ] 10.1 Check and update login form to include password field
    - Locate login form component (likely in src/routes/ or src/components/)
    - Ensure form collects both user ID and password
    - Update form submission to send password to loginUser
    - Add appropriate input validation

- [ ] 11. Create initial superadmin password hashes
  - [ ] 11.1 Hash existing superadmin passwords
    - Use hashPassword utility to generate bcrypt hashes for existing superadmins
    - Update database records with hashed passwords
    - Document the process for future superadmin password creation
    - _Requirements: 7.1, 7.2_

- [ ] 12. Final integration and testing
  - [ ] 12.1 End-to-end manual testing
    - Test superadmin login flow with individual password
    - Test multiple non-superadmins logging in with shared password
    - Verify unique sessions created for each user
    - Test authentication failure scenarios
    - Verify audit logging works correctly

  - [ ] 12.2 Verify all acceptance criteria met
    - Review requirements document and verify each acceptance criterion
    - Confirm backward compatibility for existing superadmins
    - Validate security measures (timing-safe comparison, generic errors)

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and provide opportunities to address issues
- The implementation builds incrementally from utilities up through services to handlers
- TypeScript is used throughout for type safety
- bcrypt work factor 12 balances security and performance
- All authentication failures return generic "Authentication failed" message to prevent information leakage
- Session tokens are JWTs with 8-hour expiration
- Existing superadmin passwords remain unchanged (backward compatibility)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4"] },
    {
      "id": 5,
      "tasks": ["5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "5.13", "5.14", "7.1"]
    },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "9.1", "9.2", "10.1"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["12.1", "12.2"] }
  ]
}
```

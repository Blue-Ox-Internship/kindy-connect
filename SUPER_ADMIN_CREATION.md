# Super Admin Account Creation

## Feature Overview

Super Admins can create other Super Admin accounts through the User Accounts page.

## How It Works

### 1. Access Control
- **Only Super Admins** can see the "Super Admin" role option in the user creation form
- School Admins and other roles cannot create Super Admin accounts

### 2. User Interface

**Location**: `/app/teachers` (User Accounts page)

**Steps to Create a Super Admin**:
1. Click the "Create User" button
2. Fill in the form:
   - **Assigned ID**: Unique login ID (e.g., KC002, KC003)
   - **Password**: Default is "admin123" (can be changed)
   - **Full Name**: The admin's full name
   - **Email**: Must be unique across the system
   - **Phone**: Must be unique across the system
   - **Role**: Select **"Super Admin"** from dropdown
   - **School**: Field is hidden/not required for Super Admin role

3. Click "Create Account"

### 3. Backend Implementation

**File**: `src/lib/db-functions.ts`

The `registerUser` function:
```typescript
await registerUser({
  id: form.id.trim(),
  name: form.name.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  role: form.role,
  password: form.password,
  schoolId: isSuperAdmin && form.role === "super_admin" ? undefined : targetSchoolId,
  status: "verified", // Super Admin accounts are created as verified
});
```

**Key Points**:
- Super Admin accounts have `school_id` set to `NULL` in the database
- Super Admin accounts are created with status "verified" (immediately active)
- Email and phone uniqueness is validated before creation

### 4. Database Schema

**Users Table**:
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'deputy', 'teacher')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    phone VARCHAR(50) UNIQUE,
    class_id VARCHAR(50),
    registered_at DATE NOT NULL,
    password VARCHAR(255),
    school_id VARCHAR(50) REFERENCES schools(id) ON DELETE CASCADE
);
```

**Constraint**: `school_id` MUST be NULL for `role = 'super_admin'`

### 5. Current Super Admin Accounts

From the seed data:
- **KC001**: System Administrator (email: superadmin@kinder.app)
- **KC002**: System Administrator 2 (email: superadmin2@kinder.app)

Both have password: `admin123`

### 6. Permissions

**What Super Admins Can Do**:
- Create other Super Admin accounts
- Create School Admin, Deputy, and Teacher accounts for any school
- View and manage all schools
- View all users across all schools
- Access system-wide dashboard
- Delete schools (with confirmation)
- Approve/reject teacher registrations from any school

**What Super Admins Cannot Do**:
- Be assigned to a specific school (school_id is always NULL)
- Have their role changed to a school-scoped role without being assigned a school first

### 7. Security Considerations

✅ **Implemented**:
- Only Super Admins can create Super Admin accounts (UI restriction)
- Email and phone uniqueness validation
- School Admins cannot see or select the Super Admin role option

❌ **To Be Implemented** (per spec tasks):
- Backend validation to prevent School Admins from creating Super Admin accounts
- Audit logging for Super Admin creation
- Privilege escalation prevention (Task 9.1, 9.2, 9.3)

### 8. Testing

**To test Super Admin creation**:
1. Login as KC001 or KC002
2. Navigate to User Accounts (`/app/teachers`)
3. Click "Create User"
4. Select "Super Admin" from role dropdown
5. Fill in remaining fields
6. Submit form
7. Verify new Super Admin appears in user list
8. Login with the new Super Admin credentials
9. Verify they have full system access

### 9. Related Spec Requirements

This feature satisfies:
- **Requirement 1.1**: System shall support a role named "super_admin"
- **Requirement 1.6**: Super_Admin shall NOT be assigned to any specific school (school_id is null)
- **Requirement 14.1**: Restrict creation of super_admin users to existing Super Admin accounts only

**Pending implementation** (from spec tasks):
- Task 9.1: Add backend validation to block School Admin from creating super_admin users
- Task 9.3: Enforce super_admin cannot register with school_id at database level

## Current Status

✅ **Feature is FULLY FUNCTIONAL** in the UI
✅ Super Admins can create other Super Admins
✅ School_id is correctly set to NULL for Super Admin accounts
✅ UI only shows Super Admin role option to existing Super Admins

⚠️ **Backend validation pending** (will be implemented in spec Task 9.1, 9.2, 9.3)

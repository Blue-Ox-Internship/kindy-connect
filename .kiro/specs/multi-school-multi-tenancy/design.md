# Design Document: Multi-School Multi-Tenancy

## Overview

This design transforms Kindy Connect from a single-school kindergarten management system into a multi-tenant SaaS platform. The architecture introduces a Super Admin role who manages multiple schools, while ensuring complete data isolation between schools at the database level through Row Level Security (RLS). Each school operates independently with its own admin, staff, and pupils, with no cross-school data visibility.

## Architecture

### Technology Stack

- **Frontend**: React 19 with TanStack Router
- **Backend**: TanStack Start (server functions running on Nitro runtime)
- **Database**: PostgreSQL with `postgres` library
- **State Management**: React Context (MockStoreProvider)
- **Authentication**: Session-based (localStorage)

### Multi-Tenancy Model

**Tenant Isolation Strategy**: Database-level isolation using school_id foreign keys + Row Level Security (RLS) policies

**Key Principles**:
1. **Data Partitioning**: All tenant-scoped tables have a `school_id` column
2. **Role Hierarchy**: `super_admin` (system-wide) > `admin` (school-wide) > `deputy` > `teacher`
3. **Session Context**: User sessions carry `school_id` for school-scoped users
4. **RLS Enforcement**: PostgreSQL RLS policies enforce tenant boundaries at the database layer


## Components and Interfaces

### 1. Database Schema Changes

**Schools Table** (already exists):
```sql
CREATE TABLE schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

**Updated Users Table** (school_id already present):
- Add constraint: `school_id` must be NULL for `super_admin`, NOT NULL for other roles
- Index on `school_id` for performance (already exists)

**Multi-Tenant Tables** (school_id already present):
- `users.school_id` → references `schools.id`
- `classes.school_id` → references `schools.id`
- `pupils.school_id` → references `schools.id`
- `parents.school_id` → references `schools.id`

**Derived Multi-Tenancy**:
- `attendance` → filtered via `pupil.school_id`
- `notifications` → filtered via `pupil.school_id`
- `marks` → filtered via `pupil.school_id`
- `audit_logs` → filtered via `actor.school_id` (for school-scoped users)


### 2. Row Level Security (RLS) Policies

**Purpose**: Enforce tenant isolation at the database level, independent of application code.

**Policy Structure** for each multi-tenant table:

```sql
-- Enable RLS on table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin bypass (sees all data)
CREATE POLICY super_admin_all ON <table_name>
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = current_setting('app.user_id', true)
            AND users.role = 'super_admin'
        )
    );

-- Policy 2: School-scoped users (see only their school's data)
CREATE POLICY school_scoped_access ON <table_name>
    FOR ALL
    USING (
        school_id = current_setting('app.school_id', true)::VARCHAR
    );
```

**Tables Requiring RLS**:
- `users`
- `classes`
- `pupils`
- `parents`
- `attendance` (via pupil's school_id)
- `notifications` (via pupil's school_id)
- `marks` (via pupil's school_id)

**RLS Context Variables**:
- `app.user_id`: Set at the start of each database transaction
- `app.school_id`: Set for school-scoped users; NULL for super_admin

**Super Admin User ID**: The system Super Admin account uses the fixed ID `KC001`.


### 3. Session Management

**Session Storage**: `localStorage` with key `kinder.currentUserId`

**Session Structure**:
```typescript
interface Session {
  userId: string;
  schoolId?: string;  // Present for school-scoped users, null for super_admin
  role: "super_admin" | "admin" | "deputy" | "teacher";
}
```

**Session Lifecycle**:
1. **Login**: `loginUser()` validates credentials, stores `userId`
2. **Session Hydration**: On app load, fetch user from `userId` → derive `schoolId` and `role`
3. **School Context Switch** (Super Admin only): Update session with selected `schoolId`
4. **Logout**: Clear `userId` from localStorage

**Server Function Context**:
- Extract `userId` from session on every server function call
- Query user table to get `role` and `school_id`
- Set PostgreSQL session variables:
  - `SET LOCAL app.user_id = <userId>`
  - `SET LOCAL app.school_id = <schoolId>` (or NULL for super_admin)
- RLS policies automatically filter queries based on these variables


### 4. React Context State Management

**Current Implementation**: `MockStoreProvider` provides global state

**Required Changes**:

```typescript
interface Store {
  currentUser: User | null;
  selectedSchoolId: string | null;  // NEW: For Super Admin context switching
  
  // Data arrays (already filtered by useMemo hooks)
  users: User[];
  pupils: Pupil[];
  parents: Parent[];
  classes: ClassRoom[];
  attendance: Attendance[];
  notifications: Notification[];
  audit: AuditLog[];
  marks: Mark[];
  schools: School[];  // NEW: Already exists
  
  // School management functions
  addSchool: (data) => Promise<void>;
  updateSchool: (id, data) => Promise<void>;
  deleteSchool: (id) => Promise<void>;
  
  // NEW: School context switching (Super Admin only)
  setSchoolContext: (schoolId: string | null) => void;
}
```

**Client-Side Filtering** (already implemented):
- `filteredUsers`: Filter by `currentUser.schoolId` unless super_admin
- `filteredPupils`: Filter by `currentUser.schoolId` unless super_admin
- Similar filtering for parents, classes, attendance, notifications, audit, marks

**Note**: Client-side filtering provides UI experience, but RLS is the security boundary.


### 5. Server Functions (API Layer)

**Authentication Wrapper**: Add RLS context setting to all server functions

```typescript
// Utility function to set RLS context
async function setRLSContext(sql: Sql, userId: string) {
  const users = await sql`SELECT role, school_id FROM users WHERE id = ${userId}`;
  if (users.length === 0) throw new Error("Unauthorized");
  
  const user = users[0];
  await sql`SET LOCAL app.user_id = ${userId}`;
  
  if (user.role !== 'super_admin') {
    await sql`SET LOCAL app.school_id = ${user.school_id}`;
  }
}

// Example: Wrap existing server functions
export const getInitialData = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const userId = extractUserIdFromSession(request);
    if (!userId) throw new Error("Not authenticated");
    
    try {
      await sql.begin(async (sql) => {
        await setRLSContext(sql, userId);
        
        // RLS automatically filters these queries
        const schools = await sql`SELECT * FROM schools ORDER BY name ASC`;
        const users = await sql`SELECT * FROM users ORDER BY registered_at DESC`;
        // ... rest of queries
      });
    } catch (error) {
      console.error("Error in getInitialData:", error);
      throw error;
    }
  });
```

**Required Updates**:
- All server functions must call `setRLSContext()` at the start of transactions
- Super Admin bypass: Skip RLS context for super_admin role
- School context switching: Allow super_admin to optionally set `app.school_id`


### 6. UI Components

#### School Selector (Super Admin Only)

**Component**: `SchoolSelector.tsx`

**Functionality**:
- Dropdown showing all schools
- Option: "All Schools" (system-wide view)
- On selection: Update `selectedSchoolId` in context
- Persist selection in sessionStorage

**Location**: App shell sidebar (only visible to super_admin)

```typescript
function SchoolSelector() {
  const { currentUser, schools, selectedSchoolId, setSchoolContext } = useStore();
  
  if (currentUser?.role !== 'super_admin') return null;
  
  return (
    <Select value={selectedSchoolId || 'all'} onValueChange={setSchoolContext}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>All Schools</SelectItem>
        {schools.map(school => (
          <SelectItem key={school.id} value={school.id}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```


#### Super Admin Dashboard

**Route**: `/app/dashboard` (for super_admin role)

**Components**:
- System Statistics Card:
  - Total Schools
  - Total Pupils (across all schools)
  - Total Admins
  - System Activity Count (last 30 days)
  
- Schools Table:
  - Columns: School Name, Pupils, Classes, Staff, Actions
  - Actions: View, Edit, Delete (with confirmation)
  
- Recent Audit Logs (system-wide):
  - Display last 50 audit entries from all schools
  - Include school name in log display

**Data Source**: `store.schools`, `store.users`, `store.pupils`, `store.classes`, `store.audit`

#### School Admin Dashboard

**Route**: `/app/dashboard` (for admin, deputy, teacher roles)

**Components**:
- School Banner: Display school name (from `currentUser.schoolId`)
- School Statistics Card:
  - Total Pupils (in school)
  - Classes (in school)
  - Present Today (in school)
  - Absent Today (in school)
  
- Recent Activity (school-scoped):
  - Attendance logs
  - Marks entries
  - Audit logs (filtered by school)

**Data Source**: Filtered by `currentUser.schoolId`


#### Schools Management Page

**Route**: `/app/schools` (super_admin only)

**Functionality**:
- List all schools in table format
- Add new school (form: name, address, phone, email)
- Edit school details
- Delete school (with cascade warning)
- View school statistics

**Actions**:
- Create School → Opens dialog with form
- Edit School → Opens dialog pre-filled with school data
- Delete School → Shows confirmation with data count warning

#### Navigation Menu Updates

**Super Admin Navigation**:
- Dashboard (system-wide)
- Schools (management)
- Users (all schools, with school column)
- Classes (all schools, with school column)
- Audit Log (system-wide)

**School Admin Navigation**:
- Dashboard (school-scoped)
- Pupils (school-scoped)
- Parents (school-scoped)
- Teachers (school-scoped)
- Classes (school-scoped)
- Attendance (school-scoped)
- Marks (school-scoped)
- Reports (school-scoped)
- Audit Log (school-scoped)

**Teacher Navigation**:
- My Class (single class view)
- Attendance (class-scoped)
- Marks (class-scoped)


## Data Models

### User Model (Updated)

```typescript
interface User {
  id: string;          // Fixed ID "KC001" for Super Admin
  name: string;
  email: string;
  role: "super_admin" | "admin" | "deputy" | "teacher";
  status: "pending" | "verified" | "rejected";
  phone?: string;
  classId?: string;  // Only for teachers
  schoolId?: string;  // NULL for super_admin, NOT NULL for others
  registeredAt: string;
  password?: string;
}
```

**Validation Rules**:
- `schoolId` MUST be NULL if `role === 'super_admin'`
- `schoolId` MUST NOT be NULL if `role !== 'super_admin'`
- Email must be unique across the system

### School Model

```typescript
interface School {
  id: string;          // Format: "s-<random>"
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  registeredAt: string;
}
```

### Pupil Model (Updated)

```typescript
interface Pupil {
  id: string;
  admissionNo: string;  // Unique across system
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dob: string;
  classId: string;
  photo?: string;
  active: boolean;
  parentIds: string[];
  schoolId: string;     // NEW: Required for tenant isolation
}
```


### Parent Model (Updated)

```typescript
interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  schoolId: string;  // NEW: Required for tenant isolation
}
```

### ClassRoom Model (Updated)

```typescript
interface ClassRoom {
  id: string;
  name: string;
  teacherId?: string;
  schoolId: string;  // NEW: Required for tenant isolation
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: School-scoped users cannot access other schools' data

*For any* school-scoped user (admin, deputy, teacher) and any data query, the returned results SHALL only include records where `school_id` matches the user's assigned `school_id`.

**Validates: Requirements 3.2, 4.2, 4.4, 4.5, 6.1**

### Property 2: Super Admin has unrestricted access

*For any* Super Admin user and any data query, the query SHALL return all records across all schools without `school_id` filtering.

**Validates: Requirements 1.2, 1.4**


### Property 3: RLS policies enforce tenant boundaries

*For any* database query executed with `app.school_id` set, the RLS policies SHALL automatically filter results to only include records matching that `school_id`.

**Validates: Requirements 4.3, 10.1, 10.2, 10.3, 10.4**

### Property 4: School deletion cascades correctly

*For any* school that is deleted, all associated records (users, classes, pupils, parents, attendance, notifications, marks) SHALL be deleted or set to NULL.

**Validates: Requirements 2.4, 15.2**

### Property 5: User role constraints are enforced

*For any* user with role 'super_admin', `school_id` SHALL be NULL. *For any* user with role in ['admin', 'deputy', 'teacher'], `school_id` SHALL NOT be NULL.

**Validates: Requirements 1.6, 3.1, 14.4**

### Property 6: School context switching preserves data isolation

*For any* Super Admin who switches school context, subsequent queries SHALL be filtered by the selected `school_id` until context is cleared or changed.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 7: Notifications respect tenant boundaries

*For any* notification generated for a pupil, only parents associated with that pupil's school SHALL receive the notification.

**Validates: Requirements 4.6, 17.2, 17.4**


### Property 8: Cross-school user creation is prevented

*For any* School Admin attempting to create a user, the created user's `school_id` SHALL match the School Admin's `school_id`.

**Validates: Requirements 3.4, 14.2**

### Property 9: Audit logs maintain school context

*For any* audit log entry created by a school-scoped user, the entry SHALL be filterable by the user's `school_id`.

**Validates: Requirements 4.7, 12.4**

### Property 10: Reports respect tenant isolation

*For any* report generated by a school-scoped user, the report SHALL only include data from that user's school.

**Validates: Requirements 20.1, 20.2, 20.3**

## Error Handling

### Authentication Errors

- **Unauthorized Access**: Return HTTP 401 with message "Not authenticated"
- **Invalid Credentials**: Return HTTP 403 with message "Invalid credentials"
- **Session Expired**: Clear session, redirect to login page

### Authorization Errors

- **Insufficient Permissions**: Return HTTP 403 with message "Insufficient permissions"
- **Cross-Tenant Access Attempt**: Return HTTP 403, log to audit trail
- **Privilege Escalation Attempt**: Return HTTP 403, log to audit trail with high severity


### Database Errors

- **Foreign Key Violation**: Return HTTP 400 with descriptive message
- **Unique Constraint Violation**: Return HTTP 409 with field-specific message
- **School Not Found**: Return HTTP 404 with message "School not found"
- **RLS Policy Rejection**: Return HTTP 403 with message "Access denied by security policy"

### Validation Errors

- **Missing Required Field**: Return HTTP 400 with field name
- **Invalid School Context**: Return HTTP 400 with message "Invalid school context"
- **Invalid Role Assignment**: Return HTTP 400 with message "Invalid role for school assignment"

### Cascade Deletion Safety

- **Active Pupils Exist**: Show confirmation dialog listing counts
- **Warn Before Delete**: "This will permanently delete X pupils, Y classes, Z users"
- **Require Explicit Confirmation**: Two-step confirmation for school deletion

## Testing Strategy

### Unit Tests

**Focus Areas**:
- User validation (role vs school_id constraints)
- Session management (context switching, persistence)
- Data filtering logic (client-side filters)
- Error handling for authorization failures

**Example Tests**:
- "Super admin user has null school_id"
- "School admin cannot have null school_id"
- "Filtered pupils only include current school"
- "School selector only visible to super admin"


### Integration Tests

**Focus Areas**:
- End-to-end tenant isolation (database queries)
- RLS policy enforcement
- School CRUD operations with cascading
- Multi-user scenarios (super admin + school admin)
- Session persistence across page reloads

**Example Tests**:
- "School admin queries only return their school's data"
- "RLS blocks unauthorized cross-school access"
- "Deleting school cascades to all related records"
- "Super admin can switch school context and see filtered data"
- "Notifications only sent to parents in same school as pupil"

### Property-Based Tests

**Test Library**: fast-check (TypeScript property-based testing)

**Configuration**: Minimum 100 iterations per property test

**Property Test Suite**:

Each property defined in the Correctness Properties section will have a corresponding property-based test:

1. **Property 1 Test**: Generate random users (admin, deputy, teacher) with school assignments, generate random data across multiple schools, verify queries return only matching school_id
2. **Property 2 Test**: Generate super_admin users, generate random multi-school data, verify queries return all data
3. **Property 3 Test**: Set random school_id in RLS context, execute queries, verify all results match context
4. **Property 4 Test**: Create random schools with related data, delete school, verify all related records are gone
5. **Property 5 Test**: Generate random users, verify super_admin has null school_id, verify others have non-null school_id
6. **Property 6 Test**: Super admin switches to random school contexts, verify queries filter correctly
7. **Property 7 Test**: Generate random pupils and parents, send notifications, verify only same-school parents receive them
8. **Property 8 Test**: School admin attempts to create users, verify all created users have matching school_id
9. **Property 9 Test**: School-scoped users create audit logs, verify logs are filterable by school_id
10. **Property 10 Test**: Generate reports for school-scoped users, verify data only from their school

**Test Tags**: Each test will include a comment:
- `// Feature: multi-school-multi-tenancy, Property N: <property text>`


### Manual Testing Scenarios

**Super Admin Workflows**:
1. Create multiple schools
2. Create users for each school
3. Switch between school contexts
4. Verify data visibility changes
5. Delete a school and verify cascade
6. View system-wide dashboard

**School Admin Workflows**:
1. Login as school admin
2. Verify dashboard shows only their school
3. Attempt to access other schools' data (should fail)
4. Create pupils, parents, classes within school
5. Generate reports (should only show their school)

**Cross-School Isolation Testing**:
1. Create 2 schools with identical data structure
2. Login as admin for School A
3. Verify cannot see School B's pupils/classes
4. Login as admin for School B
5. Verify cannot see School A's pupils/classes

**RLS Policy Testing**:
1. Execute raw SQL queries with different RLS contexts
2. Verify super_admin bypass works
3. Verify school_id filtering works
4. Test policy enforcement on INSERT/UPDATE/DELETE


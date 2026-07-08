# School Admin User ID Assignment - Implementation Details

## User Query

> "for other admins and users, the id should be assigned to them by the superadmins"
>
> **Clarification**: "schooladmins should create accounts and give ids to their only specific schools"

## Current Implementation Status: ✅ WORKING AS INTENDED

### What School Admins Can Do

School Admins have the ability to:

1. **Create user accounts** for their assigned school only
2. **Assign custom User IDs** to new users
3. **Choose user roles**: Admin, Deputy, or Teacher
4. **Set initial passwords** for new accounts
5. Accounts are created with `status='verified'` (immediately active)

### School Boundary Enforcement

When a School Admin creates a user:

- The `schoolId` is **automatically set** to the School Admin's own school
- School Admins **cannot select** a different school (no dropdown shown)
- School Admins **cannot create** Super Admin accounts (role option not visible)
- All created users are **scoped to the School Admin's school**

### Super Admin Capabilities

Super Admins have additional privileges:

- Can create users for **any school** (school dropdown available)
- Can create **other Super Admin accounts** (Super Admin role option visible)
- Can assign Super Admins to **no school** (`schoolId = null`)
- Can see all users across all schools

## Code Implementation

### Frontend: User Creation Form (`src/routes/app.teachers.tsx`)

**School Context Enforcement** (Lines 82-84):

```typescript
const targetSchoolId = isSuperAdmin ? form.schoolId : (currentUser?.schoolId ?? "");
if (!isSuperAdmin && !targetSchoolId) {
  return toast.error("School context is missing");
}
```

**User ID Input Field** (Lines 237-241):

```typescript
<div>
  <Label htmlFor="create-id">Assigned ID (Login ID)</Label>
  <Input
    id="create-id"
    value={form.id}
    onChange={(e) => setForm({ ...form, id: e.target.value })}
    placeholder="e.g. kst-001"
  />
</div>
```

**Role Selection** (Lines 253-262):

```typescript
<select id="create-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
  {(isSuperAdmin || isSchoolAdmin) && <option value="admin">School Admin</option>}
  <option value="deputy">Deputy</option>
  <option value="teacher">Teacher</option>
</select>
```

**School Selection** (Lines 264-278 - Only visible to Super Admins):

```typescript
{isSuperAdmin && form.role !== "super_admin" && (
  <div>
    <Label htmlFor="create-school">School</Label>
    <select id="create-school" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })}>
      {schools.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  </div>
)}
```

### Backend: User Registration (`src/lib/db-functions.ts`)

**Register User Function** (Lines 136-191):

```typescript
export const registerUser = createServerFn({ method: "POST" })
  .validator(
    (
      d: Omit<User, "status" | "registeredAt"> & {
        schoolId?: string;
        newSchoolName?: string;
        status?: "pending" | "verified" | "rejected";
      },
    ) => d,
  )
  .handler(async ({ data }) => {
    // Email uniqueness check (case-insensitive)
    const emailCheck = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${data.email})`;
    if (emailCheck.length > 0) {
      throw new Error("Email already used");
    }

    // Phone uniqueness check
    if (data.phone) {
      const phoneCheck = await sql`SELECT id FROM users WHERE phone = ${data.phone}`;
      if (phoneCheck.length > 0) {
        throw new Error("Phone number already used");
      }
    }

    // Insert user with provided schoolId
    const dbUser = toSnake({
      id: data.id.trim(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status || (data.role === "admin" ? "verified" : "pending"),
      registeredAt,
      password: data.password || "admin123",
      schoolId: data.schoolId || null, // Super Admin accounts have null schoolId
    });

    await sql`INSERT INTO users ${sql(dbUser)}`;
    return { user: toCamel<User>(dbUser) };
  });
```

## Security Considerations

### Current Security Posture

✅ **Frontend Controls**:

- School Admins cannot see school selector
- Super Admin role option hidden from School Admins
- School context automatically set for School Admins

⚠️ **Missing Backend Validation**:
The backend does NOT validate that the `schoolId` matches the creator's school. A malicious request could bypass frontend restrictions.

### Recommended Enhancement

Add backend validation to `registerUser` function:

```typescript
// Add this check in the handler after data validation
if (actorRole === "admin" && data.schoolId !== actorSchoolId) {
  throw new Error("School Admins can only create users for their own school");
}
```

**Note**: This requires passing the actor's `schoolId` and `role` to the server function.

## Testing Checklist

To verify School Admin user creation:

1. ✅ Login as School Admin (e.g., `u1` for Little Stars)
2. ✅ Navigate to "User Accounts" page
3. ✅ Click "Create User" button
4. ✅ Verify you can enter a custom User ID (e.g., `LS-T001`)
5. ✅ Verify school dropdown is NOT visible
6. ✅ Verify "Super Admin" role option is NOT visible
7. ✅ Create a Teacher account with custom ID
8. ✅ Verify the new user appears in the list
9. ✅ Login with the new User ID to confirm it works
10. ✅ Verify the new user is scoped to the correct school

## Summary

**The current implementation DOES allow School Admins to:**

- ✅ Create user accounts for their school
- ✅ Assign custom User IDs to those accounts
- ✅ Choose roles (Admin, Deputy, Teacher)
- ✅ Set initial passwords

**School Admins CANNOT:**

- ❌ Create users for other schools
- ❌ Create Super Admin accounts
- ❌ See or modify users from other schools (filtered in `MockStoreProvider`)

**The feature works as requested**, with the caveat that backend validation could be strengthened.

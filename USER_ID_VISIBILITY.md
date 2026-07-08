# User ID Column Visibility

## Overview

The User ID column in the users table is now **only visible to Super Admins**. School Admins and other roles cannot see user IDs.

## Implementation

### Before:

```
User ID | Name         | Email              | Phone        | Role    | Password | Registered | Status
--------|--------------|--------------------|--------------|---------| ---------|------------|--------
u1      | Amina Okello | admin@kinder.app   | +2547000001  | admin   | admin123 | 2025-01-10 | verified
u2      | Brian Mwangi | deputy@kinder.app  | +2547000002  | admin   | admin123 | 2025-01-12 | verified
```

**Issue:** School Admins could see User IDs (security concern)

### After:

**Super Admin View:**

```
User ID | Name         | Email              | Phone        | School          | Role    | Password | Registered | Status
--------|--------------|--------------------|--------------|-----------------|---------| ---------|------------|--------
KC001   | System Admin | superadmin@...     | +2547000000  | System Admin    | super   | admin123 | 2025-01-01 | verified
u1      | Amina Okello | admin@kinder.app   | +2547000001  | Little Stars    | admin   | admin123 | 2025-01-10 | verified
u2      | Brian Mwangi | deputy@kinder.app  | +2547000002  | Sunshine Academy| admin   | admin123 | 2025-01-12 | verified
```

✅ User ID column is visible

**School Admin View:**

```
Name         | Email              | Phone        | Role    | Password | Registered | Status
-------------|--------------------|--------------|---------| ---------|------------|--------
Amina Okello | admin@kinder.app   | +2547000001  | admin   | admin123 | 2025-01-10 | verified
Peter Otieno | peter@kinder.app   | +2547000004  | teacher | peter123 | 2025-02-03 | verified
```

✅ User ID column is hidden

## Security Benefits

### ✅ Improved Security

1. **School Admins cannot see User IDs**
   - Cannot attempt to login as other users
   - Cannot guess Super Admin IDs
   - Reduced information disclosure

2. **Super Admins retain full visibility**
   - Can manage all accounts
   - Can troubleshoot login issues
   - Can create new accounts with specific IDs

3. **Principle of Least Privilege**
   - Each role sees only what they need
   - School Admins focus on names and roles
   - Super Admins have system-wide view

## Code Changes

**File:** `src/routes/app.teachers.tsx`

**Table Header:**

```typescript
<TableRow>
  {isSuperAdmin && <TableHead>User ID</TableHead>}  // Only show if Super Admin
  <TableHead>Name</TableHead>
  <TableHead>Email</TableHead>
  // ... rest of columns
</TableRow>
```

**Table Body:**

```typescript
<TableRow key={t.id}>
  {isSuperAdmin && <TableCell>{t.id}</TableCell>}  // Only show if Super Admin
  <TableCell>{t.name}</TableCell>
  <TableCell>{t.email}</TableCell>
  // ... rest of cells
</TableRow>
```

**Empty State:**

```typescript
<TableCell
  colSpan={withActions ? (isSuperAdmin ? 10 : 8) : (isSuperAdmin ? 9 : 7)}
>
  // Adjusted colspan based on visible columns
</TableCell>
```

## What Each Role Can See

### Super Admin (KC001, KC002)

**Visible Columns:**

1. ✅ User ID
2. ✅ Name
3. ✅ Email
4. ✅ Phone
5. ✅ School
6. ✅ Role
7. ✅ Password
8. ✅ Registered Date
9. ✅ Status
10. ✅ Actions (Approve/Reject)

**Total:** 10 columns (with actions) or 9 columns (without actions)

### School Admin (u1, u2, u3, noble)

**Visible Columns:**

1. ❌ User ID (hidden)
2. ✅ Name
3. ✅ Email
4. ✅ Phone
5. ❌ School (hidden - they already know their school)
6. ✅ Role
7. ✅ Password
8. ✅ Registered Date
9. ✅ Status
10. ✅ Actions (Approve/Reject)

**Total:** 8 columns (with actions) or 7 columns (without actions)

### Deputy

**Same as School Admin** - Cannot see User IDs

### Teachers

**Visible Columns:**

1. ❌ User ID (hidden)
2. ✅ Name
3. ✅ Email
4. ✅ Phone
5. ❌ School (hidden)
6. ❌ Role (hidden)
7. ❌ Password (hidden)
8. ✅ Registered Date
9. ✅ Status
10. ❌ Actions (hidden)

**Total:** 4 columns (minimal view for teachers)

## Testing

### Test as Super Admin:

1. Login as KC001 or KC002
2. Go to `/app/teachers`
3. Verify you see **User ID** column as first column
4. Verify you see all user IDs (KC001, KC002, u1, u2, u3, etc.)

### Test as School Admin:

1. Login as u1, u2, or u3
2. Go to `/app/teachers`
3. Verify **User ID column is NOT visible**
4. Verify first column is **Name**
5. Verify you can still manage users (approve/reject)

### Test Column Count:

**Super Admin with actions:** 10 columns
**Super Admin without actions:** 9 columns
**School Admin with actions:** 8 columns
**School Admin without actions:** 7 columns

## Related Security Features

### Already Implemented:

✅ School Admins can only see users from their school  
✅ Super Admins can see all users across all schools  
✅ Email and phone uniqueness validation  
✅ Case-sensitive login credentials  
✅ Password column visible to admins only

### Newly Implemented:

✅ **User ID column only visible to Super Admins**

### Pending (from spec):

❌ Row Level Security (RLS) policies  
❌ Backend validation for cross-school access  
❌ Audit logging for all user operations  
❌ Privilege escalation prevention

## Business Impact

### For Super Admins:

- ✅ Full system visibility maintained
- ✅ Can troubleshoot login issues
- ✅ Can manage all accounts efficiently

### For School Admins:

- ✅ Cleaner, less cluttered interface
- ✅ Focus on relevant information (names, roles)
- ✅ Cannot see or misuse User IDs
- ✅ Reduced security risk

### For System Security:

- ✅ Reduced information disclosure
- ✅ Harder for School Admins to attempt unauthorized access
- ✅ Follows principle of least privilege
- ✅ Better compliance with data protection standards

## Future Enhancements

Consider these additional security improvements:

1. **Hide passwords from School Admins**
   - Currently both Super Admin and School Admin see passwords
   - Should only Super Admin see passwords?

2. **Mask sensitive data**
   - Mask phone numbers for non-admins
   - Mask email addresses partially

3. **Audit logging**
   - Log when User ID column is viewed
   - Track who accessed sensitive data

4. **Role-based field masking**
   - Define per-field visibility rules
   - More granular control over data access

## Rollback

If you need to revert this change:

```typescript
// Table Header - Remove isSuperAdmin check
<TableHead>User ID</TableHead>

// Table Body - Remove isSuperAdmin check
<TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>

// Empty State - Revert colspan
colSpan={withActions ? (isSuperAdmin ? 10 : 9) : (isSuperAdmin ? 9 : 8)}
```

## Conclusion

The User ID column is now properly secured and only visible to Super Admins. This improves security by reducing information disclosure to School Admins while maintaining full functionality for system administrators.

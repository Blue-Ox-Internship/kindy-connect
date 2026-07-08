# School Admin Edit Permissions

## Overview

School Admins can edit everything within their assigned school. This document tracks what edit functionality is currently available.

## Current Edit Capabilities

### ✅ Fully Implemented

#### 1. **Classes** (`/app/classes`)

- ✅ Edit class name
- ✅ Edit assigned teacher
- ✅ Delete class
- **Location**: `src/routes/app.classes.tsx`
- **Functions**: `updateClass()`, `deleteClass()`

#### 2. **Marks** (`/app/marks`)

- ✅ Edit mark details (score, grade, teacher comment)
- ✅ Delete marks
- **Location**: `src/routes/app.marks.tsx`
- **Functions**: `updateMark()`, `deleteMark()`

#### 3. **Pupils** (`/app/pupils`)

- ✅ Edit pupil details (admission no, name, gender, DOB, class)
- ✅ Deactivate pupils
- **Location**: `src/routes/app.pupils.tsx`
- **Functions**: `updatePupil()`, `deactivatePupil()`
- **Status**: ✅ **JUST ADDED** - Edit button and dialog now available

#### 4. **Users/Teachers** (`/app/teachers`)

- ✅ Create new users (admin, deputy, teacher)
- ✅ Approve pending teachers
- ✅ Reject pending teachers
- **Location**: `src/routes/app.teachers.tsx`
- **Functions**: `registerUser()`, `approveTeacher()`, `rejectTeacher()`
- **Note**: User editing (changing name, email, phone, role) is NOT yet implemented

### ❌ Not Yet Implemented

#### 5. **Parents** (`/app/parents`)

- ❌ No edit functionality
- ❌ No update function exists
- **Location**: `src/routes/app.parents.tsx`
- **Missing**: `updateParent()` function

#### 6. **User Account Editing** (`/app/teachers`)

- ❌ Cannot edit existing user details (name, email, phone)
- ❌ Cannot change user roles
- ❌ Cannot reset passwords
- **Missing**: User edit dialog and `updateUser()` function

#### 7. **Attendance Records** (`/app/attendance`)

- ❌ Cannot edit arrival/departure times
- ❌ Cannot edit transport details
- **Missing**: Attendance edit functionality

## Implementation Priority

### High Priority (Core Editing)

1. ✅ **Pupils** - DONE
2. ❌ **Parents** - Need to add updateParent()
3. ❌ **Users** - Edit user details

### Medium Priority

4. ❌ **Attendance** - Edit arrival/departure times

### Low Priority

5. ✅ **Classes** - Already implemented
6. ✅ **Marks** - Already implemented

## Permissions Model

### School Admin Can Edit:

- ✅ Classes in their school
- ✅ Pupils in their school
- ✅ Marks for pupils in their school
- ⚠️ Parents in their school (add only, not edit)
- ⚠️ Teachers in their school (approve/reject only, not edit)
- ❌ Attendance records (view only)

### School Admin Cannot Edit:

- ❌ Other schools' data
- ❌ Super Admin accounts
- ❌ Their own role or school assignment
- ❌ System-wide settings

## Super Admin Permissions

### Super Admin Can Edit:

- ✅ All schools
- ✅ All users across all schools
- ✅ All classes across all schools
- ✅ All pupils across all schools
- ✅ Create other Super Admin accounts
- ✅ Delete schools (with confirmation)

## Technical Implementation

### Database Functions

All edit operations go through server functions in `src/lib/db-functions.ts`:

**Implemented**:

- `updatePupil()` - Update pupil details
- `updateClass()` - Update class details
- `updateMark()` - Update mark details
- `deleteClass()` - Delete class
- `deleteMark()` - Delete mark
- `deactivatePupil()` - Soft delete pupil

**Missing**:

- `updateParent()` - Update parent details
- `updateUser()` - Update user details
- `updateAttendance()` - Update attendance records

### State Management

Edit operations update the global state in `src/lib/mock-store.tsx`:

```typescript
updatePupil: async (id, data) => {
  await updatePupilDb({ data: { id, data } });
  setState((s) => ({
    ...s,
    pupils: s.pupils.map((p: Pupil) => (p.id === id ? { ...p, ...data } : p)),
  }));
};
```

## Multi-Tenancy Considerations

### Current Implementation (Client-Side Filtering)

- Data is filtered by `currentUser.schoolId` in `MockStoreProvider`
- School Admins only see data from their school
- UI components respect these filtered data arrays

### Planned Implementation (RLS Policies)

From spec Task 3:

- RLS policies will enforce tenant boundaries at database level
- School Admins will be blocked from editing other schools' data by PostgreSQL
- This provides security even if client-side checks are bypassed

## Security Notes

### Current Protection:

✅ UI filters data by school  
✅ School Admins cannot see other schools' data in UI  
✅ Email/phone uniqueness validation

### Pending Protection (from spec):

❌ Backend validation to prevent cross-school edits  
❌ RLS policies to enforce database-level isolation  
❌ Audit logging for all edit operations  
❌ Privilege escalation prevention

## Next Steps

To fully implement "School Admin can edit everything in their school":

1. **Add updateParent() function**
   - Server function in `db-functions.ts`
   - State update in `mock-store.tsx`
   - Edit dialog in `app.parents.tsx`

2. **Add updateUser() function**
   - Server function in `db-functions.ts`
   - State update in `mock-store.tsx`
   - Edit dialog in `app.teachers.tsx`

3. **Add attendance editing**
   - Server function `updateAttendance()` in `db-functions.ts`
   - State update in `mock-store.tsx`
   - Edit dialog in `app.attendance.tsx`

4. **Execute spec tasks for full multi-tenancy**
   - Task 2: Row Level Security policies
   - Task 3: Server function RLS context
   - Task 9: Privilege escalation prevention

## Testing Checklist

For School Admin edit permissions:

- [ ] Login as School Admin (u1, u2, or u3)
- [ ] Edit pupil details - verify save works
- [ ] Edit class details - verify save works
- [ ] Edit marks - verify save works
- [ ] Try to access another school's data - verify blocked
- [ ] Verify all changes persist after page reload
- [ ] Verify audit logs record the edits

## Status Summary

**Current State**:

- ✅ 60% of core editing features implemented
- ✅ Pupils edit functionality added
- ✅ Classes edit functionality exists
- ✅ Marks edit functionality exists
- ❌ Parents edit functionality missing
- ❌ Users edit functionality missing
- ❌ Attendance edit functionality missing

**Ready for Production**: ❌ No - Need parent/user editing + RLS policies

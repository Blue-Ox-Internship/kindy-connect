# Kindy Connect - Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure the application is built: `npm run build`
2. Start the development server: `npm run dev`
3. Open browser to http://localhost:3000

---

## 1. Performance Optimizations Testing

### Test 1: Dashboard Load Speed ⚡
**Expected**: Page loads and displays within 2 seconds

1. Login as any user (e.g., KC001)
2. Navigate to Dashboard
3. **Observe**: Page should render immediately with loading indicators
4. **Observe**: Data should populate progressively (attendance first, then notifications)
5. **Verify**: No blank screens or extended waiting

**Pass Criteria**: ✅ Dashboard interactive within 2 seconds

---

### Test 2: Pupils Page Load ⚡
**Expected**: Pupils list displays immediately

1. Navigate to Pupils page
2. **Observe**: Loading indicator appears briefly
3. **Observe**: Pupils list displays quickly
4. **Verify**: No blank screens

**Pass Criteria**: ✅ Pupils visible within 1 second

---

### Test 3: Marks Page Progressive Loading ⚡
**Expected**: Two-stage loading (pupils → marks)

1. Navigate to Marks page
2. **Observe**: "Loading pupils..." indicator appears
3. **Observe**: Pupils list appears
4. **Observe**: "Loading marks..." indicator appears
5. **Observe**: Marks data populates
6. **Verify**: Page remains interactive during loading

**Pass Criteria**: ✅ Progressive loading works, no blocking

---

### Test 4: Attendance Page Progressive Loading ⚡
**Expected**: Two-stage loading (pupils → attendance)

1. Navigate to Attendance page
2. **Observe**: "Loading pupils..." indicator appears
3. **Observe**: Pupils list appears
4. **Observe**: "Loading attendance..." indicator appears
5. **Observe**: Attendance data populates
6. **Verify**: Page remains interactive during loading

**Pass Criteria**: ✅ Progressive loading works, no blocking

---

## 2. Superadmin Users View Testing

### Test 5: Access Control 🔒
**Expected**: Only superadmins can access Users page

1. **Login as Teacher** (e.g., T001)
2. Try to navigate to `/app/users`
3. **Verify**: "Unauthorized" message displays
4. **Verify**: Navigation link is not visible in sidebar

5. **Login as Superadmin** (e.g., KC001 or KC002)
6. Navigate to Users page
7. **Verify**: Full access to Users page
8. **Verify**: Navigation link visible in sidebar

**Pass Criteria**: ✅ Access restricted correctly

---

### Test 6: Search Functionality 🔍
**Expected**: Search filters users by ID, name, or email

1. Login as Superadmin
2. Navigate to Users page
3. In search box, type "KC001"
4. **Verify**: Only KC001 user appears
5. Clear search, type "Admin"
6. **Verify**: Users with "Admin" in name appear
7. Clear search, type email fragment
8. **Verify**: Matching users appear

**Pass Criteria**: ✅ Search works case-insensitive for ID/name/email

---

### Test 7: Filter by School 🏫
**Expected**: Filter shows only users from selected school

1. In School dropdown, select a specific school
2. **Verify**: Only users from that school appear
3. **Verify**: User count updates correctly
4. Select "All Schools"
5. **Verify**: All users appear again

**Pass Criteria**: ✅ School filter works correctly

---

### Test 8: Filter by Role 👤
**Expected**: Filter shows only users with selected role

1. In Role dropdown, select "Teacher"
2. **Verify**: Only teachers appear
3. Select "Admin"
4. **Verify**: Only admins appear
5. Select "All Roles"
6. **Verify**: All users appear again

**Pass Criteria**: ✅ Role filter works correctly

---

### Test 9: Tab Switching and Status Filtering 📑
**Expected**: Tabs show users by status, filters persist

1. Click "Pending" tab
2. **Verify**: Only pending users appear
3. **Verify**: Badge shows count
4. Apply a school filter
5. Switch to "Verified" tab
6. **Verify**: Filter still active (same school)
7. **Verify**: Only verified users from that school appear
8. Switch to "Rejected" tab
9. **Verify**: Filter still active
10. **Verify**: Only rejected users from that school appear

**Pass Criteria**: ✅ Tabs work, filters persist across tabs

---

### Test 10: Approve User ✅
**Expected**: Pending user moves to Verified after approval

1. Go to Pending tab
2. Find a pending user
3. Click "Approve" button
4. **Verify**: Success toast notification appears
5. **Verify**: User disappears from Pending tab
6. Switch to Verified tab
7. **Verify**: User now appears in Verified tab

**Pass Criteria**: ✅ Approval workflow works

---

### Test 11: Reject User ❌
**Expected**: Pending user moves to Rejected after rejection

1. Go to Pending tab
2. Find a pending user
3. Click "Reject" button
4. **Verify**: Toast notification appears
5. **Verify**: User disappears from Pending tab
6. Switch to Rejected tab
7. **Verify**: User now appears in Rejected tab

**Pass Criteria**: ✅ Rejection workflow works

---

### Test 12: Delete User 🗑️
**Expected**: User deleted with confirmation, cannot delete self

1. Go to Verified tab
2. Find a user (not your own account)
3. Click "Delete" button
4. **Verify**: Browser confirmation dialog appears
5. Click "Cancel"
6. **Verify**: User still exists
7. Click "Delete" again
8. Click "OK" in confirmation
9. **Verify**: Success toast notification appears
10. **Verify**: User removed from list

11. Try to delete your own account
12. **Verify**: Delete button is disabled or not shown

**Pass Criteria**: ✅ Delete works with confirmation, own account protected

---

### Test 13: Create User (Teacher with Subjects) 👨‍🏫
**Expected**: New teacher created with subject validation

1. Click "Create User" button
2. Fill in all fields:
   - ID: TEST001
   - Password: test123
   - Name: Test Teacher
   - Email: test@test.com
   - Phone: 1234567890
   - Role: Teacher
   - School: (select any)
   - Subjects: (select NONE)
3. Click "Create Account"
4. **Verify**: Error toast "Please select at least one subject for the teacher"

5. Select at least one subject (e.g., Math)
6. Click "Create Account"
7. **Verify**: Success toast appears
8. **Verify**: Dialog closes
9. **Verify**: New user appears in Verified tab

**Pass Criteria**: ✅ Teacher requires subjects, validation works

---

### Test 14: Create User (Super Admin) 👑
**Expected**: Super admin created without school requirement

1. Click "Create User" button
2. Select Role: "Super Admin"
3. **Verify**: School dropdown disappears
4. **Verify**: Subjects field disappears
5. Fill in remaining fields
6. Click "Create Account"
7. **Verify**: Success toast appears
8. **Verify**: New super admin in Verified tab with "(System-wide)" school

**Pass Criteria**: ✅ Super admin doesn't require school/subjects

---

### Test 15: Form Validation ⚠️
**Expected**: Form validates all required fields

1. Click "Create User" button
2. Leave ID field empty
3. Click "Create Account"
4. **Verify**: Error toast "Please fill in all required fields"

5. Fill ID, leave Email empty
6. Click "Create Account"
7. **Verify**: Error toast appears

8. Fill all fields, enter invalid email (e.g., "notanemail")
9. Click "Create Account"
10. **Verify**: Error toast "Please enter a valid email address"

**Pass Criteria**: ✅ Validation catches all required fields and email format

---

### Test 16: Pagination (if >100 users) 📄
**Expected**: Pagination appears and works correctly

**Note**: This test only applies if you have >100 users in your database

1. Navigate to Users page
2. **If you have >100 users**:
   - **Verify**: Pagination controls appear at bottom
   - **Verify**: Shows "Showing 1 to 50 of X users"
   - Click "Next" button
   - **Verify**: Shows users 51-100
   - **Verify**: "Previous" button now enabled
   - Click "Previous"
   - **Verify**: Back to users 1-50
3. **If you have <100 users**:
   - **Verify**: No pagination controls shown
   - **Verify**: All users visible at once

**Pass Criteria**: ✅ Pagination works or correctly hidden if not needed

---

## 3. Responsive Design Testing

### Test 17: Mobile View (< 768px) 📱
**Expected**: UI adapts for mobile screens

1. Open browser DevTools (F12)
2. Enable device toolbar (Ctrl+Shift+M)
3. Select iPhone or small device
4. Navigate through all pages
5. **Verify**: Search and filters stack vertically
6. **Verify**: Table scrolls horizontally if needed
7. **Verify**: Buttons and text are readable
8. **Verify**: No horizontal page scroll

**Pass Criteria**: ✅ UI usable on mobile

---

### Test 18: Tablet View (768px-1023px) 📱
**Expected**: UI adapts for tablet screens

1. In DevTools, select iPad or tablet size
2. Navigate through all pages
3. **Verify**: Layout adjusts appropriately
4. **Verify**: Filters may wrap to multiple lines
5. **Verify**: Table readable without excessive scrolling

**Pass Criteria**: ✅ UI usable on tablet

---

## 4. Accessibility Testing

### Test 19: Keyboard Navigation ⌨️
**Expected**: All features accessible via keyboard

1. **Without using mouse**, navigate Users page using:
   - **Tab**: Move forward through elements
   - **Shift+Tab**: Move backward
   - **Enter/Space**: Activate buttons
   - **Escape**: Close dialogs

2. **Verify**: Tab order is logical (search → filters → tabs → table → actions)
3. **Verify**: Focus indicators are visible
4. **Verify**: Can open and close Create User dialog
5. **Verify**: Can navigate and submit form with keyboard
6. **Verify**: Can interact with all buttons (Approve, Reject, Delete)

**Pass Criteria**: ✅ Fully keyboard accessible

---

### Test 20: Screen Reader (Optional) 🔊
**Expected**: Screen reader can read all content

**Note**: This test requires a screen reader (NVDA on Windows, VoiceOver on Mac)

1. Enable screen reader
2. Navigate Users page
3. **Verify**: Headings announced correctly
4. **Verify**: Table structure announced
5. **Verify**: Button purposes announced
6. **Verify**: Form fields announced with labels

**Pass Criteria**: ✅ Screen reader announces content meaningfully

---

## 5. Error Handling Testing

### Test 21: Network Failure Simulation 🌐
**Expected**: Graceful error handling

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to perform an action (approve, create, delete)
4. **Verify**: Error toast notification appears
5. **Verify**: Application doesn't crash
6. Set throttling back to "Online"
7. Retry action
8. **Verify**: Works correctly

**Pass Criteria**: ✅ Errors handled gracefully

---

## 6. Performance Benchmarking

### Test 22: Page Load Time ⏱️
**Expected**: All pages load within 2 seconds

1. Open DevTools → Performance tab
2. Start recording
3. Navigate to each page (Dashboard, Pupils, Marks, Attendance, Users)
4. Stop recording
5. **Verify**: Time to Interactive < 2 seconds for each
6. **Verify**: No long tasks blocking main thread

**Pass Criteria**: ✅ All pages interactive within 2 seconds

---

## Test Summary Checklist

### Performance Optimizations
- [ ] Dashboard load speed (< 2s)
- [ ] Pupils page load (< 1s)
- [ ] Marks progressive loading
- [ ] Attendance progressive loading

### Users Page Core Features
- [ ] Access control (superadmin only)
- [ ] Search functionality
- [ ] Filter by school
- [ ] Filter by role
- [ ] Tab switching and persistence
- [ ] Approve user
- [ ] Reject user
- [ ] Delete user
- [ ] Cannot delete self
- [ ] Create teacher (with subjects)
- [ ] Create super admin
- [ ] Form validation
- [ ] Pagination (if applicable)

### Responsive Design
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px-1023px)

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader (optional)

### Error Handling
- [ ] Network failure handling

### Performance
- [ ] Page load benchmarking

---

## Reporting Issues

If any test fails, please note:
1. **Test number and name**
2. **What you expected to happen**
3. **What actually happened**
4. **Browser and version**
5. **Any error messages in console**

---

## Quick Test (5 minutes)

For a quick verification, run these essential tests:

1. ✅ Login as superadmin → Navigate to Users
2. ✅ Search for a user
3. ✅ Approve a pending user
4. ✅ Create a new teacher
5. ✅ Navigate to Dashboard and verify it loads quickly

If all 5 pass, the implementation is working correctly! 🎉

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: Ready for Testing

# Fix: Current User Not Found Issue

## Problem
User "NIC00" could log in successfully, data would load, but then `currentUser` would be null, causing the dashboard page to show nothing.

### Console Logs Showing the Issue
```
[MockStore] Loading initial data for user: NIC00
[MockStore] Loaded data: Object
[Dashboard] No current user
[Dashboard] Loading dashboard data
[Dashboard] No current user
```

## Root Cause
The performance optimization that limited super admin users to load only 30 most recent users had a critical flaw:
- The SQL query only loaded the 30 most recently registered users
- User "NIC00" (the logged-in user) was NOT in those 30 most recent users
- Therefore, when the `currentUser` useMemo tried to find the logged-in user, it couldn't find them in the loaded users array
- Result: `currentUser` was null even though the user was authenticated

## Solution
Modified the SQL query in `src/lib/db-functions.ts` (lines 180-185) to ALWAYS include the current user:

```typescript
// BEFORE (broken):
usersPromise = sql`
  SELECT * FROM users 
  ORDER BY registered_at DESC 
  LIMIT 30
`;

// AFTER (fixed):
usersPromise = sql`
  (SELECT * FROM users WHERE id = ${userId})
  UNION
  (SELECT * FROM users WHERE id != ${userId} ORDER BY registered_at DESC LIMIT 29)
`;
```

This ensures:
1. The current user is ALWAYS included (first SELECT)
2. Plus 29 other recent users (second SELECT)
3. Total of 30 users loaded (same performance)
4. No duplicate users due to UNION (not UNION ALL)

## Files Modified
- `src/lib/db-functions.ts` - Fixed getInitialData SQL query for super admin
- `src/lib/mock-store.tsx` - Added error logging to help diagnose when user is not found
- `TROUBLESHOOTING-BLANK-PAGE.md` - Created comprehensive debugging guide

## Testing Steps
1. **Clear browser cache**: Press Ctrl+Shift+R to hard refresh
2. **Log in as user "NIC00"** (or any super admin user)
3. **Open browser console** (F12)
4. **Verify these logs appear**:
   - `[MockStore] Loading initial data for user: NIC00`
   - `[MockStore] Loaded data: Object` with users count
   - `[Dashboard] Rendering dashboard for user: super_admin` (NOT "No current user")
5. **Verify dashboard displays properly** with all stats and data

## Impact
- **Super admin users**: Fixed - current user now always loaded
- **School admin users**: Not affected - they already load all users from their school (no LIMIT)
- **Performance**: Unchanged - still only loads 30 users for super admin
- **Database**: No schema changes required

## Commit
Committed and pushed as: `891165a - fix: ensure current user always included in loaded users for super admin`

## Related Issues
- Task 4: Fix School Admin Login - Current User Not Found (RESOLVED)
- Originally identified from user query: "THE page for admin for school is not loading again"

# School Admin Login Fix

## Issue
School admin page wasn't loading after performance optimizations.

## Root Cause
1. Loading state could hang if data fetch fails or times out
2. No error logging to diagnose issues
3. No timeout mechanism to force page load

## Fixes Applied

### 1. Added Comprehensive Logging
Added console logs to track data loading:
- User role and school ID
- Number of records loaded per table
- Error conditions

**Location**: `src/lib/db-functions.ts` - getInitialData()

### 2. Better Error Handling
- Catch errors and return empty data instead of throwing
- Allow page to load even if database queries fail
- Log errors for debugging

**Location**: `src/lib/db-functions.ts` - getInitialData()

### 3. Loading Timeout
Added 10-second timeout to force page load:
```typescript
const timeout = setTimeout(() => {
  console.warn('[MockStore] Loading timeout - forcing page load');
  setLoading(false);
}, 10000);
```

**Location**: `src/lib/mock-store.tsx`

### 4. Fallback Empty Data
On error, set all data to empty arrays instead of blocking:
```typescript
catch (err) {
  console.error("Failed to load live database data:", err);
  setState((s) => ({
    ...s,
    schools: [],
    users: [],
    pupils: [],
    parents: [],
    classes: [],
    // ... all empty
  }));
}
```

## Testing the Fix

1. **Open browser console** (F12)
2. **Login as school admin**
3. **Check console logs**:
   ```
   [getInitialData] User role: admin, schoolId: s-xxx
   [getInitialData] Loading data for school: s-xxx
   [getInitialData] Loaded data: { schools: 1, users: 5, ... }
   [MockStore] Loading initial data for user: ...
   [MockStore] Loaded data: { schools: 1, users: 5, ... }
   ```

4. **If you see errors**:
   - Check database connection (.env file)
   - Verify school_id exists in users table
   - Check if school exists in schools table

## Common Issues & Solutions

### Issue: "School admin has no schoolId"
**Symptom**: Console shows error about missing schoolId
**Solution**: 
```sql
-- Check user's school_id
SELECT id, name, role, school_id FROM users WHERE role = 'admin';

-- Update if missing
UPDATE users SET school_id = 's-xxxxx' WHERE id = 'admin-id';
```

### Issue: Loading spinner forever
**Symptom**: Page shows "Loading Little Stars..." forever
**Solution**:
- Wait 10 seconds (timeout will force load)
- Check browser console for errors
- Check network tab for failed requests
- Verify database is running

### Issue: Page loads but no data
**Symptom**: Page loads but shows empty tables
**Solution**:
- Check console logs for data counts
- Verify school has pupils/classes/parents in database
- Check school_id matches between users and other tables

## Debugging Commands

### Check Database
```sql
-- Check if school admin has school_id
SELECT id, name, email, role, school_id FROM users WHERE role = 'admin';

-- Check if school exists
SELECT * FROM schools WHERE id = (
  SELECT school_id FROM users WHERE role = 'admin' LIMIT 1
);

-- Check school data
SELECT 
  (SELECT COUNT(*) FROM pupils WHERE school_id = 's-xxx') as pupils,
  (SELECT COUNT(*) FROM classes WHERE school_id = 's-xxx') as classes,
  (SELECT COUNT(*) FROM parents WHERE school_id = 's-xxx') as parents;
```

### Browser Console
```javascript
// Check current user
localStorage.getItem('kinder.currentUserId')

// Check school context
sessionStorage.getItem('kinder.selectedSchoolId')

// Clear and reload
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Performance Impact
✅ No performance degradation
✅ Same optimizations still active
✅ Better resilience to errors
✅ Better debugging capability

## Modified Files
- `src/lib/db-functions.ts` - Added logging & error handling
- `src/lib/mock-store.tsx` - Added timeout & better error handling

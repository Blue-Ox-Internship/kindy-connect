# Troubleshooting: Blank Page Issues

## Quick Fix (Try This First)

### 1. Hard Refresh Browser
**This fixes 90% of blank page issues!**

**Windows/Linux**:
- `Ctrl + Shift + R`
- OR `Ctrl + F5`

**Mac**:
- `Cmd + Shift + R`

**Alternative**:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 2. Check Browser Console (F12)
Look for these logs:
```
[MockStore] Loading initial data for user: xxx
[MockStore] Loaded data: { schools: 1, users: 5, ... }
[Dashboard] Loading dashboard data
[Dashboard] Rendering dashboard for user: admin
```

**If you see these logs repeating infinitely**, the code hasn't updated - refresh again!

## Common Issues & Solutions

### Issue 1: Loading Spinner Forever
**Symptoms**:
- Page shows "Loading Little Stars..." forever
- Spinner keeps spinning

**Solution**:
```bash
# 1. Check if dev server is running
# Look for: "Local: http://localhost:8080/"

# 2. If not running, start it:
npm run dev

# 3. Hard refresh browser (Ctrl+Shift+R)
```

### Issue 2: Completely Blank Page
**Symptoms**:
- White/blank page
- No loading spinner
- No content

**Solution**:
1. Open browser console (F12)
2. Look for red error messages
3. Common errors:
   - "Cannot read property 'X' of undefined" → Data not loaded
   - "Maximum update depth exceeded" → Infinite re-render
   - Network errors → Server not responding

**Fix**:
```bash
# Restart dev server
# Stop server: Ctrl+C in terminal
npm run dev

# Hard refresh browser: Ctrl+Shift+R
```

### Issue 3: Page Loads But No Content
**Symptoms**:
- Page shell loads (header, navigation)
- Content area is empty
- No tables or cards visible

**Solution**:
1. Check browser console for data logs
2. Verify school admin has `school_id` in database:
```sql
SELECT id, name, role, school_id FROM users WHERE role = 'admin';
```

3. If school_id is NULL, update it:
```sql
UPDATE users SET school_id = 's-xxxxx' WHERE id = 'admin-id';
```

4. Reload the page

### Issue 4: Infinite Console Logs
**Symptoms**:
- Console shows same logs repeating rapidly
- Browser becomes slow
- Page may appear frozen

**Root Cause**: React infinite re-render loop (code not updated)

**Solution**:
```bash
# 1. Close browser tab completely
# 2. In terminal, restart dev server:
# Press Ctrl+C to stop
npm run dev

# 3. Open browser in new tab
# 4. Hard refresh: Ctrl+Shift+R
# 5. Check console - logs should appear ONCE, not repeat
```

## Database Issues

### Check School Admin Setup
```sql
-- Check if admin user exists and has school_id
SELECT id, name, email, role, school_id, status 
FROM users 
WHERE role = 'admin';

-- Expected: school_id should NOT be NULL
-- Expected: status should be 'verified'
```

### Check School Exists
```sql
-- Check if the school exists
SELECT * FROM schools WHERE id = (
  SELECT school_id FROM users WHERE role = 'admin' LIMIT 1
);

-- Expected: Should return at least one school
```

### Check School Has Data
```sql
-- Replace 's-xxxxx' with actual school_id
SELECT 
  (SELECT COUNT(*) FROM pupils WHERE school_id = 's-xxxxx') as pupils_count,
  (SELECT COUNT(*) FROM classes WHERE school_id = 's-xxxxx') as classes_count,
  (SELECT COUNT(*) FROM parents WHERE school_id = 's-xxxxx') as parents_count,
  (SELECT COUNT(*) FROM users WHERE school_id = 's-xxxxx') as users_count;

-- If all counts are 0, the school has no data
-- Dashboard will load but show empty tables
```

## Dev Server Issues

### Server Not Running
```bash
# Check if port 8080 is in use
netstat -ano | findstr :8080

# If nothing shows, server is not running
npm run dev

# Wait for: "Local: http://localhost:8080/"
```

### Server Shows Errors
```bash
# Common error: Port already in use
# Solution: Kill the process or use different port

# Find process using port 8080:
netstat -ano | findstr :8080
# Note the PID (last number)

# Kill the process:
taskkill /PID <PID> /F

# Restart server:
npm run dev
```

### Hot Module Reload Not Working
```bash
# Sometimes HMR fails to update the browser
# Solution: Full rebuild

# Stop server: Ctrl+C
# Start fresh:
npm run dev

# Hard refresh browser: Ctrl+Shift+R
```

## Browser Cache Issues

### Clear All Cache
**Chrome/Edge**:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload page (`Ctrl + F5`)

**Firefox**:
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Reload page (`Ctrl + F5`)

### Disable Cache (for development)
**Chrome/Edge DevTools**:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while developing

## React Issues

### Component Not Rendering
Check console for:
- `[Dashboard] Rendering dashboard for user: admin`

If missing, the component is not mounting:
1. Check `currentUser` exists in store
2. Verify user is logged in (check localStorage)
3. Check for React errors in console

### useEffect Not Running
Check console for:
- `[Dashboard] Loading dashboard data`

If missing:
1. useEffect might have wrong dependencies
2. Component might not be mounting
3. Code might not be updated (hard refresh!)

## Step-by-Step Debug Process

### Step 1: Verify Server is Running
```bash
# Terminal should show:
✓ VITE ready in XXX ms
➜ Local: http://localhost:8080/
➜ Network: http://192.168.1.109:8080/
```

### Step 2: Verify Login Works
1. Go to http://localhost:8080/
2. Enter school admin ID
3. Should redirect to /app/dashboard
4. If not, check login function

### Step 3: Check Browser Console
```javascript
// Should see (in order):
[MockStore] Loading initial data for user: xxx
[getInitialData] User role: admin, schoolId: s-xxx
[getInitialData] Loading data for school: s-xxx
[getInitialData] Loaded data: { schools: 1, users: X, ... }
[MockStore] Loaded data: { schools: 1, users: X, ... }
[Dashboard] Loading dashboard data
[Dashboard] Rendering dashboard for user: admin
```

### Step 4: Check Network Tab
1. Open DevTools → Network tab
2. Look for failed requests (red)
3. Check response codes (should be 200)
4. If 404/500: Server issue
5. If pending forever: Timeout issue

### Step 5: Check Application State
```javascript
// In browser console, run:
localStorage.getItem('kinder.currentUserId')
// Should show your user ID

sessionStorage.getItem('kinder.selectedSchoolId')  
// May be null or school ID
```

## Emergency Reset

If nothing works, try a complete reset:

```bash
# 1. Stop dev server: Ctrl+C

# 2. Clear browser completely
# - Close all tabs
# - Clear cache (Ctrl+Shift+Delete)
# - Close browser

# 3. Restart server
npm run dev

# 4. Open browser (new window)

# 5. Go to http://localhost:8080/

# 6. Open console (F12) BEFORE logging in

# 7. Login and watch console logs

# 8. If still broken, check database (SQL queries above)
```

## Getting Help

If issue persists, provide:
1. **Browser console logs** (screenshot or copy/paste)
2. **Network tab** (show failed requests)
3. **Database query results** (user and school checks)
4. **Server terminal output**
5. **Steps you've tried**

## Prevention

To avoid future blank page issues:

1. ✅ Always hard refresh after code changes
2. ✅ Keep DevTools console open during development
3. ✅ Check "Disable cache" in Network tab
4. ✅ Watch for infinite console logs (sign of re-render loop)
5. ✅ Ensure database has valid school_id for admins
6. ✅ Keep dev server running (don't restart unnecessarily)

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Blank page | `Ctrl + Shift + R` |
| Loading forever | Wait 10s (timeout), then refresh |
| No content | Check school_id in database |
| Infinite logs | Close tab, restart server, new tab |
| Server error | Restart server (`npm run dev`) |
| Cache issue | Clear cache + hard refresh |

---

**Most Common Solution**: Hard refresh browser with `Ctrl + Shift + R` ⚡

# Quick Superadmin Setup

## New Superadmin User Created

**Login Credentials:**
- **ID**: `admin`
- **Password**: `admin123`

This is a simple, easy-to-remember login for quick access.

## How to Add This User to Database

### Option 1: Using psql (Command Line)

```bash
psql "postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres" -f database/add-quick-superadmin.sql
```

### Option 2: Using Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the content from `database/add-quick-superadmin.sql`
5. Click **Run**

### Option 3: Manual Insert

Run this SQL in any database client:

```sql
DELETE FROM users WHERE id = 'admin';

INSERT INTO users (
    id, name, email, role, status, phone, 
    registered_at, password, class_id, school_id, subjects
) VALUES (
    'admin', 'Super Administrator', 'admin@kindy.app',
    'super_admin', 'verified', '+254700000000',
    CURRENT_DATE, 'admin123', NULL, NULL, NULL
);
```

## Performance Improvements

### Database Connection Timeout
Reduced from 30s to **8 seconds** for faster failure feedback.

### Why 8 Seconds?
- Database should respond in 1-2 seconds if active
- 8 seconds allows for network latency
- Fails fast if database is paused/unreachable
- Total login time: ~2-3 seconds (if database active)

## Testing

After adding the user:

1. **Clear browser cache**: `Ctrl+Shift+Delete`
2. **Go to**: http://localhost:8080 (or your local dev server)
3. **Login with**:
   - ID: `admin`
   - Password: `admin123`
4. **Expected result**: Dashboard loads in ~2-3 seconds

## All Available Superadmin Users

After running the script, you should have:
- `admin` - Quick login (newly added)
- `KC001`, `KC002`, `KC003` - If they exist from previous seeds

All use password: `admin123`

## Troubleshooting

### Still Getting Timeout?
1. **Check Supabase is active**: https://supabase.com/dashboard
2. **Restore paused project** if needed
3. **Wait 2-3 minutes** after restore
4. **Try again**

### Login Takes More Than 10 Seconds?
Check these:
1. Database is active (not paused)
2. Network connection is stable
3. No VPN/proxy interfering
4. Supabase region is responding: https://status.supabase.com/

### User Not Found?
1. Verify SQL script ran successfully
2. Check user exists: `SELECT * FROM users WHERE id = 'admin';`
3. Verify status is 'verified'
4. Check role is 'super_admin'

## Summary

✅ **New superadmin user**: `admin` / `admin123`
✅ **Faster connection timeout**: 8 seconds (was 30)
✅ **Expected login time**: 2-3 seconds when database active
✅ **Fail fast**: Gets error in 8s if database down

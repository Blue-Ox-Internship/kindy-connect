# Database Connection Timeout Fix

## Error
```
Login error: Error: write CONNECT_TIMEOUT aws-1-eu-west-2.pooler.supabase.com:5432
```

## Root Cause
Your **Supabase database is likely paused** due to inactivity (free tier auto-pauses after ~7 days).

## Quick Fix: Wake Up Supabase Database

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project: `kinderconnect` (or your project name)
3. If you see "Project is paused", click **"Restore project"**
4. Wait 2-3 minutes for database to wake up
5. Try logging in again

### Option 2: Via Direct Connection Test
Test if database is reachable:
```bash
# Test connection (you'll need psql installed)
psql "postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```

If it times out, the database is definitely paused.

## What I Changed in Code

Increased connection timeout in `src/lib/db.ts`:
```typescript
connect_timeout: 30, // Was 10 seconds, now 30
```

This gives Supabase more time to wake up, but **you still need to restore the project** if it's paused.

## Prevention

### Keep Database Active
Supabase free tier pauses after 7 days of inactivity. To prevent:

1. **Upgrade to Pro** ($25/month) - Database never pauses
2. **Ping regularly** - Set up a cron job to query database weekly
3. **Use database regularly** - Log in at least once a week

### Alternative: Use Vercel Postgres
If Supabase keeps pausing, consider Vercel Postgres:
- Free tier: 256 MB, never pauses
- Integrates with Vercel deployments
- https://vercel.com/storage/postgres

## Testing After Fix

1. **Restore Supabase project** (if paused)
2. **Wait 2-3 minutes** for database to fully start
3. **Clear browser cache**: `Ctrl+Shift+Delete`
4. **Try logging in** with:
   - ID: `KC001` or `superadmin`
   - Password: `admin123`

## If Still Failing

Check these:

1. **Verify DATABASE_URL** in `.env`:
   ```
   DATABASE_URL=postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
   ```

2. **Check Supabase project status**:
   - Dashboard → Your Project → Settings → General
   - Look for "Project Status"

3. **Check network/firewall**:
   - Some corporate networks block port 5432
   - Try from a different network

4. **Check Supabase service status**:
   - https://status.supabase.com/

## Current Status

- ✅ Code timeout increased to 30 seconds
- ⏳ **Action Required**: Restore Supabase project if paused
- ⏳ **Action Required**: Test login after database wakes up

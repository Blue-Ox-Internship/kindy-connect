# Supabase Environment Variables Setup Guide

## Where to Find Your Supabase Values

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: **kindy-connect** (or your project name)

### Step 2: Get API Keys

**Location**: Settings → API

You'll find these values:

1. **Project URL** (SUPABASE_URL)
   ```
   Example: https://zgkjvkchapfwbqdsmsdt.supabase.co
   ```
   ✅ You already have this: `https://zgkjvkchapfwbqdsmsdt.supabase.co`

2. **anon/public Key** (SUPABASE_ANON_KEY)
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Safe to use in browser/client-side code
   - Used for public API calls

3. **service_role Key** (SUPABASE_SERVICE_ROLE_KEY)
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - ⚠️ KEEP SECRET - Never expose in browser
   - Only use server-side
   - Has admin privileges

### Step 3: Get Database URL

**Location**: Settings → Database → Connection String

Choose **"Transaction"** mode (port 5432) for better performance:

```
postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

✅ You already have this in your .env!

**Alternative modes:**
- **Transaction** (port 5432) - Best for TanStack Start ✅
- **Session** (port 6543) - For long-running connections

### Step 4: Your Current .env File

Your current values:
```env
SUPABASE_URL=https://zgkjvkchapfwbqdsmsdt.supabase.co
DATABASE_URL=postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

### What You Need to Add:

Add these lines to your `.env` file:

```env
# Add these to your .env file:
SUPABASE_ANON_KEY=your_actual_anon_key_from_supabase_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_from_supabase_dashboard
```

## Complete .env Example

Here's what your final `.env` should look like:

```env
# Application
VITE_APP_NAME=Little Stars
VITE_APP_URL=http://localhost:8080

# Supabase
SUPABASE_URL=https://zgkjvkchapfwbqdsmsdt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2p2a2NoYXBmd2JxZHNtc2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU3NjAwMH0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2p2a2NoYXBmd2JxZHNtc2R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# Database
DATABASE_URL=postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres

# Notifications (Optional)
VITE_SMS_API_KEY=
VITE_SMS_API_URL=
VITE_EMAIL_API_KEY=
VITE_EMAIL_FROM=nobleahimbisibwe5@gmail.com

# Environment
NODE_ENV=development
```

## Visual Guide to Find Keys

```
Supabase Dashboard
    ↓
Click your project
    ↓
Click "Settings" (gear icon bottom left)
    ↓
Click "API" in the settings menu
    ↓
Copy these 3 values:
    1. Project URL
    2. Project API keys → anon public
    3. Project API keys → service_role (click "Reveal" first)
```

## Security Notes

### ✅ Safe to Commit (Public)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_URL`

### ⚠️ KEEP SECRET (Never Commit)
- `SUPABASE_SERVICE_ROLE_KEY` ← Has admin access!
- `DATABASE_URL` ← Contains password
- `VITE_SMS_API_KEY`
- `VITE_EMAIL_API_KEY`
- `VITE_AUTH_SECRET`

Your `.env` file is already in `.gitignore` ✅

## Do You Need All These?

### Minimum Required (To Run App)
✅ `DATABASE_URL` - You have this
✅ `SUPABASE_URL` - You have this
❓ `SUPABASE_ANON_KEY` - **Add this**

### Optional (Can Add Later)
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- SMS/Email keys - For parent notifications
- `VITE_AUTH_SECRET` - For JWT tokens

## Quick Test

After adding the keys, test your setup:

```bash
# Start dev server
npm run dev

# Login with:
# ID: admin
# Password: admin123

# Should load in 2-3 seconds!
```

## Troubleshooting

### "Invalid API Key"
- Double-check you copied the full key (very long string)
- Make sure no extra spaces or line breaks
- Try regenerating keys in Supabase dashboard

### "Connection timeout"
- Database might be paused
- Go to dashboard and click "Restore project"
- Wait 2-3 minutes and try again

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check you're using port 5432 (Transaction mode)
- Ensure database is active (not paused)

## Next Steps

1. ✅ Copy the keys from Supabase Dashboard → Settings → API
2. ✅ Add them to your `.env` file
3. ✅ Restart your dev server
4. ✅ Login and test!

Done! 🎉

# Fix Database Connection - Step by Step

## Problem
Your DATABASE_URL format is incorrect, causing connection errors.

## Solution: Get Correct Connection String from Supabase

### Step 1: Access Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Click on your project: **zgkjvkchapfwbqdsmsdt**

### Step 2: Get Database Connection String

1. Click **Settings** (gear icon at bottom left)
2. Click **Database** in the left sidebar
3. Scroll down to **"Connection string"** section

### Step 3: Choose Connection Mode

You'll see several connection string options. **Try them in this order:**

#### Option 1: Direct Connection (Try First) ✅
- Click **"URI"** tab
- Should look like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.zgkjvkchapfwbqdsmsdt.supabase.co:5432/postgres
  ```
- Copy this string
- Replace `[YOUR-PASSWORD]` with your actual database password

#### Option 2: Session Pooling (If Option 1 Fails)
- Click **"Session pooling"** or **"Connection pooling"** tab
- Should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
  ```
- Copy this string
- Replace `[YOUR-PASSWORD]` with your actual database password

#### Option 3: Transaction Pooling (Last Resort)
- Click **"Transaction pooling"** tab
- Should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
  ```
- Copy this string
- Replace `[YOUR-PASSWORD]` with your actual database password

### Step 4: Get Your Database Password

If you don't know your password:

1. In the same **Database settings** page
2. Look for **"Database password"** section
3. If you forgot it, click **"Reset database password"**
4. **⚠️ WARNING:** This will change your password and break existing connections
5. Copy the new password

### Step 5: Update Your .env File

1. Open `d:\my projects\kindy-connect\.env`
2. Replace the DATABASE_URL line with the connection string you copied
3. Make sure the password is correct (no brackets, no spaces)

**Example:**
```env
DATABASE_URL=postgresql://postgres:hIGcwctWqgy1XtLN@db.zgkjvkchapfwbqdsmsdt.supabase.co:5432/postgres
```

### Step 6: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 7: Test Login

- Go to: http://192.168.5.1:8080
- Login with:
  - ID: `admin`
  - Password: `admin123`

---

## If You Still Get Errors

### Check Database Status

1. Go to Supabase Dashboard → Your Project
2. Look for **"Paused"** indicator at the top
3. If paused, click **"Restore"** or **"Unpause"**
4. Wait 2-3 minutes for database to wake up
5. Try login again

### Verify Database Password

The password in your connection string must match your actual database password:

1. Supabase Dashboard → Settings → Database
2. Check **"Database password"** section
3. If uncertain, reset it and update your .env

### Check Firewall/Network

If using VPN or restrictive network:
- Try disabling VPN
- Check if your IP is allowed in Supabase settings

---

## Vercel Deployment Setup

Once local connection works, update Vercel environment variables:

### Step 1: Access Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. Click on your **kindy-connect** project

### Step 2: Add Environment Variables

1. Click **Settings** tab
2. Click **Environment Variables** in left sidebar
3. Add these variables:

```
DATABASE_URL = [Your correct connection string from Supabase]
SUPABASE_URL = https://zgkjvkchapfwbqdsmsdt.supabase.co
SUPABASE_ANON_KEY = [Your anon key from Supabase → Settings → API]
SUPABASE_SERVICE_ROLE_KEY = [Your service role key from Supabase → Settings → API]
VITE_APP_NAME = Little Stars
VITE_APP_URL = https://kindy-connect.vercel.app
NODE_ENV = production
```

### Step 3: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. Wait for deployment to complete

---

## Quick Reference

### Your Current Values:
- ✅ SUPABASE_URL: `https://zgkjvkchapfwbqdsmsdt.supabase.co`
- ✅ SUPABASE_ANON_KEY: Already in your .env
- ✅ SUPABASE_SERVICE_ROLE_KEY: Already in your .env
- ❌ DATABASE_URL: **NEEDS TO BE FIXED** (get from Supabase Dashboard)

### What to Do Right Now:

1. **Get correct DATABASE_URL from Supabase** (follow Step 2 above)
2. **Update your .env file** (follow Step 5 above)
3. **Restart dev server**
4. **Test login locally**
5. **Update Vercel environment variables** (follow Vercel steps above)
6. **Redeploy on Vercel**

---

## Need Help?

If you're still stuck, please provide:
1. The exact error message you're seeing
2. Screenshot of Supabase Database settings (Connection string section, hide password)
3. Confirmation that database is not paused


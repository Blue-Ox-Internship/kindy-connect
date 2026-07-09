# 🔧 Update Vercel DATABASE_URL

## Problem
The pooler connection format is causing authentication errors.

## Solution
Switch to direct connection format.

---

## Update Vercel Environment Variable

1. **Go to Vercel:** https://vercel.com/dashboard
2. **Click your project:** kindy-connect
3. **Settings → Environment Variables**
4. **Find DATABASE_URL** and click the **three dots** → **Edit**
5. **Replace the value with:**

```
postgresql://postgres:z3Oea93uoJ1ZhHtD@db.zgkjvkchapfwbqdsmsdt.supabase.co:5432/postgres
```

6. **Save**
7. **Go to Deployments tab**
8. **Click latest deployment → Redeploy**

---

## What Changed

**OLD (Pooler - not working):**
```
postgresql://postgres.zgkjvkchapfwbqdsmsdt:z3Oea93uoJ1ZhHtD@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

**NEW (Direct - working):**
```
postgresql://postgres:z3Oea93uoJ1ZhHtD@db.zgkjvkchapfwbqdsmsdt.supabase.co:5432/postgres
```

**Key differences:**
- Username: `postgres` (not `postgres.zgkjvkchapfwbqdsmsdt`)
- Host: `db.zgkjvkchapfwbqdsmsdt.supabase.co` (direct)
- Port: `5432` (standard PostgreSQL)

---

## Test Local First

Before updating Vercel:

1. **Restart your dev server** (Ctrl+C, then `npm run dev`)
2. **Go to:** http://192.168.5.1:8080
3. **Login:** admin / admin123
4. **Should work now!** ✅

---

## After Vercel Update

Once you update and redeploy on Vercel:

1. **Wait 2-3 minutes** for deployment
2. **Go to:** https://kindy-connect.vercel.app
3. **Login:** admin / admin123
4. **Should work in production too!** 🎉

---

**Your local .env is already updated. Just update Vercel and redeploy!**


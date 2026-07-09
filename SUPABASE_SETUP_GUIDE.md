# Supabase Setup Guide - Add Superadmin User

## Quick Setup (3 Steps)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project (the one with your kindy-connect database)
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration

Copy and paste this SQL into the editor:

```sql
-- Delete any existing 'admin' user to avoid conflicts
DELETE FROM users WHERE id = 'admin';

-- Insert the superadmin user
INSERT INTO users (
    id, 
    name, 
    email, 
    role, 
    status, 
    phone, 
    registered_at, 
    password, 
    class_id, 
    school_id, 
    subjects
) VALUES (
    'admin',
    'Super Administrator',
    'admin@kindy.app',
    'super_admin',
    'verified',
    '+254700000000',
    CURRENT_DATE,
    'admin123',
    NULL,
    NULL,
    NULL
);

-- Verify it worked
SELECT id, name, email, role, status FROM users WHERE id = 'admin';
```

Click **"Run"** or press `Ctrl+Enter`

### Step 3: Verify

You should see output showing:
```
id    | name                 | email            | role        | status
------|---------------------|------------------|-------------|----------
admin | Super Administrator | admin@kindy.app  | super_admin | verified
```

## Login Credentials

After running the migration:

- **Login ID**: `admin`
- **Password**: `admin123`

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project
cd "d:\my projects\kindy-connect"

# Apply migration
supabase db push
```

The migration file is located at:
`supabase/migrations/20250109_add_quick_superadmin.sql`

## Troubleshooting

### "Relation 'users' does not exist"
Your database schema isn't set up yet. Run your main schema migrations first from the `database/migrations/` folder.

### "Duplicate key violation"
User 'admin' already exists. Either:
1. Delete it first: `DELETE FROM users WHERE id = 'admin';`
2. Or use a different ID in the migration

### "Connection timeout"
Your database might be paused:
1. Check project status in Supabase dashboard
2. Click "Restore project" if paused
3. Wait 2-3 minutes for database to wake up
4. Try again

## Performance Notes

✅ Database timeout: **8 seconds**
✅ Expected login time: **2-3 seconds** (when database active)
✅ Fast failure feedback if database down

## All Available Superadmin Accounts

After running this migration, you'll have:
- `admin` - Quick login (newly created)
- Plus any existing superadmin accounts (KC001, KC002, etc.)

All use password: `admin123`

## Next Steps

1. ✅ Run the SQL in Supabase SQL Editor
2. ✅ Verify user was created
3. ✅ Login to your app: http://localhost:8080
4. ✅ Use ID: `admin`, Password: `admin123`
5. ✅ Dashboard should load in ~2-3 seconds

## File Locations

- **Migration file**: `supabase/migrations/20250109_add_quick_superadmin.sql`
- **Alternative SQL**: `database/add-quick-superadmin.sql` (same content)
- **Setup guide**: This file

## Visual Guide

```
Supabase Dashboard
    ↓
SQL Editor (left sidebar)
    ↓
Paste SQL from migration file
    ↓
Click "Run" button
    ↓
See success message
    ↓
Login to your app!
```

Done! 🎉

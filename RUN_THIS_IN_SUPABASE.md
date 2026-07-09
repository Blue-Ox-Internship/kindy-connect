# 🚀 Create Admin User in Supabase

## Quick Steps (2 minutes)

### 1. Open Supabase SQL Editor

Click this link (opens your project's SQL Editor):
**https://supabase.com/dashboard/project/zgkjvkchapfwbqdsmsdt/sql/new**

### 2. Copy the SQL

Open the file: **`CREATE_ADMIN_USER.sql`** in this folder

Or copy this SQL directly:

```sql
-- Delete any existing admin user
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

-- Verify it was created
SELECT id, name, email, role, status FROM users WHERE id = 'admin';
```

### 3. Paste and Run

1. Paste the SQL into the editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Should see: "Success. Rows returned: 1"
4. You'll see the admin user in the results table

### 4. Test Login

Now you can login to your app:

**Local:** http://192.168.5.1:8080
**Production:** https://kindy-connect.vercel.app

**Login Credentials:**
- **ID:** `admin`
- **Password:** `admin123`

---

## Alternative: Manual Method (If SQL Fails)

If SQL doesn't work, use the Table Editor:

1. Go to: https://supabase.com/dashboard/project/zgkjvkchapfwbqdsmsdt/editor
2. Click **"Table Editor"** in left sidebar
3. Click **"users"** table
4. Click **"Insert row"** button
5. Fill in these values:

```
id:             admin
name:           Super Administrator
email:          admin@kindy.app
role:           super_admin
status:         verified
phone:          +254700000000
registered_at:  (today's date)
password:       admin123
class_id:       (leave empty)
school_id:      (leave empty)
subjects:       (leave empty)
```

6. Click **"Save"**

---

## Troubleshooting

### "Duplicate key value violates unique constraint"
- User already exists
- Run just the DELETE statement first:
  ```sql
  DELETE FROM users WHERE id = 'admin';
  ```
- Then run the INSERT again

### "Relation 'users' does not exist"
- Your database schema isn't set up yet
- Check if you have run the database migrations
- Look in `supabase/migrations/` folder for schema files

### Login fails after creating user
1. Make sure database is not paused (Supabase dashboard shows status)
2. Check that ID is exactly `admin` (lowercase, no spaces)
3. Check that password is exactly `admin123` (no spaces)
4. Wait 30 seconds and try again (database might be waking up)

---

## What This User Can Do

✅ Access all schools (no school restriction)
✅ Manage all users (teachers, parents, pupils)
✅ View and edit all data
✅ Access all admin features
✅ Create/delete schools
✅ Approve/reject teachers

---

## Security Note

⚠️ **Change the password after first login!**

The default password `admin123` is simple for easy setup, but you should:
1. Login to the app
2. Go to your profile/settings
3. Change to a strong password

Or update directly in Supabase:
```sql
UPDATE users 
SET password = 'your-new-strong-password' 
WHERE id = 'admin';
```

---

## Next Steps After Login

1. ✅ Login with admin/admin123
2. ✅ Change admin password
3. ✅ Create your first school
4. ✅ Add teachers and other users
5. ✅ Set up classes
6. ✅ Add pupils

---

**You're almost done! Just run the SQL and login!** 🎉


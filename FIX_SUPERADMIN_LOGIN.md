# Fix Super Admin Login Issue (KC001, KC002)

## Problem

KC001 and KC002 cannot login to the system as Super Admins.

## Root Cause

The Super Admin accounts **haven't been created in your Supabase database yet**. The migration file exists but hasn't been executed.

## Solution

### Option 1: Run the Quick Fix (RECOMMENDED - 2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `zgkjvkchapfwbqdsmsdt`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the SQL**
   - Open file: `database/quick-fix-superadmin.sql`
   - Copy ALL the contents
   - Paste into Supabase SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see a results table showing:
     ```
     id     | name                    | role        | status   | school_id | validation
     -------|-------------------------|-------------|----------|-----------|-------------
     KC001  | System Administrator    | super_admin | verified | NULL      | ✅ CORRECT
     KC002  | System Administrator 2  | super_admin | verified | NULL      | ✅ CORRECT
     ```

5. **Test Login**
   - Go to your app login page
   - Enter ID: `KC001`
   - You should be logged in as Super Admin
   - Try ID: `KC002` as well

---

### Option 2: Run the Migration File (5 minutes)

1. **Open Supabase Dashboard**
   - Go to SQL Editor

2. **Run the Migration**
   - Open file: `database/migrations/004_add_superadmin_account.sql`
   - Copy ALL the contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify**
   - You should see KC001 and KC002 listed
   - Both should have role = 'super_admin', status = 'verified', school_id = NULL

---

### Option 3: Manual Insert (If other options fail)

Run this simple INSERT statement:

```sql
-- Delete any conflicting emails first
DELETE FROM users WHERE email IN ('superadmin@kinder.app', 'superadmin2@kinder.app');

-- Insert KC001
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, school_id)
VALUES ('KC001', 'System Administrator', 'superadmin@kinder.app', 'super_admin', 'verified', '+254700000000', CURRENT_DATE, 'admin123', NULL);

-- Insert KC002
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, school_id)
VALUES ('KC002', 'System Administrator 2', 'superadmin2@kinder.app', 'super_admin', 'verified', '+254700000001', CURRENT_DATE, 'admin123', NULL);

-- Verify
SELECT id, name, email, role, status, school_id FROM users WHERE id IN ('KC001', 'KC002');
```

---

## Login Credentials

After running any of the above solutions:

**Super Admin 1:**

- **User ID**: `KC001` (case sensitive)
- **Password**: `admin123`

**Super Admin 2:**

- **User ID**: `KC002` (case sensitive)
- **Password**: `admin123`

---

## Troubleshooting

### Issue 1: "Email already exists" error

**Solution**: Another user is using the email. Run this:

```sql
-- Find the conflicting user
SELECT id, name, email FROM users WHERE email IN ('superadmin@kinder.app', 'superadmin2@kinder.app');

-- Update their email to something else
UPDATE users SET email = CONCAT('old_', email)
WHERE email IN ('superadmin@kinder.app', 'superadmin2@kinder.app')
AND id NOT IN ('KC001', 'KC002');

-- Then run the insert again
```

### Issue 2: "Phone number already exists" error

**Solution**: Another user is using the phone. Run this:

```sql
-- Update the conflicting user's phone
UPDATE users SET phone = NULL
WHERE phone IN ('+254700000000', '+254700000001')
AND id NOT IN ('KC001', 'KC002');

-- Then run the insert again
```

### Issue 3: Still can't login after running SQL

**Possible causes:**

1. **Case sensitivity**: Make sure you're typing `KC001` (not `kc001`)
2. **Browser cache**: Clear your browser cache and try again
3. **Check database**: Run this to verify the account exists:

```sql
SELECT * FROM users WHERE id = 'KC001';
```

If it returns no rows, the account wasn't created. Try Option 3 (Manual Insert) above.

---

## Verify the Fix

After running the SQL, verify everything is correct:

```sql
-- This should return 2 rows
SELECT
  id,
  name,
  email,
  role,
  status,
  school_id,
  CASE
    WHEN school_id IS NULL AND role = 'super_admin' THEN '✅ OK'
    ELSE '❌ ERROR'
  END as status_check
FROM users
WHERE id IN ('KC001', 'KC002');
```

**Expected result:**

- KC001: role = super_admin, status = verified, school_id = NULL, status_check = ✅ OK
- KC002: role = super_admin, status = verified, school_id = NULL, status_check = ✅ OK

---

## What Happens After Login?

Once logged in as KC001 or KC002, you will see:

- ✅ Super Admin Dashboard (not school-scoped)
- ✅ All schools visible
- ✅ System-wide statistics
- ✅ Ability to create/edit/delete schools
- ✅ Ability to create other Super Admin accounts
- ✅ Access to all users across all schools

---

## Need Help?

If none of these solutions work:

1. Check Supabase logs for errors
2. Verify your database connection string is correct
3. Make sure you're running the SQL on the correct database
4. Contact support with the error message you're seeing

---

## Prevention

To prevent this issue in the future:

1. **Always run migrations** in order (001, 002, 003, 004, etc.)
2. **Check seed.sql** is loaded for new databases
3. **Verify Super Admin exists** before going to production

Run this check periodically:

```sql
SELECT COUNT(*) as superadmin_count
FROM users
WHERE role = 'super_admin' AND status = 'verified';
```

Should return at least 1 (ideally 2 or more for redundancy).

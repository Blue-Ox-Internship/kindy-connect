-- QUICK FIX: Create Super Admin Accounts KC001 and KC002
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Check if accounts already exist
DO $$
BEGIN
  RAISE NOTICE 'Checking for existing Super Admin accounts...';
END $$;

SELECT id, name, role, status, school_id 
FROM users 
WHERE id IN ('KC001', 'KC002');

-- Step 2: Delete any conflicting accounts (if emails already exist)
DELETE FROM users WHERE email IN ('superadmin@kinder.app', 'superadmin2@kinder.app') AND id NOT IN ('KC001', 'KC002');

-- Step 3: Insert or update KC001
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC001', 'System Administrator', 'superadmin@kinder.app', 'super_admin', 'verified', '+254700000000', CURRENT_DATE, 'admin123', NULL, NULL)
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'System Administrator',
  email = 'superadmin@kinder.app',
  role = 'super_admin',
  status = 'verified',
  phone = '+254700000000',
  password = 'admin123',
  school_id = NULL,
  class_id = NULL;

-- Step 4: Insert or update KC002
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC002', 'System Administrator 2', 'superadmin2@kinder.app', 'super_admin', 'verified', '+254700000001', CURRENT_DATE, 'admin123', NULL, NULL)
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'System Administrator 2',
  email = 'superadmin2@kinder.app',
  role = 'super_admin',
  status = 'verified',
  phone = '+254700000001',
  password = 'admin123',
  school_id = NULL,
  class_id = NULL;

-- Step 5: Fix any email conflicts
DO $$
BEGIN
  -- Update email if there's a conflict on KC001
  IF EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@kinder.app' AND id != 'KC001') THEN
    UPDATE users SET email = 'superadmin@kinder.app' WHERE id = 'KC001';
    UPDATE users SET email = CONCAT('old_', email) WHERE email = 'superadmin@kinder.app' AND id != 'KC001';
  END IF;
  
  -- Update email if there's a conflict on KC002
  IF EXISTS (SELECT 1 FROM users WHERE email = 'superadmin2@kinder.app' AND id != 'KC002') THEN
    UPDATE users SET email = 'superadmin2@kinder.app' WHERE id = 'KC002';
    UPDATE users SET email = CONCAT('old_', email) WHERE email = 'superadmin2@kinder.app' AND id != 'KC002';
  END IF;
END $$;

-- Step 6: Verify the accounts were created
SELECT 
  id, 
  name, 
  email, 
  role, 
  status, 
  school_id,
  phone,
  password,
  CASE 
    WHEN school_id IS NULL AND role = 'super_admin' THEN '✅ CORRECT'
    ELSE '❌ ERROR: school_id should be NULL'
  END as validation
FROM users 
WHERE id IN ('KC001', 'KC002')
ORDER BY id;

-- Step 7: Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Super Admin accounts created successfully!';
  RAISE NOTICE 'Login with:';
  RAISE NOTICE '  ID: KC001, Password: admin123';
  RAISE NOTICE '  ID: KC002, Password: admin123';
END $$;

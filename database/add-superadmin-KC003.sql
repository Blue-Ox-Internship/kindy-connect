-- Add Super Admin KC003 to the database
-- Run this in Supabase SQL Editor

-- Check if KC003 already exists
SELECT id, name, email, role, status, school_id 
FROM users 
WHERE id = 'KC003';

-- If the above returns no results, proceed with insert:

-- Insert KC003 Super Admin account
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES (
    'KC003', 
    'System Administrator 3', 
    'superadmin3@kinder.app', 
    'super_admin', 
    'verified', 
    '+254700000002', 
    CURRENT_DATE, 
    'admin123', 
    NULL, 
    NULL
)
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'System Administrator 3',
  email = 'superadmin3@kinder.app',
  role = 'super_admin',
  status = 'verified',
  phone = '+254700000002',
  password = 'admin123',
  school_id = NULL,
  class_id = NULL;

-- Handle email conflict if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'superadmin3@kinder.app' AND id != 'KC003') THEN
    UPDATE users SET email = 'superadmin3@kinder.app' WHERE id = 'KC003';
    UPDATE users SET email = CONCAT('old_', email) WHERE email = 'superadmin3@kinder.app' AND id != 'KC003';
    RAISE NOTICE 'Fixed email conflict for KC003';
  END IF;
END $$;

-- Verify the account was created successfully
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
WHERE id = 'KC003';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Super Admin KC003 created successfully!';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '  User ID: KC003';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '  Email: superadmin3@kinder.app';
END $$;

-- Show all Super Admin accounts
SELECT id, name, email, role, status, school_id
FROM users 
WHERE role = 'super_admin'
ORDER BY id;

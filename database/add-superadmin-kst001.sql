-- Add Super Admin User: kst-001
-- Description: Creates a new super admin account with ID kst-001
-- Date: 2026-07-08

-- Step 1: Insert the super admin user
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
) 
VALUES (
  'kst-001', 
  'Super Administrator', 
  'superadmin.kst@kinder.app', 
  'super_admin', 
  'verified', 
  '+254700000099', 
  CURRENT_DATE, 
  'admin123', 
  NULL, 
  NULL,
  NULL
)
ON CONFLICT (id) 
DO UPDATE SET 
  name = 'Super Administrator',
  email = 'superadmin.kst@kinder.app',
  role = 'super_admin',
  status = 'verified',
  phone = '+254700000099',
  password = 'admin123',
  school_id = NULL,
  class_id = NULL,
  subjects = NULL;

-- Step 2: Verify the account was created
SELECT 
  id, 
  name, 
  email, 
  role, 
  status, 
  school_id,
  password,
  CASE 
    WHEN school_id IS NULL AND role = 'super_admin' THEN '✅ CORRECT'
    WHEN school_id IS NOT NULL THEN '❌ ERROR: school_id should be NULL'
    ELSE '❌ ERROR: school_id should be NULL'
  END as validation
FROM users 
WHERE id = 'kst-001';

-- Step 3: List all super admins
SELECT id, name, email, role, status, school_id
FROM users 
WHERE role = 'super_admin'
ORDER BY id;

-- ============================================
-- CREATE SUPERADMIN USER FOR KINDY CONNECT
-- ============================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query
-- ============================================

-- Step 1: Delete any existing admin user (to avoid conflicts)
DELETE FROM users WHERE id = 'admin';

-- Step 2: Insert the superadmin user
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
    'admin',                        -- Login ID: admin
    'Super Administrator',          -- Full name
    'admin@kindy.app',             -- Email
    'super_admin',                  -- Role (highest permission)
    'verified',                     -- Account status
    '+254700000000',               -- Phone number
    CURRENT_DATE,                  -- Registration date
    'admin123',                    -- Password: admin123
    NULL,                          -- No class assignment
    NULL,                          -- No school assignment (access all schools)
    NULL                           -- No subjects (not a teacher)
);

-- Step 3: Verify the user was created
SELECT id, name, email, role, status FROM users WHERE id = 'admin';

-- ============================================
-- EXPECTED OUTPUT:
-- ============================================
-- id    | name                  | email            | role        | status
-- ------|----------------------|------------------|-------------|--------
-- admin | Super Administrator  | admin@kindy.app  | super_admin | verified
--
-- ============================================
-- LOGIN CREDENTIALS:
-- ============================================
-- ID:       admin
-- Password: admin123
-- ============================================

-- Note: This user has full access to all features and all schools
-- because school_id is NULL and role is 'super_admin'

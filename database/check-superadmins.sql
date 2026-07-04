-- Check if Super Admin accounts exist
-- Run this query in Supabase SQL Editor

SELECT id, name, email, role, status, school_id, registered_at
FROM users
WHERE id IN ('KC001', 'KC002')
ORDER BY id;

-- If no results, the accounts don't exist
-- If they exist, check if:
-- 1. role = 'super_admin'
-- 2. status = 'verified'
-- 3. school_id IS NULL

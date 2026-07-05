-- Quick script to apply subject assignment feature to existing database
-- Run this on your Supabase database

-- Step 1: Add subjects column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT[];

-- Step 2: Update existing teachers with default subjects (all subjects)
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;

-- Step 3: Customize specific teachers (examples based on seed data)
UPDATE users SET subjects = ARRAY['Math', 'Science'] WHERE id = 'u4';
UPDATE users SET subjects = ARRAY['Reading', 'Writing'] WHERE id = 'u5';
UPDATE users SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science'] WHERE id = 'u6';
UPDATE users SET subjects = ARRAY['Art', 'Music'] WHERE id = 'u7';

-- Verify the changes
SELECT id, name, role, subjects FROM users WHERE role = 'teacher' ORDER BY id;

-- Migration: Add photo column to users table
-- Date: 2026-07-06
-- Description: Adds photo TEXT column to users table to store user profile photos

-- Check if column exists before adding (idempotent migration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'photo'
    ) THEN
        ALTER TABLE users ADD COLUMN photo TEXT;
    END IF;
END $$;

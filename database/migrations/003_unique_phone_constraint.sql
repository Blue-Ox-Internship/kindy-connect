-- Migration 003: Add UNIQUE constraint to phone number in users table
-- This ensures no two users can have the same phone number

-- Add unique constraint to phone column
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- Create index for phone lookups (if not already exists from schema)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

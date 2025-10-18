-- Migration: Add struggles and goals columns to profiles table
-- Purpose: Store optional user context for AI personalization

-- Add struggles column (things user is struggling with)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS struggles TEXT;

-- Add goals column (things user wants to work on)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS goals TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.struggles IS 'Optional field: Things the user is struggling with (e.g., low self-esteem, anxiety)';
COMMENT ON COLUMN profiles.goals IS 'Optional field: Things the user wants to work on (e.g., setting boundaries, building confidence)';


-- Add missing columns to profiles table for authentication
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'username',
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Create index for user_type lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Create index for username lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
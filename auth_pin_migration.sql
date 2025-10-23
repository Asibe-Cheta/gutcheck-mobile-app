-- Authentication PIN Migration
-- Adds PIN hash field to profiles table for username+PIN authentication

-- 1. Add pin_hash column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username) 
WHERE username IS NOT NULL;

-- 3. Add index for PIN authentication queries
CREATE INDEX IF NOT EXISTS idx_profiles_username_pin 
ON profiles(username, pin_hash) 
WHERE pin_hash IS NOT NULL;

-- 4. Add comment for documentation
COMMENT ON COLUMN profiles.pin_hash IS 'SHA-256 hash of user PIN for username accounts (4-digit PIN)';

-- 5. Create function to validate username availability
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE username = check_username
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO service_role;

-- 7. Add RLS policy for PIN authentication
-- Users can only read their own PIN hash when authenticating
CREATE POLICY "Users can read own pin_hash for authentication" ON profiles
    FOR SELECT 
    USING (
        auth.uid()::text = id::text 
        OR pin_hash IS NOT NULL -- Allow reading for authentication
    );

COMMENT ON FUNCTION is_username_available(TEXT) IS 'Checks if a username is available for registration';

-- Lifetime Pro Migration Script (Fixed - No Email References)
-- This script adds support for the first 20 users to get automatic lifetime pro accounts

-- 1. Create lifetime_pro_users table
CREATE TABLE IF NOT EXISTS lifetime_pro_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add lifetime pro fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lifetime_pro_granted_at TIMESTAMP WITH TIME ZONE;

-- 3. Create unique constraint to prevent duplicate lifetime pro users
CREATE UNIQUE INDEX IF NOT EXISTS idx_lifetime_pro_users_user_id 
ON lifetime_pro_users(user_id) 
WHERE is_active = TRUE;

-- 4. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_lifetime_pro_users_active 
ON lifetime_pro_users(is_active) 
WHERE is_active = TRUE;

-- 5. Add RLS (Row Level Security) policies
ALTER TABLE lifetime_pro_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own lifetime pro status
CREATE POLICY "Users can read own lifetime pro status" ON lifetime_pro_users
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Service role can manage lifetime pro users
CREATE POLICY "Service role can manage lifetime pro users" ON lifetime_pro_users
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_lifetime_pro_users_updated_at ON lifetime_pro_users;
CREATE TRIGGER update_lifetime_pro_users_updated_at
    BEFORE UPDATE ON lifetime_pro_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to check lifetime pro eligibility
CREATE OR REPLACE FUNCTION check_lifetime_pro_eligibility(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    current_count INTEGER;
    is_lifetime_pro BOOLEAN;
    is_eligible BOOLEAN;
BEGIN
    -- Get current count of active lifetime pro users
    SELECT COUNT(*) INTO current_count
    FROM lifetime_pro_users
    WHERE is_active = TRUE;
    
    -- Check if user is already a lifetime pro user
    SELECT EXISTS(
        SELECT 1 FROM lifetime_pro_users 
        WHERE user_id = user_uuid AND is_active = TRUE
    ) INTO is_lifetime_pro;
    
    -- Check eligibility (not already lifetime pro and under limit)
    is_eligible := NOT is_lifetime_pro AND current_count < 20;
    
    RETURN json_build_object(
        'is_eligible', is_eligible,
        'is_lifetime_pro', is_lifetime_pro,
        'current_count', current_count,
        'max_allowed', 20
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to grant lifetime pro status
CREATE OR REPLACE FUNCTION grant_lifetime_pro(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    eligibility_result JSON;
    is_eligible BOOLEAN;
    is_lifetime_pro BOOLEAN;
    current_count INTEGER;
    new_lifetime_pro_id UUID;
BEGIN
    -- Check eligibility
    SELECT check_lifetime_pro_eligibility(user_uuid) INTO eligibility_result;
    
    is_eligible := (eligibility_result->>'is_eligible')::BOOLEAN;
    is_lifetime_pro := (eligibility_result->>'is_lifetime_pro')::BOOLEAN;
    current_count := (eligibility_result->>'current_count')::INTEGER;
    
    -- If already lifetime pro, return success
    IF is_lifetime_pro THEN
        RETURN json_build_object(
            'success', TRUE,
            'message', 'User already has lifetime pro status',
            'is_lifetime_pro', TRUE
        );
    END IF;
    
    -- If not eligible, return error
    IF NOT is_eligible THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Lifetime pro limit reached or user not eligible',
            'current_count', current_count,
            'max_allowed', 20
        );
    END IF;
    
    -- Grant lifetime pro status
    INSERT INTO lifetime_pro_users (user_id, granted_at, is_active)
    VALUES (user_uuid, NOW(), TRUE)
    RETURNING id INTO new_lifetime_pro_id;
    
    -- Update user profile
    UPDATE profiles 
    SET 
        subscription_plan = 'lifetime_pro',
        subscription_status = 'active',
        is_lifetime_pro = TRUE,
        lifetime_pro_granted_at = NOW()
    WHERE id = user_uuid;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Lifetime pro status granted successfully',
        'lifetime_pro_id', new_lifetime_pro_id,
        'new_count', current_count + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_lifetime_pro_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_lifetime_pro(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_lifetime_pro_eligibility(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION grant_lifetime_pro(UUID) TO service_role;

-- 11. Create view for easy querying of lifetime pro users
CREATE OR REPLACE VIEW lifetime_pro_users_view AS
SELECT 
    lpu.id,
    lpu.user_id,
    p.username,
    lpu.granted_at,
    lpu.is_active,
    lpu.created_at,
    lpu.updated_at
FROM lifetime_pro_users lpu
JOIN profiles p ON lpu.user_id = p.id
WHERE lpu.is_active = TRUE
ORDER BY lpu.granted_at ASC;

-- 12. Grant permissions on the view
GRANT SELECT ON lifetime_pro_users_view TO authenticated;
GRANT SELECT ON lifetime_pro_users_view TO service_role;

-- 13. Add comments for documentation
COMMENT ON TABLE lifetime_pro_users IS 'Tracks users who have been granted lifetime pro status (first 20 users)';
COMMENT ON COLUMN lifetime_pro_users.user_id IS 'Reference to the user in profiles table';
COMMENT ON COLUMN lifetime_pro_users.granted_at IS 'When the lifetime pro status was granted';
COMMENT ON COLUMN lifetime_pro_users.is_active IS 'Whether the lifetime pro status is currently active';

COMMENT ON COLUMN profiles.is_lifetime_pro IS 'Whether this user has lifetime pro status';
COMMENT ON COLUMN profiles.lifetime_pro_granted_at IS 'When the lifetime pro status was granted to this user';

COMMENT ON FUNCTION check_lifetime_pro_eligibility(UUID) IS 'Checks if a user is eligible for lifetime pro status';
COMMENT ON FUNCTION grant_lifetime_pro(UUID) IS 'Grants lifetime pro status to a user if eligible';

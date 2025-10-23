-- Create lifetime_pro_users table for tracking first 20 users
CREATE TABLE IF NOT EXISTS lifetime_pro_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lifetime_pro_users_user_id_fkey'
        AND table_name = 'lifetime_pro_users'
    ) THEN
        ALTER TABLE lifetime_pro_users DROP CONSTRAINT lifetime_pro_users_user_id_fkey;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lifetime_pro_users_user_id ON lifetime_pro_users(user_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_pro_users_is_active ON lifetime_pro_users(is_active);

-- Enable RLS
ALTER TABLE lifetime_pro_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (since this is for first 20 users)
-- In production, you might want to restrict this further
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lifetime_pro_users' 
        AND policyname = 'Allow all operations on lifetime_pro_users'
    ) THEN
        CREATE POLICY "Allow all operations on lifetime_pro_users" ON lifetime_pro_users
          FOR ALL USING (true);
    END IF;
END $$;

-- Create trigger to update updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_lifetime_pro_users_updated_at'
    ) THEN
        CREATE TRIGGER update_lifetime_pro_users_updated_at 
          BEFORE UPDATE ON lifetime_pro_users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add missing columns to profiles table for lifetime pro
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lifetime_pro_granted_at TIMESTAMP WITH TIME ZONE;

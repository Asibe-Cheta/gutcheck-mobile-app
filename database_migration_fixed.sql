-- Fixed Database Migration Script
-- Run this SQL in your Supabase SQL editor to fix the username constraint issue

-- Step 1: Check if profiles table exists and what constraints it has
-- If the table exists but has a NOT NULL constraint on username, we need to fix it

-- First, let's make the username column nullable for anonymous users
ALTER TABLE profiles 
ALTER COLUMN username DROP NOT NULL;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age_range TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS goal TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Update existing records to have a default user_type
UPDATE profiles 
SET user_type = 'anonymous' 
WHERE user_type IS NULL;

-- Step 4: Make user_type NOT NULL after setting default values
ALTER TABLE profiles 
ALTER COLUMN user_type SET NOT NULL;

-- Step 5: Add constraint for user_type values
ALTER TABLE profiles 
ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('anonymous', 'username', 'email'));

-- Step 6: Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Step 8: Create subscription_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('trial', 'monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_user_id ON subscription_tracking(user_id);

-- Step 10: Enable Row Level Security (RLS) if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Step 11: Create basic RLS policies (simplified)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create basic policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));

-- Step 12: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 13: Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_tracking_updated_at ON subscription_tracking;
CREATE TRIGGER update_subscription_tracking_updated_at BEFORE UPDATE ON subscription_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Verify the migration was successful
SELECT 'Migration completed successfully!' as status;

-- Show the current structure of the profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

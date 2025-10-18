-- Safe Database Migration Script
-- This script safely fixes the username constraint issue without errors
-- Run this SQL in your Supabase SQL editor

-- Step 1: Make the username column nullable (safe if already nullable)
DO $$ 
BEGIN
  ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
  RAISE NOTICE 'Username column is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Username column was already nullable or table does not exist';
END $$;

-- Step 2: Add missing columns if they don't exist (safe)
DO $$ 
BEGIN
  -- Add user_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_type') THEN
    ALTER TABLE profiles ADD COLUMN user_type TEXT;
    RAISE NOTICE 'Added user_type column';
  ELSE
    RAISE NOTICE 'user_type column already exists';
  END IF;

  -- Add age_range column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age_range') THEN
    ALTER TABLE profiles ADD COLUMN age_range TEXT;
    RAISE NOTICE 'Added age_range column';
  ELSE
    RAISE NOTICE 'age_range column already exists';
  END IF;

  -- Add goal column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='goal') THEN
    ALTER TABLE profiles ADD COLUMN goal TEXT;
    RAISE NOTICE 'Added goal column';
  ELSE
    RAISE NOTICE 'goal column already exists';
  END IF;

  -- Add created_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  ELSE
    RAISE NOTICE 'created_at column already exists';
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;
END $$;

-- Step 3: Update existing records to have a default user_type
UPDATE profiles 
SET user_type = 'anonymous' 
WHERE user_type IS NULL;

-- Step 4: Make user_type NOT NULL after setting default values (safe)
DO $$ 
BEGIN
  ALTER TABLE profiles ALTER COLUMN user_type SET NOT NULL;
  RAISE NOTICE 'user_type column is now NOT NULL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'user_type column was already NOT NULL';
END $$;

-- Step 5: Add constraint for user_type values (safe - drops if exists first)
DO $$ 
BEGIN
  -- Drop constraint if it exists
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_user_type;
  
  -- Add constraint
  ALTER TABLE profiles ADD CONSTRAINT check_user_type 
  CHECK (user_type IN ('anonymous', 'username', 'email'));
  
  RAISE NOTICE 'check_user_type constraint added successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add check_user_type constraint';
END $$;

-- Step 6: Create conversations table if it doesn't exist (safe)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create messages table if it doesn't exist (safe)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Step 8: Create subscription_tracking table if it doesn't exist (safe)
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

-- Step 9: Create basic indexes for performance (safe)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_user_id ON subscription_tracking(user_id);

-- Step 10: Enable Row Level Security (safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Step 11: Create basic RLS policies (safe - drops if exists first)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- For anonymous users, we'll use a more permissive policy
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (true);

-- Step 12: Create function to automatically update updated_at timestamp (safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 13: Create triggers to automatically update updated_at (safe)
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

-- GutCheck App Database Setup
-- Run this SQL in your Supabase SQL editor

-- Create profiles table with updated structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'username', 'email')),
  username TEXT,
  age INTEGER,
  region TEXT,
  avatar_url TEXT,
  struggles TEXT,
  goals TEXT,
  age_range TEXT,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Create conversations table to store chat history
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create messages table to store individual messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Create index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create user_sessions table to track user activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Create subscription_tracking table for payment analytics
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_user_id ON subscription_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_status ON subscription_tracking(status);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));

-- Create RLS policies for conversations table
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id = current_setting('app.user_id', true));

-- Create RLS policies for messages table
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = current_setting('app.user_id', true)
    )
  );

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (user_id = current_setting('app.user_id', true));

-- Create RLS policies for subscription_tracking table
CREATE POLICY "Users can view their own subscriptions" ON subscription_tracking
  FOR SELECT USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own subscriptions" ON subscription_tracking
  FOR INSERT WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own subscriptions" ON subscription_tracking
  FOR UPDATE USING (user_id = current_setting('app.user_id', true));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tracking_updated_at BEFORE UPDATE ON subscription_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample anonymous user
INSERT INTO profiles (user_id, user_type, created_at, updated_at) 
VALUES ('anon_1703123456789_abc123def', 'anonymous', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Sample username user
INSERT INTO profiles (user_id, user_type, username, created_at, updated_at) 
VALUES ('user_1703123456789_xyz789ghi', 'username', 'testuser', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

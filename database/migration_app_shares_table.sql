-- Migration: Create app_shares table for tracking when users share the app
-- This helps measure viral growth and user engagement

-- Create app_shares table
CREATE TABLE IF NOT EXISTS public.app_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_method TEXT NOT NULL,  -- Platform used to share (e.g., 'WhatsApp', 'SMS', 'Email', 'unknown')
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_app_shares_user_id ON public.app_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_app_shares_shared_at ON public.app_shares(shared_at);

-- Enable Row Level Security
ALTER TABLE public.app_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only insert their own shares
CREATE POLICY "Users can insert their own shares"
  ON public.app_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view their own shares
CREATE POLICY "Users can view their own shares"
  ON public.app_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.app_shares TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.app_shares IS 'Tracks when users share the GutCheck app with others. Used for measuring viral growth and engagement.';
COMMENT ON COLUMN public.app_shares.share_method IS 'Platform/method used to share (e.g., WhatsApp, SMS, Email, Twitter, etc.)';
COMMENT ON COLUMN public.app_shares.shared_at IS 'Timestamp when the user initiated the share action';

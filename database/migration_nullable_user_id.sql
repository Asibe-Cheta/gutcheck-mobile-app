-- Migration: Make user_id nullable for anonymous analyses
-- Run this after running schema.sql

-- Drop the existing foreign key constraint
ALTER TABLE public.analyses 
DROP CONSTRAINT IF EXISTS analyses_user_id_fkey;

-- Make user_id nullable
ALTER TABLE public.analyses 
ALTER COLUMN user_id DROP NOT NULL;

-- Add back the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.analyses 
ADD CONSTRAINT analyses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can access their own analyses" ON public.analyses;

CREATE POLICY "Users can access their own analyses or anonymous analyses" ON public.analyses
  FOR ALL USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR 
    user_id::text = current_setting('app.anonymous_user_id', true)
  );

-- Same for patterns
DROP POLICY IF EXISTS "Users can access patterns from their analyses" ON public.patterns;

CREATE POLICY "Users can access patterns from their analyses or anonymous" ON public.patterns
  FOR ALL USING (
    analysis_id IN (
      SELECT id FROM public.analyses 
      WHERE user_id = auth.uid() OR 
            user_id IS NULL OR 
            user_id::text = current_setting('app.anonymous_user_id', true)
    )
  );

-- Add index for null user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_null_user_id ON public.analyses(id) WHERE user_id IS NULL;


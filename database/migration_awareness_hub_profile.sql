-- Awareness Hub state synced to profiles for cross-device progress (PT-01).
-- Apply in Supabase SQL editor or via migration pipeline.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS awareness_hub_state jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.awareness_hub_state IS 'JSON blob: updatedAt, ageBand, juniorConsent, trackProgress, streakDays, lastActiveDate, remindersEnabled';

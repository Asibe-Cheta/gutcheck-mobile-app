-- Idempotent ingest: same session_token (per-device random UUID) should not duplicate rows.
-- Run after migration_action_step_metrics_views.sql if not already applied.

CREATE UNIQUE INDEX IF NOT EXISTS idx_anonymised_action_step_feedback_session_token
  ON public.anonymised_action_step_feedback (session_token);

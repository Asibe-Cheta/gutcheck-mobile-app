-- D.5 Internal dashboard: anonymised action-step effectiveness aggregates (Part D).
-- Run in Supabase SQL editor. Ingest from a trusted server/edge job is optional; until then views return empty aggregates.
-- No user_id or device_id columns by design (ED-01 / ED-02).

CREATE TABLE IF NOT EXISTS public.anonymised_action_step_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL,
  status text NOT NULL CHECK (status IN ('acted_upon', 'not_acted_upon', 'skipped')),
  total_steps_presented int NOT NULL DEFAULT 0,
  selected_step_count int NOT NULL DEFAULT 0,
  barrier_text_provided boolean NOT NULL DEFAULT false,
  barrier_text_length int NOT NULL DEFAULT 0,
  elapsed_bucket text NOT NULL CHECK (elapsed_bucket IN ('1-24h', '25-48h', '3-7d', '7+d')),
  age_group text,
  source_category text,
  barrier_theme text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_step_feedback_created_at ON public.anonymised_action_step_feedback (created_at DESC);

ALTER TABLE public.anonymised_action_step_feedback ENABLE ROW LEVEL SECURITY;

-- Deny all access via PostgREST anon/authenticated until a controlled ingest path is wired.
CREATE POLICY "anonymised_action_step_feedback_deny_all"
  ON public.anonymised_action_step_feedback
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.anonymised_action_step_feedback IS 'Anonymised action-step follow-ups; aggregate reporting only (D.5 / ED-10).';

-- Effectiveness split by outcome status
CREATE OR REPLACE VIEW public.v_action_step_effectiveness AS
SELECT
  status,
  count(*)::bigint AS response_count,
  coalesce(avg(total_steps_presented), 0)::numeric AS avg_steps_presented,
  coalesce(avg(selected_step_count), 0)::numeric AS avg_steps_selected
FROM public.anonymised_action_step_feedback
GROUP BY status;

-- Daily volume (engagement)
CREATE OR REPLACE VIEW public.v_action_step_daily_volume AS
SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC') AS day_utc,
  count(*)::bigint AS submissions
FROM public.anonymised_action_step_feedback
GROUP BY 1
ORDER BY 1 DESC;

-- Barrier themes (when free-text was provided and scrubbed client-side before any future ingest)
CREATE OR REPLACE VIEW public.v_action_step_barrier_themes AS
SELECT
  coalesce(barrier_theme, 'unknown') AS barrier_theme,
  count(*)::bigint AS n
FROM public.anonymised_action_step_feedback
WHERE barrier_text_provided = true
GROUP BY 1
ORDER BY n DESC;

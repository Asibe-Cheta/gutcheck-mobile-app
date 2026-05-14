-- Recommend & Protect: server-side slot cap + referral funnel (RP-06)
-- Keys rows by profiles.user_id (TEXT UUID) to match mobile PIN/profile auth (not auth.users).
-- Apply in Supabase SQL Editor or via migration tooling.

CREATE TABLE IF NOT EXISTS public.referral_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_user_id text NOT NULL,
  slot_number int NOT NULL CHECK (slot_number >= 1 AND slot_number <= 5),
  referral_token text NOT NULL UNIQUE,
  share_method text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_profile_user_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_referral_slots_referrer
  ON public.referral_slots (referrer_profile_user_id);

ALTER TABLE public.referral_slots ENABLE ROW LEVEL SECURITY;

-- No direct policies: access only via SECURITY DEFINER functions below.

CREATE OR REPLACE FUNCTION public.referral_reserve_slot(
  p_slot_number int,
  p_token text,
  p_method text,
  p_profile_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.referral_slots%ROWTYPE;
  v_count int;
BEGIN
  IF p_slot_number IS NULL OR p_slot_number < 1 OR p_slot_number > 5 THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'invalid_slot');
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'invalid_token');
  END IF;

  IF p_profile_user_id IS NULL OR length(trim(p_profile_user_id)) < 10 THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'invalid_user');
  END IF;

  BEGIN
    PERFORM trim(p_profile_user_id)::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('allowed', false, 'error', 'invalid_user');
  END;

  SELECT * INTO v_existing
  FROM public.referral_slots
  WHERE referrer_profile_user_id = trim(p_profile_user_id)
    AND slot_number = p_slot_number;

  IF FOUND THEN
    IF v_existing.referral_token = trim(p_token) THEN
      RETURN jsonb_build_object('allowed', true);
    END IF;
    RETURN jsonb_build_object('allowed', false, 'error', 'slot_consumed');
  END IF;

  SELECT count(*)::int INTO v_count
  FROM public.referral_slots
  WHERE referrer_profile_user_id = trim(p_profile_user_id);

  IF v_count >= 5 THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'cap_reached');
  END IF;

  INSERT INTO public.referral_slots (
    referrer_profile_user_id,
    slot_number,
    referral_token,
    share_method,
    sent_at
  ) VALUES (
    trim(p_profile_user_id),
    p_slot_number,
    trim(p_token),
    nullif(trim(p_method), ''),
    now()
  );

  RETURN jsonb_build_object('allowed', true);
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.referral_slots
    WHERE referral_token = trim(p_token);
    IF FOUND
       AND v_existing.referrer_profile_user_id = trim(p_profile_user_id)
       AND v_existing.slot_number = p_slot_number
    THEN
      RETURN jsonb_build_object('allowed', true);
    END IF;
    RETURN jsonb_build_object('allowed', false, 'error', 'conflict');
END;
$$;

CREATE OR REPLACE FUNCTION public.referral_verify_event(
  p_token text,
  p_event text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.referral_slots%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF p_event IS NULL OR lower(trim(p_event)) NOT IN ('opened', 'downloaded') THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT * INTO v_row
  FROM public.referral_slots
  WHERE referral_token = trim(p_token)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF lower(trim(p_event)) = 'opened' THEN
    UPDATE public.referral_slots
    SET opened_at = coalesce(opened_at, now())
    WHERE referral_token = trim(p_token);
  ELSE
    UPDATE public.referral_slots
    SET opened_at = coalesce(opened_at, now()),
        downloaded_at = coalesce(downloaded_at, now())
    WHERE referral_token = trim(p_token);
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.referral_reserve_slot(int, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_verify_event(text, text) TO anon, authenticated;

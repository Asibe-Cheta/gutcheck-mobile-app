-- Step C: first passcode, History retention and privacy-safe analytics (PRD 13.6, 17.1).
-- Requires step A (20261109120000_secure_accounts_and_history.sql). Additive: changes nothing the
-- current app uses.

-- ─── 1. First passcode for accounts made without one (PRD 6: "Protect your History") ─────────
-- An anonymous account can be created with no PIN; after the first result the app offers a
-- 6-digit passcode. gc_change_pin still handles changing an existing PIN.

create or replace function public.gc_set_first_passcode(p_token text, p_pin_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token); v_profile profiles;
begin
  if not gc_valid_sha256(p_pin_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;
  select * into v_profile from profiles where user_id = v_user;
  if v_profile.pin_hash_v2 is not null or v_profile.pin_hash is not null then
    return jsonb_build_object('ok', false, 'error', 'already_set');
  end if;
  update profiles set pin_hash_v2 = crypt(p_pin_hash, gen_salt('bf', 10)), updated_at = now()
   where user_id = v_user;
  return jsonb_build_object('ok', true, 'username', v_profile.username);
end $$;

-- ─── 2. History retention (PRD 13.6) ────────────────────────────────────────────────────────
-- null means "until I delete". New accounts default to 90 days (confirmed by GutChecks). Existing
-- accounts keep everything until the user chooses a setting, so nobody loses checks because of
-- this release: the column is added empty first and the default is set afterwards.

alter table public.profiles add column if not exists history_retention_days int
  check (history_retention_days in (30, 90, 365));
alter table public.profiles alter column history_retention_days set default 90;

create or replace function public.gc_set_retention(p_token text, p_days int)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  if p_days is not null and p_days not in (30, 90, 365) then
    return jsonb_build_object('ok', false, 'error', 'invalid_retention');
  end if;
  update profiles set history_retention_days = p_days, updated_at = now() where user_id = v_user;
  -- Apply the new setting straight away, not only at the next nightly run.
  if p_days is not null then
    update inquiries set status = 'deleted', deleted_at = now(), title_enc = null, content_enc = null,
           support_service_ids = '{}', updated_at = now(), version = version + 1
     where user_id = v_user and deleted_at is null and created_at < now() - make_interval(days => p_days);
  end if;
  return jsonb_build_object('ok', true, 'history_retention_days', p_days);
end $$;

-- Nightly: expire checks past each account's retention; remove tombstones after 30 days.
create or replace function public.gc_purge_expired_history()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_expired int; v_tombstones int;
begin
  update inquiries i set status = 'deleted', deleted_at = now(), title_enc = null, content_enc = null,
         support_service_ids = '{}', updated_at = now(), version = i.version + 1
    from profiles p
   where p.user_id = i.user_id and p.history_retention_days is not null and i.deleted_at is null
     and i.created_at < now() - make_interval(days => p.history_retention_days);
  get diagnostics v_expired = row_count;

  delete from inquiries where deleted_at is not null and deleted_at < now() - interval '30 days';
  get diagnostics v_tombstones = row_count;

  delete from gc_auth_failures where failed_at < now() - interval '1 day';
  return jsonb_build_object('expired', v_expired, 'tombstones_removed', v_tombstones);
end $$;

-- ─── 3. Analytics (PRD 17.1) ────────────────────────────────────────────────────────────────
-- No account ID, no text. Only allow-listed events and properties; every value must be a short
-- code (letters, digits, - _ +) or a number/boolean. Anything else rejects the whole event.

create table if not exists public.gc_events (
  id          bigserial primary key,
  name        text not null,
  props       jsonb not null default '{}',
  session_id  text,
  app_version text,
  platform    text,
  age_bucket  text,
  created_at  timestamptz not null default now()
);
create index if not exists gc_events_name_time_idx on public.gc_events (name, created_at);
alter table public.gc_events enable row level security;
revoke all on public.gc_events from public, anon, authenticated;

create or replace function public.gc_event_allowlist()
returns jsonb language sql immutable as $$
  select '{
    "onboarding_started": [], "onboarding_screen_viewed": ["screen"], "onboarding_reason_selected": ["reason_category"],
    "onboarding_skipped": ["screen"], "demo_started": ["message_variant"], "demo_completed": ["message_variant", "matched_count"],
    "age_band_selected": ["age_band"], "paywall_viewed": ["source", "trial_eligible"], "plan_selected": ["plan"],
    "trial_eligibility_shown": ["eligible"], "purchase_started": ["plan", "is_trial"], "purchase_completed": ["plan", "is_trial"],
    "purchase_cancelled": ["plan"], "purchase_failed": ["plan", "error_code"], "restore_started": [], "restore_completed": ["result"],
    "paywall_dismissed": [], "access_code_entry_opened": ["source"], "code_redemption_attempted": [], "code_redeemed": ["offer_type"],
    "code_rejected": ["reason"], "first_inquiry_started": ["has_image"], "first_inquiry_completed": ["has_image"],
    "inquiry_completed": ["category", "tier", "duration_ms"], "support_card_displayed": ["service_id", "tier"],
    "support_link_clicked": ["service_id", "action"], "emergency_action_clicked": [], "history_opened": [],
    "history_item_opened": [], "history_page_loaded": ["page_index"], "inquiry_deleted": ["scope"]
  }'::jsonb;
$$;

create or replace function public.gc_log_event(
  p_name text, p_props jsonb default '{}', p_session_id text default null,
  p_app_version text default null, p_platform text default null, p_age_bucket text default null)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_allowed jsonb := gc_event_allowlist() -> p_name;
  v_key text; v_value jsonb;
  v_code constant text := '^[A-Za-z0-9_+-]{1,40}$';
begin
  if v_allowed is null then return false; end if;
  if p_props is null then p_props := '{}'; end if;
  if jsonb_typeof(p_props) <> 'object' then return false; end if;
  if p_age_bucket is not null and p_age_bucket not in ('18-24', '25+', 'under_18_or_unknown') then return false; end if;
  if p_platform is not null and p_platform not in ('ios', 'android') then return false; end if;
  if p_session_id is not null and p_session_id !~ '^[0-9a-f-]{36}$' then return false; end if;
  if p_app_version is not null and p_app_version !~ '^[0-9.]{1,20}$' then return false; end if;

  for v_key, v_value in select * from jsonb_each(p_props) loop
    if not (v_allowed ? v_key) then return false; end if;
    if jsonb_typeof(v_value) = 'string' then
      if (v_value #>> '{}') !~ v_code then return false; end if;
    elsif jsonb_typeof(v_value) not in ('number', 'boolean') then
      return false;
    end if;
  end loop;

  -- The reason someone came is recorded only for adults (PRD 17.1).
  if p_name = 'onboarding_reason_selected' and coalesce(p_age_bucket, 'under_18_or_unknown') = 'under_18_or_unknown' then
    p_props := p_props - 'reason_category';
  end if;

  insert into gc_events (name, props, session_id, app_version, platform, age_bucket)
  values (p_name, p_props, p_session_id, p_app_version, p_platform, coalesce(p_age_bucket, 'under_18_or_unknown'));
  return true;
end $$;

-- ─── 4. Who can call what ───────────────────────────────────────────────────────────────────

revoke execute on function public.gc_purge_expired_history() from public, anon, authenticated;
revoke execute on function public.gc_event_allowlist() from public, anon, authenticated;
revoke execute on function
  public.gc_set_first_passcode(text, text),
  public.gc_set_retention(text, int),
  public.gc_log_event(text, jsonb, text, text, text, text)
from public;
grant execute on function
  public.gc_set_first_passcode(text, text),
  public.gc_set_retention(text, int),
  public.gc_log_event(text, jsonb, text, text, text, text)
to anon, authenticated;

-- ─── 5. Nightly schedule (03:15 UTC) ────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname = 'gc_purge_expired_history';
    perform cron.schedule('gc_purge_expired_history', '15 3 * * *', 'select public.gc_purge_expired_history()');
  else
    raise notice 'pg_cron not available: schedule gc_purge_expired_history() another way';
  end if;
end $$;

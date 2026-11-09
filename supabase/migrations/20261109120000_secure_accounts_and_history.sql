-- Secure accounts and server-backed History (step A of 2).
--
-- Safe to apply while the current app is live: nothing here removes access the current app
-- uses, except the four database functions it never calls and writes to subscription/lifetime
-- columns it never makes. Step B (20261109130000_lockdown_public_access.sql) removes the open
-- policies once the app update that uses these functions is live.
--
-- Model: the app has no Supabase Auth session. Instead, gc_create_account / gc_login /
-- gc_reset_pin_with_recovery return a random session token (stored in the phone's secure
-- storage). Every other gc_* function takes that token and acts only on its own account. The
-- tables below have RLS enabled, no policies and no grants, so the public key cannot read them.

-- ─── 1. Immediate mitigations that do not affect the current app ───────────────────────────

-- Anyone could call these with the public key; grant_lifetime_pro gave free lifetime Premium.
revoke execute on function public.grant_lifetime_pro(uuid) from public, anon, authenticated;
revoke execute on function public.check_lifetime_pro_eligibility(uuid) from public, anon, authenticated;
revoke execute on function public.get_user_subscription_status(uuid) from public, anon, authenticated;
revoke execute on function public.get_user_analysis_count(uuid) from public, anon, authenticated;
revoke execute on function public.cleanup_old_analytics() from public, anon, authenticated;

-- lifetime_pro_users: was ALL/USING true (anyone could add themselves). Keep read-only for the
-- current app's status check until step B; the table has no rows.
drop policy if exists "Allow all operations on lifetime_pro_users" on public.lifetime_pro_users;
drop policy if exists "Service role can manage lifetime pro users" on public.lifetime_pro_users;
create policy "Temporary read for current app (removed in step B)" on public.lifetime_pro_users
  for select using (true);
revoke insert, update, delete, truncate, trigger, references on public.lifetime_pro_users from anon, authenticated;

-- profiles: stop the public key writing subscription and lifetime columns, truncating or
-- adding triggers. Columns the current app writes stay writable until step B.
revoke insert, update, truncate, trigger, references on public.profiles from anon, authenticated;
grant insert (user_id, username, user_type, pin_hash, age, region, avatar_url, struggles, goals,
              age_range, goal, created_at, updated_at)
  on public.profiles to anon, authenticated;
grant update (username, age, region, avatar_url, struggles, goals, age_range, goal, pin_hash,
              recovery_code_hash, awareness_hub_state, updated_at)
  on public.profiles to anon, authenticated;

-- ─── 2. Credential hardening ────────────────────────────────────────────────────────────────
-- The app sends SHA-256(PIN). Store bcrypt of that, so a future leak does not reveal PINs.
-- The old pin_hash / recovery_code_hash columns are cleared in step B.

alter table public.profiles
  add column if not exists pin_hash_v2 text,
  add column if not exists recovery_hash_v2 text;

update public.profiles
   set pin_hash_v2 = extensions.crypt(pin_hash, extensions.gen_salt('bf', 10))
 where pin_hash is not null and pin_hash_v2 is null;

update public.profiles
   set recovery_hash_v2 = extensions.crypt(recovery_code_hash, extensions.gen_salt('bf', 10))
 where recovery_code_hash is not null and recovery_hash_v2 is null;

create unique index if not exists profiles_user_id_key on public.profiles (user_id);
create unique index if not exists profiles_username_key on public.profiles (username);

-- ─── 3. Sessions and attempt limits ─────────────────────────────────────────────────────────

create table if not exists public.gc_sessions (
  token_hash   text primary key,
  user_id      text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
create index if not exists gc_sessions_user_idx on public.gc_sessions (user_id);
alter table public.gc_sessions enable row level security;
revoke all on public.gc_sessions from public, anon, authenticated;

create table if not exists public.gc_auth_failures (
  key       text not null,
  failed_at timestamptz not null default now()
);
create index if not exists gc_auth_failures_key_idx on public.gc_auth_failures (key, failed_at);
alter table public.gc_auth_failures enable row level security;
revoke all on public.gc_auth_failures from public, anon, authenticated;

-- Internal helpers (not callable by the app)

create or replace function public.gc_session_user(p_token text)
returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text;
begin
  if p_token is null or length(p_token) <> 64 then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update gc_sessions set last_used_at = now()
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  returning user_id into v_user;
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return v_user;
end $$;

create or replace function public.gc_issue_session(p_user text)
returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_token text := encode(gen_random_bytes(32), 'hex');
begin
  insert into gc_sessions (token_hash, user_id) values (encode(digest(v_token, 'sha256'), 'hex'), p_user);
  return v_token;
end $$;

-- 10 failed attempts per key in 15 minutes, then wait.
create or replace function public.gc_is_rate_limited(p_key text)
returns boolean language sql security definer set search_path = public, pg_temp as $$
  select count(*) >= 10 from gc_auth_failures where key = p_key and failed_at > now() - interval '15 minutes';
$$;

create or replace function public.gc_valid_sha256(p text)
returns boolean language sql immutable as $$ select coalesce(p ~ '^[0-9a-f]{64}$', false) $$;

-- Every check below returns false (never null) for missing values, so a null cannot pass.
create or replace function public.gc_check_pin(p_profile public.profiles, p_pin_hash text)
returns boolean language sql security definer set search_path = public, extensions, pg_temp as $$
  select coalesce(
    p_pin_hash is not null and (
      (p_profile.pin_hash_v2 is not null and crypt(p_pin_hash, p_profile.pin_hash_v2) = p_profile.pin_hash_v2)
      or (p_profile.pin_hash is not null and p_profile.pin_hash = p_pin_hash)),
    false);
$$;

create or replace function public.gc_check_recovery(p_profile public.profiles, p_code_hash text)
returns boolean language sql security definer set search_path = public, extensions, pg_temp as $$
  select coalesce(
    p_code_hash is not null and (
      (p_profile.recovery_hash_v2 is not null and crypt(p_code_hash, p_profile.recovery_hash_v2) = p_profile.recovery_hash_v2)
      or (p_profile.recovery_code_hash is not null and p_profile.recovery_code_hash = p_code_hash)),
    false);
$$;

create or replace function public.gc_public_profile(p_profile public.profiles)
returns jsonb language sql stable as $$
  select to_jsonb(p_profile) - 'pin_hash' - 'pin_hash_v2' - 'recovery_code_hash' - 'recovery_hash_v2';
$$;

-- ─── 4. Account functions (callable by the app) ────────────────────────────────────────────

create or replace function public.gc_create_account(
  p_user_id text, p_username text, p_user_type text, p_pin_hash text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_created timestamptz;
begin
  if not coalesce(p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', false) then
    return jsonb_build_object('ok', false, 'error', 'invalid_user_id');
  end if;
  if not coalesce(p_user_type in ('anonymous', 'username'), false) then
    return jsonb_build_object('ok', false, 'error', 'invalid_user_type');
  end if;
  if p_username is null or length(trim(p_username)) < 3 or length(p_username) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid_username');
  end if;
  if p_pin_hash is not null and not gc_valid_sha256(p_pin_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;
  if exists (select 1 from profiles where user_id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'account_exists');
  end if;
  if exists (select 1 from profiles where username = p_username) then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end if;

  insert into profiles (user_id, username, user_type, pin_hash_v2, created_at, updated_at)
  values (p_user_id, p_username, p_user_type,
          case when p_pin_hash is null then null else crypt(p_pin_hash, gen_salt('bf', 10)) end,
          now(), now())
  returning created_at into v_created;

  return jsonb_build_object('ok', true, 'token', gc_issue_session(p_user_id), 'created_at', v_created);
end $$;

create or replace function public.gc_login(p_username text, p_pin_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_key text := 'login:' || coalesce(p_username, '');
  v_profile profiles;
begin
  if gc_is_rate_limited(v_key) then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;
  select * into v_profile from profiles where username = p_username;
  if v_profile.user_id is null or not gc_valid_sha256(p_pin_hash) or not gc_check_pin(v_profile, p_pin_hash) then
    insert into gc_auth_failures (key) values (v_key);
    return jsonb_build_object('ok', false, 'error', 'invalid_credentials');
  end if;

  delete from gc_auth_failures where key = v_key;
  if v_profile.pin_hash_v2 is null or crypt(p_pin_hash, v_profile.pin_hash_v2) <> v_profile.pin_hash_v2 then
    update profiles set pin_hash_v2 = crypt(p_pin_hash, gen_salt('bf', 10)) where user_id = v_profile.user_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'token', gc_issue_session(v_profile.user_id),
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'user_type', v_profile.user_type,
    'created_at', v_profile.created_at);
end $$;

create or replace function public.gc_logout(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  delete from gc_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.gc_username_available(p_username text)
returns boolean language sql security definer set search_path = public, pg_temp as $$
  select not exists (select 1 from profiles where username = p_username);
$$;

create or replace function public.gc_change_pin(p_token text, p_old_pin_hash text, p_new_pin_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_user text := gc_session_user(p_token);
  v_key text := 'pin:' || v_user;
  v_profile profiles;
begin
  if gc_is_rate_limited(v_key) then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;
  if not gc_valid_sha256(p_new_pin_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;
  select * into v_profile from profiles where user_id = v_user;
  if not gc_valid_sha256(p_old_pin_hash) or not gc_check_pin(v_profile, p_old_pin_hash) then
    insert into gc_auth_failures (key) values (v_key);
    return jsonb_build_object('ok', false, 'error', 'invalid_credentials');
  end if;
  update profiles set pin_hash_v2 = crypt(p_new_pin_hash, gen_salt('bf', 10)), pin_hash = null, updated_at = now()
   where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.gc_set_recovery_code(p_token text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  if not gc_valid_sha256(p_code_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;
  update profiles set recovery_hash_v2 = crypt(p_code_hash, gen_salt('bf', 10)), recovery_code_hash = null,
         updated_at = now()
   where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.gc_verify_recovery(p_username text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_key text := 'recover:' || coalesce(p_username, '');
  v_profile profiles;
begin
  if gc_is_rate_limited(v_key) then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;
  select * into v_profile from profiles where username = p_username;
  if v_profile.user_id is null or not gc_valid_sha256(p_code_hash) or not gc_check_recovery(v_profile, p_code_hash) then
    insert into gc_auth_failures (key) values (v_key);
    return jsonb_build_object('ok', false, 'error', 'invalid_credentials');
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.gc_reset_pin_with_recovery(p_username text, p_code_hash text, p_new_pin_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_key text := 'recover:' || coalesce(p_username, '');
  v_profile profiles;
begin
  if gc_is_rate_limited(v_key) then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;
  if not gc_valid_sha256(p_new_pin_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;
  select * into v_profile from profiles where username = p_username;
  if v_profile.user_id is null or not gc_valid_sha256(p_code_hash) or not gc_check_recovery(v_profile, p_code_hash) then
    insert into gc_auth_failures (key) values (v_key);
    return jsonb_build_object('ok', false, 'error', 'invalid_credentials');
  end if;

  delete from gc_auth_failures where key = v_key;
  -- A PIN reset signs out every other device.
  delete from gc_sessions where user_id = v_profile.user_id;
  update profiles set pin_hash_v2 = crypt(p_new_pin_hash, gen_salt('bf', 10)), pin_hash = null, updated_at = now()
   where user_id = v_profile.user_id;

  return jsonb_build_object(
    'ok', true,
    'token', gc_issue_session(v_profile.user_id),
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'user_type', v_profile.user_type);
end $$;

create or replace function public.gc_get_profile(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token); v_profile profiles;
begin
  select * into v_profile from profiles where user_id = v_user;
  if v_profile.user_id is null then return null; end if;
  return gc_public_profile(v_profile);
end $$;

-- Only these fields can be changed by the app. Subscription and lifetime fields cannot.
create or replace function public.gc_update_profile(p_token text, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token); v_profile profiles; v_name text;
begin
  if p_patch ? 'username' then
    v_name := p_patch->>'username';
    if v_name is null or length(trim(v_name)) < 3 or length(v_name) > 40 then
      return jsonb_build_object('ok', false, 'error', 'invalid_username');
    end if;
    if exists (select 1 from profiles where username = v_name and user_id <> v_user) then
      return jsonb_build_object('ok', false, 'error', 'username_taken');
    end if;
  end if;

  update profiles set
    username   = case when p_patch ? 'username' then v_name else username end,
    age        = case when p_patch ? 'age' then
                   case when (p_patch->>'age') ~ '^\d{1,3}$' then (p_patch->>'age')::int else null end
                 else age end,
    region     = case when p_patch ? 'region' then left(p_patch->>'region', 100) else region end,
    avatar_url = case when p_patch ? 'avatar_url' then left(p_patch->>'avatar_url', 2000) else avatar_url end,
    struggles  = case when p_patch ? 'struggles' then left(p_patch->>'struggles', 2000) else struggles end,
    goals      = case when p_patch ? 'goals' then left(p_patch->>'goals', 2000) else goals end,
    age_range  = case when p_patch ? 'age_range' then left(p_patch->>'age_range', 40) else age_range end,
    goal       = case when p_patch ? 'goal' then left(p_patch->>'goal', 200) else goal end,
    awareness_hub_state = case when p_patch ? 'awareness_hub_state'
                               and octet_length((p_patch->'awareness_hub_state')::text) < 100000
                          then p_patch->'awareness_hub_state' else awareness_hub_state end,
    updated_at = now()
  where user_id = v_user
  returning * into v_profile;

  return jsonb_build_object('ok', true, 'profile', gc_public_profile(v_profile));
end $$;

create or replace function public.gc_lifetime_pro_status(p_token text)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  return exists (
    select 1 from lifetime_pro_users l join profiles p on p.id = l.user_id
     where p.user_id = v_user and l.is_active);
end $$;

create or replace function public.gc_lifetime_pro_remove(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  delete from lifetime_pro_users l using profiles p where p.id = l.user_id and p.user_id = v_user;
  update profiles set is_lifetime_pro = false, subscription_plan = null, subscription_status = 'inactive'
   where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

-- ─── 5. History (PRD 13) ────────────────────────────────────────────────────────────────────
-- Titles and content are encrypted with a key held in Supabase Vault (PRD 13.4, "no passcode"
-- option). The key never leaves the database; the public key cannot read the table at all.

create table if not exists public.inquiries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  client_id           text not null,
  status              text not null default 'completed'
                        check (status in ('pending', 'completed', 'failed', 'deleted')),
  title_enc           bytea,
  content_enc         bytea,
  category            text,
  risk_tier           smallint check (risk_tier between 0 and 3),
  support_service_ids text[] not null default '{}',
  directory_version   int,
  ruleset_version     int,
  has_image           boolean not null default false,
  message_count       int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  version             int not null default 1,
  unique (user_id, client_id)
);
create index if not exists inquiries_list_idx
  on public.inquiries (user_id, created_at desc, id desc) where deleted_at is null;
alter table public.inquiries enable row level security;
revoke all on public.inquiries from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'gc_history_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'base64'), 'gc_history_key',
                                'GutChecks History encryption key');
  end if;
end $$;

create or replace function public.gc_history_key()
returns text language sql security definer set search_path = public, pg_temp as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'gc_history_key';
$$;

create or replace function public.gc_history_save(
  p_token text,
  p_client_id text,
  p_created_at timestamptz,
  p_title text,
  p_messages jsonb,
  p_has_image boolean default false,
  p_risk_tier int default null,
  p_support_service_ids text[] default '{}',
  p_directory_version int default null,
  p_ruleset_version int default null,
  p_category text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_user text := gc_session_user(p_token);
  v_key text := gc_history_key();
  v_row inquiries;
begin
  if p_client_id is null or length(p_client_id) > 100 then
    return jsonb_build_object('ok', false, 'error', 'invalid_id');
  end if;
  if coalesce(jsonb_typeof(p_messages), '') <> 'array' or octet_length(p_messages::text) > 2000000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_messages');
  end if;

  insert into inquiries as i (user_id, client_id, status, title_enc, content_enc, category, risk_tier,
                              support_service_ids, directory_version, ruleset_version, has_image,
                              message_count, created_at, updated_at)
  values (v_user, p_client_id, 'completed',
          pgp_sym_encrypt(left(coalesce(p_title, ''), 200), v_key, 'cipher-algo=aes256'),
          pgp_sym_encrypt(p_messages::text, v_key, 'cipher-algo=aes256'),
          left(p_category, 40), p_risk_tier, coalesce(p_support_service_ids, '{}'),
          p_directory_version, p_ruleset_version, coalesce(p_has_image, false),
          jsonb_array_length(p_messages), least(coalesce(p_created_at, now()), now()), now())
  on conflict (user_id, client_id) do update set
    title_enc = excluded.title_enc,
    content_enc = excluded.content_enc,
    category = excluded.category,
    risk_tier = excluded.risk_tier,
    support_service_ids = excluded.support_service_ids,
    directory_version = excluded.directory_version,
    ruleset_version = excluded.ruleset_version,
    has_image = excluded.has_image,
    message_count = excluded.message_count,
    updated_at = now(),
    version = i.version + 1
  where i.deleted_at is null          -- a deleted check is never brought back
  returning * into v_row;

  if v_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'deleted');
  end if;
  return jsonb_build_object('ok', true, 'updated_at', v_row.updated_at, 'version', v_row.version);
end $$;

-- Newest first, 20 per page. Pass the last row's created_at and id to get the next page.
create or replace function public.gc_history_list(
  p_token text, p_before_created_at timestamptz default null, p_before_id uuid default null, p_limit int default 20)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_user text := gc_session_user(p_token);
  v_key text := gc_history_key();
begin
  return coalesce((
    select jsonb_agg(row_to_json(r) order by r.created_at desc, r.id desc)
      from (
        select id, client_id, pgp_sym_decrypt(title_enc, v_key) as title, category, risk_tier,
               support_service_ids, has_image, message_count, created_at, updated_at
          from inquiries
         where user_id = v_user and deleted_at is null
           and (p_before_created_at is null or (created_at, id) < (p_before_created_at, p_before_id))
         order by created_at desc, id desc
         limit greatest(1, least(coalesce(p_limit, 20), 50))
      ) r
  ), '[]'::jsonb);
end $$;

create or replace function public.gc_history_get(p_token text, p_client_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_user text := gc_session_user(p_token);
  v_key text := gc_history_key();
  v_row inquiries;
begin
  select * into v_row from inquiries where user_id = v_user and client_id = p_client_id and deleted_at is null;
  if v_row.id is null then return null; end if;
  return jsonb_build_object(
    'client_id', v_row.client_id,
    'title', pgp_sym_decrypt(v_row.title_enc, v_key),
    'messages', pgp_sym_decrypt(v_row.content_enc, v_key)::jsonb,
    'category', v_row.category,
    'risk_tier', v_row.risk_tier,
    'support_service_ids', v_row.support_service_ids,
    'has_image', v_row.has_image,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at);
end $$;

-- Content is destroyed immediately; a tombstone stops another device re-uploading it.
create or replace function public.gc_history_delete(p_token text, p_client_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  insert into inquiries as i (user_id, client_id, status, deleted_at)
  values (v_user, p_client_id, 'deleted', now())
  on conflict (user_id, client_id) do update set
    status = 'deleted', deleted_at = coalesce(i.deleted_at, now()), title_enc = null, content_enc = null,
    support_service_ids = '{}', updated_at = now(), version = i.version + 1;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.gc_history_delete_all(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  update inquiries set status = 'deleted', deleted_at = coalesce(deleted_at, now()), title_enc = null,
         content_enc = null, support_service_ids = '{}', updated_at = now(), version = version + 1
   where user_id = v_user and deleted_at is null;
  return jsonb_build_object('ok', true);
end $$;

-- Account deletion (App Store guideline 5.1.1(v)): removes the profile, History and sessions.
create or replace function public.gc_delete_account(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_user text := gc_session_user(p_token);
begin
  delete from inquiries where user_id = v_user;
  delete from lifetime_pro_users l using profiles p where p.id = l.user_id and p.user_id = v_user;
  delete from profiles where user_id = v_user;
  delete from gc_sessions where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

-- ─── 6. Who can call what ───────────────────────────────────────────────────────────────────

revoke execute on function
  public.gc_session_user(text),
  public.gc_issue_session(text),
  public.gc_is_rate_limited(text),
  public.gc_valid_sha256(text),
  public.gc_check_pin(public.profiles, text),
  public.gc_check_recovery(public.profiles, text),
  public.gc_public_profile(public.profiles),
  public.gc_history_key()
from public, anon, authenticated;

revoke execute on function
  public.gc_create_account(text, text, text, text),
  public.gc_login(text, text),
  public.gc_logout(text),
  public.gc_username_available(text),
  public.gc_change_pin(text, text, text),
  public.gc_set_recovery_code(text, text),
  public.gc_verify_recovery(text, text),
  public.gc_reset_pin_with_recovery(text, text, text),
  public.gc_get_profile(text),
  public.gc_update_profile(text, jsonb),
  public.gc_lifetime_pro_status(text),
  public.gc_lifetime_pro_remove(text),
  public.gc_history_save(text, text, timestamptz, text, jsonb, boolean, int, text[], int, int, text),
  public.gc_history_list(text, timestamptz, uuid, int),
  public.gc_history_get(text, text),
  public.gc_history_delete(text, text),
  public.gc_history_delete_all(text),
  public.gc_delete_account(text)
from public;

grant execute on function
  public.gc_create_account(text, text, text, text),
  public.gc_login(text, text),
  public.gc_logout(text),
  public.gc_username_available(text),
  public.gc_change_pin(text, text, text),
  public.gc_set_recovery_code(text, text),
  public.gc_verify_recovery(text, text),
  public.gc_reset_pin_with_recovery(text, text, text),
  public.gc_get_profile(text),
  public.gc_update_profile(text, jsonb),
  public.gc_lifetime_pro_status(text),
  public.gc_lifetime_pro_remove(text),
  public.gc_history_save(text, text, timestamptz, text, jsonb, boolean, int, text[], int, int, text),
  public.gc_history_list(text, timestamptz, uuid, int),
  public.gc_history_get(text, text),
  public.gc_history_delete(text, text),
  public.gc_history_delete_all(text),
  public.gc_delete_account(text)
to anon, authenticated;

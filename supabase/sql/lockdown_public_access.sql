-- Step B: remove the public key's direct access to accounts.
--
-- Run ONLY after the app update that uses the gc_* functions is live (OTA published) and a login,
-- a profile save and a History save have been confirmed on a real device. Kept outside
-- supabase/migrations so it is never applied by accident.
--
-- Effect on older app bundles: anyone still running a bundle from before the update keeps their
-- local session, but cannot log in again, create an account or save their profile until the
-- update loads (it downloads on launch and applies on the next launch).

begin;

-- profiles: these policies let anyone read, change or delete any account.
drop policy if exists "Allow anonymous users to manage their own profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can read own pin_hash for authentication" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
-- The remaining profiles policies compare against auth.uid(), which the app never has, so they
-- grant nothing. Remove table privileges as well, so access is only through gc_* functions.
revoke all on public.profiles from anon, authenticated;

-- Old unsalted hashes: bcrypt versions (pin_hash_v2, recovery_hash_v2) replace them.
update public.profiles
   set pin_hash_v2 = coalesce(pin_hash_v2, extensions.crypt(pin_hash, extensions.gen_salt('bf', 10)))
 where pin_hash is not null;
update public.profiles
   set recovery_hash_v2 = coalesce(recovery_hash_v2, extensions.crypt(recovery_code_hash, extensions.gen_salt('bf', 10)))
 where recovery_code_hash is not null;
update public.profiles set pin_hash = null, recovery_code_hash = null
 where pin_hash is not null or recovery_code_hash is not null;

-- lifetime_pro_users: status now comes from gc_lifetime_pro_status.
drop policy if exists "Temporary read for current app (removed in step B)" on public.lifetime_pro_users;
revoke all on public.lifetime_pro_users from anon, authenticated;

-- analyses / patterns: rows with no owner were readable and editable by anyone.
drop policy if exists "Users can access their own analyses or anonymous analyses" on public.analyses;
drop policy if exists "Users can access patterns from their analyses or anonymous" on public.patterns;

commit;

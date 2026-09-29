-- A person may edit their own name, their own photo, and (at signup) their own
-- role. Nothing else on their row is theirs to touch.
--
-- Until now the UPDATE grant on profiles covered every column, and the RLS
-- policy only asked "is this your row" — RLS cannot ask "which column". So a
-- suspended account could run `update profiles set suspended_at = null` on
-- itself and be back, and any account could rewrite its own created_at or
-- clear welcome_email_sent_at to be welcomed again. Reproduced against the
-- live database on 2026-09-21, in a transaction that rolled back.
--
-- This is the same shape as the role hole closed in 0042. That one got a
-- trigger on the one column that was known to matter; the columns added since
-- (suspended_at in 0051, welcome_email_sent_at in 0060) inherited the open
-- grant without anybody noticing. A column list fails closed: a column added
-- tomorrow is not editable until somebody says so.
--
-- Every legitimate writer survives this:
--   - the account page writes full_name and photo_url
--   - the mentor profile form writes photo_url
--   - the auth callback writes role (seeker/mentor, guarded by 0042) and
--     full_name/photo_url backfilled from LinkedIn
--   - admin_set_suspended() and the welcome claim/release run as their owner
--     and never needed the grant

revoke update on public.profiles from authenticated;
grant update (full_name, photo_url, role) on public.profiles to authenticated;

-- anon never had UPDATE, and the other grants it does hold on this table are
-- moot behind RLS with no policy for them — but INSERT and DELETE are the two
-- nobody ever meant to give a signed-out visitor, so take them while here.
revoke insert, delete, truncate, references, trigger on public.profiles from anon;
revoke insert, delete, truncate, references, trigger on public.profiles from authenticated;

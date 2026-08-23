-- Per-booking Google Meet links.
--
-- Until now a specialist pasted one permanent link that every seeker was given,
-- which means two people can wander into each other's session and there is no
-- record of which call belonged to which booking. A link per booking fixes
-- both, and nobody has to paste anything.
--
-- The pasted link stays as the fallback: a specialist who has not connected
-- Google, or whose token has been revoked, still has a working profile.

-- Where the generated link lives. Null means "use the specialist's pasted one".
alter table bookings
  add column if not exists meeting_link text;

-- Google's refresh token for a specialist who has connected their account.
--
-- A refresh token is a long-lived credential to act as that person on their
-- calendar, so it is treated like a password: never sent to a browser, never
-- read by anyone but its owner, and removable in one click.
create table if not exists mentor_google_accounts (
  id uuid primary key references mentor_profiles (id) on delete cascade,

  refresh_token text not null,

  -- Shown back to the specialist so they can see which account is connected,
  -- and notice if it is the wrong one.
  google_email text,

  connected_at timestamptz not null default now()
);

alter table mentor_google_accounts enable row level security;

-- Only the owner, and only ever server-side. There is deliberately no admin
-- read policy: an admin has no reason to hold someone's Google credential,
-- and the fewer places it can be read from the better.
drop policy if exists "mentor manages own google account" on mentor_google_accounts;
create policy "mentor manages own google account"
  on mentor_google_accounts for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Whether a specialist has connected Google is not a secret, and the profile
-- page needs it to decide what to show. This view exposes that one fact
-- without exposing the token beside it.
create or replace view mentor_google_connected
  with (security_invoker = true)
  as select id, google_email, connected_at from mentor_google_accounts;

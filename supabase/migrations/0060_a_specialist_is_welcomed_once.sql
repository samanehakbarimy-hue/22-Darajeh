-- A specialist who has just confirmed their account gets one letter telling
-- them what happens next. Once, ever — not once per sign-in.
--
-- The trigger for it is an auth callback, and an auth callback runs again
-- every time somebody signs in with LinkedIn. "Have we sent this yet?" read in
-- the app and answered by a second round trip is a race with itself; the
-- answer has to be the same statement that records it. So the claim is an
-- update with the condition in its where clause, and the row comes back only
-- to the caller whose update actually matched. Everybody else gets nothing and
-- sends nothing.

alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;

-- Everyone already here has already been through signup, some of them weeks
-- ago. Leaving these null would post all of them a "welcome, now fill in your
-- profile" the next time they signed in, which is both wrong and strange. The
-- stamp is not a claim about a letter that was sent — it is a record that this
-- account's one chance at a welcome has passed.
update public.profiles
   set welcome_email_sent_at = created_at
 where welcome_email_sent_at is null;

/**
 * Take the one welcome this account is owed, and return where to send it.
 *
 * Returns no row at all when there is nothing to claim: not a specialist, or
 * already welcomed. The caller's whole decision is "did I get a row".
 *
 * Definer because the address lives in auth.users, which nothing in this
 * project may read directly — the same reason booking_parties() and
 * inquiry_parties() are definer. It reads only the caller's own address, and
 * takes no argument, so there is no other row to ask for.
 */
create or replace function public.claim_welcome_email()
returns table (email text, full_name text)
language plpgsql
security definer set search_path = public, auth
as $fn$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  update public.profiles p
     set welcome_email_sent_at = now()
   where p.id = uid
     and p.role = 'mentor'
     and p.welcome_email_sent_at is null;

  if not found then
    return;
  end if;

  return query
    select u.email::text, p.full_name
      from auth.users u
      join public.profiles p on p.id = u.id
     where u.id = uid;
end;
$fn$;

/**
 * Hand it back, because the send failed.
 *
 * Stamping first and sending second is the safe order — the other way round,
 * a crash between the two sends the letter twice. The cost is that a Resend
 * outage would burn the one chance silently, so this undoes the stamp when
 * nothing actually went out, and the next sign-in tries again.
 *
 * Narrow on purpose: own row only, and only a stamp from the last five
 * minutes. That makes it a way to recover from a failure that just happened,
 * not a button an account can press to re-send itself the letter whenever it
 * likes.
 */
create or replace function public.release_welcome_email()
returns void
language plpgsql
security definer set search_path = public
as $fn$
begin
  update public.profiles
     set welcome_email_sent_at = null
   where id = auth.uid()
     and role = 'mentor'
     and welcome_email_sent_at > now() - interval '5 minutes';
end;
$fn$;

-- Signed out there is nothing to claim, and both of these read auth.uid().
revoke all on function public.claim_welcome_email() from public, anon;
revoke all on function public.release_welcome_email() from public, anon;
grant execute on function public.claim_welcome_email() to authenticated;
grant execute on function public.release_welcome_email() to authenticated;

-- A session counts as held when somebody says it happened, not when the clock
-- runs out.
--
-- held_session_count() counted a booking as held if the specialist had
-- accepted it and the slot's end time was in the past. Nothing anywhere
-- recorded whether the two people actually met. So a booking that both sides
-- simply failed to attend was published on the specialist's page as
-- «۱ گفت‌وگوی انجام‌شده» and «تا حالا ۱ جلسه برگزار کرده» -- a claim about a
-- real person, made to strangers, that was not true.
--
-- Which is the worst kind of bug this site can have. Everything else here is
-- recoverable; a number that overstates somebody's experience is the thing
-- seekers are being asked to trust.

alter table public.bookings
  add column if not exists outcome text
    check (outcome in ('held', 'missed'));

comment on column public.bookings.outcome is
  'What actually happened, once one of the two people says so. Null means '
  'nobody has said yet -- which is not the same as ''missed'', and must never '
  'be counted as ''held''.';

-- Only the two people in the booking, only after it was accepted, and only
-- once the time has passed. A function rather than a policy because this must
-- write one column and nothing else: row-level security cannot restrict which
-- columns an update touches.
create or replace function public.set_booking_outcome(booking uuid, result text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  b record;
begin
  if result is not null and result not in ('held', 'missed') then
    raise exception 'An outcome is either held or missed';
  end if;

  select bk.*, s.end_time into b
    from public.bookings bk
    join public.availability_slots s on s.id = bk.slot_id
   where bk.id = booking;

  if b is null then
    raise exception 'No such booking';
  end if;

  if auth.uid() is distinct from b.mentor_id
     and auth.uid() is distinct from b.seeker_id then
    raise exception 'Only the two people in a session can say what happened';
  end if;

  if b.status <> 'confirmed' then
    raise exception 'Only an accepted session has an outcome';
  end if;

  if b.end_time > now() then
    raise exception 'That session has not happened yet';
  end if;

  update public.bookings set outcome = result where id = booking;
end;
$$;

revoke all on function public.set_booking_outcome(uuid, text) from public, anon;
grant execute on function public.set_booking_outcome(uuid, text) to authenticated;

-- The count now asks what happened rather than what the clock did.
create or replace function public.held_session_count(mentor uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select count(*)::integer
  from public.bookings b
  where b.mentor_id = mentor
    and b.status = 'confirmed'
    and b.outcome = 'held';
$function$;

-- Nothing is back-filled on purpose.
--
-- Every existing booking has a null outcome, so every specialist's count drops
-- to whatever has actually been confirmed -- which today is none of them.
-- Guessing 'held' for the old rows would be the same untruth this migration
-- exists to remove, just written down once instead of computed each time.

-- How many conversations a specialist has actually had.
--
-- The most persuasive thing a profile can say, and the one claim on it that
-- cannot be written by the person it describes. Bookings are private to the
-- two people in them, so a public page cannot count them directly — hence a
-- definer function that returns a number and nothing else. No names, no times,
-- no messages: there is nothing here to leak.
--
-- Counts sessions that were accepted and whose time has passed. A confirmed
-- session next week has not happened yet, and a declined or cancelled one
-- never did.
create or replace function public.held_session_count(mentor uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.bookings b
  join public.availability_slots s on s.id = b.slot_id
  where b.mentor_id = mentor
    and b.status = 'confirmed'
    and s.end_time < now();
$$;

revoke execute on function public.held_session_count(uuid) from public;
grant execute on function public.held_session_count(uuid) to anon, authenticated;

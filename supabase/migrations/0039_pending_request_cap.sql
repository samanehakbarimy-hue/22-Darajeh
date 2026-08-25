-- How many unanswered requests one seeker may hold at once.
--
-- There was no limit of any kind: a single account could book every open slot
-- on the site in one sitting, and the specialists whose calendars it filled
-- would each have to decline it by hand. With one specialist that is a bad
-- afternoon; with a hundred it is the whole flow clogged by one person.
--
-- This is deliberately not the monthly allowance we eventually want. It is the
-- structural half of it -- a ceiling on live requests -- with none of the
-- numbers that need real seekers to tune. Cards, refills and no-show rules can
-- be layered on top later without touching this.
--
-- In a trigger rather than the server action because the insert goes through
-- PostgREST: anything enforced in application code can be skipped by calling
-- the API directly.
--
-- Only requests that are still answerable count. A pending request against a
-- slot whose time has passed is dead, and holding someone's last place forever
-- because a specialist never replied would punish the wrong person.
create or replace function public.enforce_pending_request_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap constant integer := 3;
  live integer;
begin
  select count(*)
    into live
    from public.bookings b
    join public.availability_slots s on s.id = b.slot_id
   where b.seeker_id = new.seeker_id
     and b.status = 'pending'
     and s.start_time > now();

  if live >= cap then
    raise exception 'pending_request_cap'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_pending_request_cap on public.bookings;

create trigger bookings_pending_request_cap
  before insert on public.bookings
  for each row
  execute function public.enforce_pending_request_cap();

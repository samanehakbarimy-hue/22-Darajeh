-- A request could be accepted after its time had already gone by.
--
-- respond_to_booking checked that the caller owned the request and that it was
-- still pending, but never looked at the clock. A specialist who left a request
-- unanswered for a week could open the dashboard and accept it: the seeker was
-- told "تأیید شده" for a session that happened last Tuesday, and accepting also
-- created a Google Calendar event in the past.
--
-- Declining stays allowed whatever the time — a stale request still needs a way
-- to be cleared off the list, and saying no to it is never wrong.
create or replace function public.respond_to_booking(
  booking_id uuid,
  accept boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  starts_at timestamptz;
begin
  select s.start_time into starts_at
  from public.bookings b
  join public.availability_slots s on s.id = b.slot_id
  where b.id = booking_id
    and b.mentor_id = auth.uid()
    and b.status = 'pending';

  if accept and starts_at is not null and starts_at <= now() then
    raise exception 'That session time has already passed';
  end if;

  update public.bookings b
    set status = case when accept then 'confirmed' else 'declined' end
    where b.id = booking_id
      and b.mentor_id = auth.uid()
      and b.status = 'pending';

  if not found then
    raise exception 'No pending request of yours with that id';
  end if;
end;
$$;

revoke execute on function public.respond_to_booking(uuid, boolean) from public, anon;
grant execute on function public.respond_to_booking(uuid, boolean) to authenticated;

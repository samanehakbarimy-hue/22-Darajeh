-- A booking used to be confirmed the moment it was made, which decided the
-- specialist's calendar for them. A request now waits for their reply.
alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'declined', 'cancelled'));

alter table public.bookings
  alter column status set default 'pending';

-- The slot is held while the request is open, so nobody else can take it and
-- the specialist isn't asked about the same time twice. Turning a request
-- down, or cancelling, puts the time back on offer.
create or replace function public.sync_slot_booked_flag()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.availability_slots
      set is_booked = true
      where id = new.slot_id;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    update public.availability_slots
      set is_booked = new.status in ('pending', 'confirmed')
      where id = new.slot_id;
  elsif tg_op = 'DELETE' then
    update public.availability_slots
      set is_booked = false
      where id = old.slot_id;
  end if;
  return null;
end;
$$;

-- Only the specialist being asked may answer, and only while it is pending.
create or replace function public.respond_to_booking(
  booking_id uuid,
  accept boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
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

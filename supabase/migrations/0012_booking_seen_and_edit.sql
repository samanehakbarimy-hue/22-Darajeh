-- A request is a message to a person, so the person who sent it should be able
-- to see whether it has been read, and change it while it has not been.
alter table public.bookings
  add column if not exists seen_at timestamptz;

-- Marks every open request to this specialist as read. Idempotent, so it can
-- run each time they open their dashboard.
create or replace function public.mark_bookings_seen()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.bookings
    set seen_at = now()
    where mentor_id = auth.uid()
      and status = 'pending'
      and seen_at is null;
end;
$$;

-- The sender may reword their request until the specialist has read it, the
-- way a message can be edited before it is delivered. Once seen, or once
-- answered, it is fixed.
create or replace function public.edit_booking_message(
  booking_id uuid,
  new_message text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if length(btrim(new_message)) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  update public.bookings b
    set message = new_message
    where b.id = booking_id
      and b.seeker_id = auth.uid()
      and b.status = 'pending'
      and b.seen_at is null;

  if not found then
    raise exception 'That request can no longer be edited';
  end if;
end;
$$;

revoke execute on function public.mark_bookings_seen() from public, anon;
grant execute on function public.mark_bookings_seen() to authenticated;

revoke execute on function public.edit_booking_message(uuid, text) from public, anon;
grant execute on function public.edit_booking_message(uuid, text) to authenticated;

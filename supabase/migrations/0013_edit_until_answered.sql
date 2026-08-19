-- Editing was locked the moment the specialist opened the request, which left
-- a badly written message stuck there until the call. A request can now be
-- reworded until it is actually answered — the specialist reads it again
-- before deciding, and an edit is marked so nothing changes behind their back.
alter table public.bookings
  add column if not exists edited_at timestamptz;

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
    set message = new_message,
        edited_at = now()
    where b.id = booking_id
      and b.seeker_id = auth.uid()
      and b.status = 'pending';

  if not found then
    raise exception 'That request can no longer be edited';
  end if;
end;
$$;

revoke execute on function public.edit_booking_message(uuid, text) from public, anon;
grant execute on function public.edit_booking_message(uuid, text) to authenticated;

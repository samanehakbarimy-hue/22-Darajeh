-- Editing a request left it marked as seen, which was no longer true: the
-- specialist had read the old text, not the new one. An edit puts the request
-- back to unread, so it shows as waiting again and is marked seen when the
-- specialist actually opens the new version.
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
        edited_at = now(),
        seen_at = null
    where b.id = booking_id
      and b.seeker_id = auth.uid()
      and b.status = 'pending'
      and b.message is distinct from new_message;

  if not found then
    raise exception 'That request could not be edited';
  end if;
end;
$$;

revoke execute on function public.edit_booking_message(uuid, text) from public, anon;
grant execute on function public.edit_booking_message(uuid, text) to authenticated;

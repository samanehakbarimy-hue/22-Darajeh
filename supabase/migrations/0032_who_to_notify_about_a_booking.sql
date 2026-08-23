-- Everything the site needs in order to write to someone about a booking.
--
-- Emails live in auth.users, which the browser client cannot read, and this
-- project deliberately has no service-role key — so the same approach as
-- admin_list_members and delete_own_account: definer rights, with the caller
-- checked first. Only the two people involved in a booking can ask, and all
-- they can ask about is that one booking.
--
-- The result never reaches the browser. It is read inside a server action,
-- used to address an email, and discarded.
create or replace function public.booking_parties(booking_id uuid)
returns table (
  seeker_name text,
  seeker_email text,
  mentor_name text,
  mentor_email text,
  starts_at timestamptz,
  ends_at timestamptz,
  message text,
  meeting_link text,
  status text
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.seeker_id = auth.uid() or b.mentor_id = auth.uid())
  ) then
    raise exception 'Not your booking';
  end if;

  return query
    select
      sp.full_name,
      su.email::text,
      mp.full_name,
      mu.email::text,
      s.start_time,
      s.end_time,
      b.message,
      -- The link made for this booking, else the specialist's standing one.
      coalesce(b.meeting_link, ml.meeting_link),
      b.status
    from public.bookings b
    join public.availability_slots s on s.id = b.slot_id
    join public.profiles sp on sp.id = b.seeker_id
    join auth.users su on su.id = b.seeker_id
    join public.profiles mp on mp.id = b.mentor_id
    join auth.users mu on mu.id = b.mentor_id
    left join public.mentor_meeting_links ml on ml.id = b.mentor_id
    where b.id = booking_id;
end;
$$;

revoke execute on function public.booking_parties(uuid) from public, anon;
grant execute on function public.booking_parties(uuid) to authenticated;

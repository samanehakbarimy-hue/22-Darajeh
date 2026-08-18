-- Lets a logged-in user permanently delete their own account, without
-- needing the service-role key in the app. Deleting from auth.users
-- cascades through profiles -> mentor_profiles -> availability_slots
-- -> bookings automatically, thanks to the on delete cascade foreign
-- keys already in place.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

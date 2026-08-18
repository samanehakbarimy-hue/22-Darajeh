-- Lets the admin page list everyone who has registered, including their email.
-- Emails live in auth.users, which the browser client cannot read directly, so
-- this runs as definer and checks the caller is an admin before returning
-- anything — the same approach used for account deletion and status changes,
-- so the project still needs no service-role key.
create or replace function public.admin_list_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  photo_url text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only an admin can list members';
  end if;

  return query
    select
      p.id,
      p.full_name,
      u.email::text,
      p.role,
      p.photo_url,
      m.status,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.mentor_profiles m on m.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;

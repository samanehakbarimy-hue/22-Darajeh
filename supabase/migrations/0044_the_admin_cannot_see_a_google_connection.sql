-- Approving a specialist whose meeting links come from Google was impossible.
--
-- approveMentor refuses to publish someone who cannot be met: it looks for a
-- standing meeting link, and failing that, for a connected Google account,
-- because those specialists get a fresh link per booking. The Google check
-- read mentor_google_connected — a security_invoker view over a table whose
-- only policy is "auth.uid() = id". Read by an admin it therefore matches
-- nothing, ever.
--
-- So the button silently did the opposite of what it says: pressing تأیید on
-- a Google-connected specialist with no standing link sent them away with
-- "add a meeting link" instead of approving them. The one specialist on the
-- site is in exactly that state.
--
-- The table itself stays unreadable — it holds OAuth refresh tokens, and an
-- admin has no business in it. This answers the only question that is
-- actually being asked, and answers it with a boolean.
create or replace function public.mentor_has_google(mentor uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not (auth.uid() = mentor or public.is_admin()) then
    raise exception 'Not yours to ask';
  end if;

  return exists (
    select 1 from public.mentor_google_accounts where id = mentor
  );
end;
$$;

revoke execute on function public.mentor_has_google(uuid) from public, anon;
grant execute on function public.mentor_has_google(uuid) to authenticated;

-- The members list carries it too, so the admin page can say "through Google"
-- instead of warning about a link that is not missing.
drop function if exists public.admin_list_members();

create or replace function public.admin_list_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  photo_url text,
  status text,
  phone text,
  has_google boolean,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid() and pr.role = 'admin'
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
      nullif(coalesce(mc.phone, sc.phone, ''), '') as phone,
      exists (select 1 from public.mentor_google_accounts g where g.id = p.id)
        as has_google,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.mentor_profiles m on m.id = p.id
    left join public.mentor_contacts mc on mc.id = p.id
    left join public.seeker_contacts sc on sc.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;

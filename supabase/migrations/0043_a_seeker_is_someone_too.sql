-- A seeker was an account and nothing else.
--
-- Browsing needs no account and should not: someone lands, searches, reads a
-- profile, and is only asked to sign in when they try to book. By then they
-- are the person a specialist is about to give half an hour to, and all we
-- held was an email address buried in auth.users.
--
-- Mobile and email are the minimum. The email is already in auth.users; this
-- gives the phone somewhere to live, and it deliberately mirrors
-- mentor_contacts rather than going on profiles: a phone number is not part of
-- a public profile and should not sit in the table the browse page reads.
create table if not exists public.seeker_contacts (
  id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.seeker_contacts enable row level security;

drop policy if exists "Seekers manage their own contact details" on public.seeker_contacts;
create policy "Seekers manage their own contact details"
  on public.seeker_contacts for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can read seeker contact details" on public.seeker_contacts;
create policy "Admins can read seeker contact details"
  on public.seeker_contacts for select
  using (public.is_admin());

-- The admin list gains the phone, from whichever side of the site the person
-- is on. Dropped rather than replaced because the return type changes.
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

-- profiles was readable by anyone with the anon key, which ships in the
-- browser. That exposed the real name of every person who had merely signed
-- up to book a call, and revealed which accounts are admins.
--
-- A specialist's name and photo genuinely are public — they are on the
-- listings. Nobody else's are.

-- Checking "am I an admin?" from a policy on profiles would read profiles and
-- recurse. Definer runs outside RLS, so it answers without looping.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;

create policy "Approved specialists are publicly readable"
  on public.profiles for select
  using (
    exists (
      select 1 from public.mentor_profiles m
      where m.id = profiles.id and m.status = 'approved'
    )
  );

create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admins can read every profile"
  on public.profiles for select
  using (public.is_admin());

-- A specialist has to know who is asking them for a session.
create policy "Specialists can read people who booked them"
  on public.profiles for select
  using (
    exists (
      select 1 from public.bookings b
      where b.seeker_id = profiles.id and b.mentor_id = auth.uid()
    )
  );

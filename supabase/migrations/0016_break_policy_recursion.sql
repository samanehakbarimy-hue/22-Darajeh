-- Restricting profiles created a loop: reading a profile checks
-- mentor_profiles, whose admin policy reads profiles, which checks
-- mentor_profiles again. Postgres refuses with "infinite recursion".
--
-- Every one of these policies only wants to know "is the caller an admin?".
-- is_admin() answers that as definer, outside RLS, so the loop cannot form.
drop policy if exists "Admins can read all mentor profiles" on public.mentor_profiles;
create policy "Admins can read all mentor profiles"
  on public.mentor_profiles for select
  using (public.is_admin());

drop policy if exists "Mentors and admins can update mentor profiles" on public.mentor_profiles;
create policy "Mentors and admins can update mentor profiles"
  on public.mentor_profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can read contact details" on public.mentor_contacts;
create policy "Admins can read contact details"
  on public.mentor_contacts for select
  using (public.is_admin());

drop policy if exists "Admins can read meeting links" on public.mentor_meeting_links;
create policy "Admins can read meeting links"
  on public.mentor_meeting_links for select
  using (public.is_admin());

-- anon never calls this, but the public listing reads profiles while signed
-- out, so the function has to be callable there too.
grant execute on function public.is_admin() to anon;

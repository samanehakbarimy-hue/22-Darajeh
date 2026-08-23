-- Services should follow the same rule as everything else a specialist owns:
-- invisible until they are approved.
--
-- The original policy was simply `is_active`, because checking approval means
-- reading mentor_profiles from inside a policy, and doing that naively is how
-- this schema produced an infinite recursion once already (see 0016).
--
-- The fix is the pattern that solved it there: a SECURITY DEFINER function.
-- It reads the table with the definer's rights, so no policy on
-- mentor_profiles is consulted and there is no cycle to fall into.
create or replace function public.is_approved_mentor(mentor uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.mentor_profiles
    where id = mentor and status = 'approved'
  );
$$;

revoke all on function public.is_approved_mentor(uuid) from public;
grant execute on function public.is_approved_mentor(uuid) to anon, authenticated;

drop policy if exists "active services are public" on mentor_services;
create policy "active services are public"
  on mentor_services for select
  using (is_active and is_approved_mentor(mentor_id));

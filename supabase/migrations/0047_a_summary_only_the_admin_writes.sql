-- A short account of a specialist, written by the site rather than by them.
--
-- Everything else on a profile is the specialist's own words. This is the
-- house view: what they actually do, who they can help, in the site's voice.
-- It is worth having precisely because the reader knows the specialist did
-- not write it — so the specialist must not be able to.
alter table public.mentor_profiles
  add column if not exists admin_summary text;

-- Guarded the way the approval status is. A column-level revoke would be the
-- other way, but mentor_profiles hands the authenticated role UPDATE on the
-- table, and unpicking that means granting every other column by name and
-- remembering to grant the next one too.
create or replace function public.guard_admin_summary()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.admin_summary is distinct from old.admin_summary
     -- A direct database connection is already inside the fence.
     and auth.uid() is not null
     and not public.is_admin()
  then
    raise exception 'Only an admin can write the summary';
  end if;
  return new;
end;
$$;

drop trigger if exists mentor_admin_summary_guard on public.mentor_profiles;

create trigger mentor_admin_summary_guard
  before update on public.mentor_profiles
  for each row execute function public.guard_admin_summary();

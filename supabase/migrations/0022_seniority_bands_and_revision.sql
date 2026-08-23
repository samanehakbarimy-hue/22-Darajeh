-- Three experience bands instead of four, splitting at 7 and 14 years.
--
-- The old set started at 1–3 years. A marketplace whose whole promise is
-- "ask someone who does this job" needs a floor, and three years is where
-- someone stops describing their own training and starts describing the work.
update mentor_profiles set seniority = 'mid'       where seniority = 'junior';
update mentor_profiles set seniority = 'principal' where seniority = 'lead';

alter table mentor_profiles drop constraint if exists mentor_profiles_seniority_check;
alter table mentor_profiles
  add constraint mentor_profiles_seniority_check
  check (seniority is null or seniority in ('mid', 'senior', 'principal'));

-- A claim of experience is worth nothing unless somebody checks it, so
-- approval gains a third answer between yes and no: ask for a correction.
alter table mentor_profiles drop constraint if exists mentor_profiles_status_check;
alter table mentor_profiles
  add constraint mentor_profiles_status_check
  check (status in ('pending', 'approved', 'rejected', 'changes_requested'));

-- What the admin wants changed. Shown to the specialist, so it is written to
-- be read by them, not as an internal note.
alter table mentor_profiles
  add column if not exists review_note text;

-- A specialist cannot set their own status — guard_mentor_status_change stops
-- that, and should. But they must be able to hand a corrected profile back,
-- so this narrow definer function does exactly that one move and nothing else:
-- their own row, only out of changes_requested, only into pending.
create or replace function public.resubmit_profile_for_review()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update mentor_profiles
  set status = 'pending',
      review_note = null
  where id = auth.uid()
    and status = 'changes_requested';
end;
$$;

revoke all on function public.resubmit_profile_for_review() from public;
-- Supabase default privileges hand EXECUTE to anon on every new function in
-- public. Harmless here, since auth.uid() is null for an anonymous caller and
-- the update matches no rows — but a signed-out visitor has no business
-- calling it at all.
revoke all on function public.resubmit_profile_for_review() from anon;
grant execute on function public.resubmit_profile_for_review() to authenticated;

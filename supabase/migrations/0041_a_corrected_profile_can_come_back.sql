-- A specialist asked to fix something could never hand the profile back.
--
-- 0022 added "ask for a correction" as a third answer, and gave the specialist
-- resubmit_profile_for_review() to return to the queue with. That function is
-- SECURITY DEFINER, which was taken to mean the status guard would stand aside
-- for it. It does not: SECURITY DEFINER changes which role executes, not what
-- auth.uid() returns, so the guard saw a non-admin moving a status and raised.
-- The caller in lib/actions/mentor.ts discarded the error, so the specialist
-- was told the profile was saved and then waited in changes_requested forever,
-- invisible to the admin queue. It had never been run by anyone but us.
--
-- So the guard names the move instead of the mechanism: their own row, only
-- out of changes_requested, only into pending. That is the same single step
-- the definer function was written to allow, and nothing else changes hands.
create or replace function public.guard_mentor_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.id = auth.uid()
       and old.status = 'changes_requested'
       and new.status = 'pending'
    then
      return new;
    end if;

    if auth.uid() is not null
       and not exists (
         select 1 from public.profiles
         where id = auth.uid() and role = 'admin'
       )
    then
      raise exception 'Only an admin can change a mentor''s approval status';
    end if;
  end if;
  return new;
end;
$$;

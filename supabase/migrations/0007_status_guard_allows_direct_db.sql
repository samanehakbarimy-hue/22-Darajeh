-- The status guard also blocked direct database access (SQL editor, service
-- role), because auth.uid() is null there and the admin lookup found nothing.
-- Anyone with a direct connection already owns the database, so the guard only
-- needs to constrain requests coming from a logged-in app user.
create or replace function public.guard_mentor_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
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

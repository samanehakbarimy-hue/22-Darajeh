-- Anyone who signed up could make themselves an admin. Two ways in.
--
-- 1. profiles.role was updatable by the authenticated role, and the policy
--    that lets you edit your own profile checks only that the row is yours.
--    RLS cannot restrict columns, so "edit your own name and photo" also
--    meant "set your own role", and one PostgREST call with the public anon
--    key was enough: update profiles set role='admin' where id=<me>.
--
-- 2. handle_new_user copies the role straight out of raw_user_meta_data,
--    which is whatever the browser passed to signUp. Asking for
--    {"role":"admin"} at signup created an admin outright, without even
--    needing an account first.
--
-- Either one hands over every member's email address through
-- admin_list_members(), the contact phones, the meeting links, and the
-- approval buttons. Both were reachable by anybody on the internet.
--
-- The role a person may choose for themselves is seeker or mentor. Anything
-- else is granted, not claimed, and only an admin can grant it. That rule is
-- written twice below because the two doors are genuinely different: one is a
-- write to an existing row, the other is the row being created.

-- Door 1: the update path, guarded the way mentor status already is.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and new.role not in ('seeker', 'mentor')
     -- A direct database connection is already inside the fence; this is
     -- about requests arriving as a logged-in user.
     and auth.uid() is not null
     and not public.is_admin()
  then
    raise exception 'Only an admin can grant the % role', new.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- Door 2: the signup path. The choice on the signup page is real — mentor or
-- seeker — so it is honoured, and anything else falls back to seeker rather
-- than raising, because a stranger's malformed metadata should not be able to
-- fail somebody's registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'seeker');
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when requested in ('seeker', 'mentor') then requested else 'seeker' end,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

-- A signed-out visitor has no business writing to profiles at all. RLS already
-- stops them, since every policy compares against auth.uid(); this removes the
-- grant that made RLS the only thing standing there.
revoke update on public.profiles from anon;

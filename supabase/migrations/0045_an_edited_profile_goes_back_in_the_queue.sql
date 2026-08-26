-- An approved specialist could rewrite their profile and it went straight
-- live. The headline, the bio, the years claimed, the company, the LinkedIn
-- address the whole check hangs on — all editable after approval, none of it
-- seen again. Approval meant "this was true once".
--
-- A public edit now returns them to the queue. It costs them visibility until
-- somebody looks, which is the point: the alternative is an approval that
-- guarantees nothing about what is on the page today.
--
-- Only their own edits, only from approved, and only the fields a visitor can
-- see. Changing a phone number or a meeting link is nobody's business but
-- theirs and does not unpublish them.
create or replace function public.public_edit_returns_to_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- An admin editing somebody, or a direct database connection, decides for
  -- itself. This is about a specialist editing their own page.
  if auth.uid() is null or new.id is distinct from auth.uid() then
    return new;
  end if;

  if old.status is distinct from 'approved' then
    return new;
  end if;

  -- Something in this same statement is already moving the status; leave it.
  if new.status is distinct from old.status then
    return new;
  end if;

  if new.headline      is distinct from old.headline
     or new.company    is distinct from old.company
     or new.bio        is distinct from old.bio
     or new.country    is distinct from old.country
     or new.seniority  is distinct from old.seniority
     or new.linkedin_url   is distinct from old.linkedin_url
     or new.expertise_tags is distinct from old.expertise_tags
     or new.skills         is distinct from old.skills
  then
    new.status := 'pending';
    -- The old note was about the old profile.
    new.review_note := null;
  end if;

  return new;
end;
$$;

-- Fires before mentor_status_guard, which is what the name buys: triggers run
-- in alphabetical order, and the guard has to see the status this one sets.
drop trigger if exists mentor_edit_returns_to_review on public.mentor_profiles;

create trigger mentor_edit_returns_to_review
  before update on public.mentor_profiles
  for each row execute function public.public_edit_returns_to_review();

-- The guard has to let that move through. It is the same shape as the
-- resubmit in 0041 — their own row, into pending — and it can only ever take
-- someone off the public list, never put them on it.
create or replace function public.guard_mentor_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.id = auth.uid()
       and old.status in ('changes_requested', 'approved')
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

-- The photo lives on profiles, not here, and swapping the face on an approved
-- profile is the most public edit there is.
create or replace function public.photo_change_returns_to_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.id = auth.uid()
     and new.photo_url is distinct from old.photo_url
  then
    update public.mentor_profiles
       set status = 'pending', review_note = null
     where id = new.id and status = 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists profile_photo_returns_to_review on public.profiles;

create trigger profile_photo_returns_to_review
  after update on public.profiles
  for each row execute function public.photo_change_returns_to_review();

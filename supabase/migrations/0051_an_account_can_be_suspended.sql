-- Suspending an account, for a specialist or a seeker.
--
-- What already existed, and why it was not enough:
--
-- A specialist could be taken down today by rejecting them. That works -- the
-- profile stops being public, the slots stop being visible so nobody can book,
-- and inquiries are refused -- but it is the wrong word said to the wrong
-- person. "Rejected" is the answer to an application; somebody who was
-- approved for months and is now being stopped is a different thing, and the
-- specialist reads that word on their own page.
--
-- A seeker could not be stopped at all. They could book, ask, send briefs and
-- write reviews, and nothing in the database had an opinion about it. That is
-- the real hole this fills.
--
-- One flag for both, because it is one idea. Null means the account is fine.

alter table public.profiles
  add column if not exists suspended_at timestamptz;

comment on column public.profiles.suspended_at is
  'When an admin suspended this account. Null means active. Separate from a '
  'specialist''s review status: rejection answers an application, suspension '
  'stops an account that was already in good standing.';

-- Definer, so a policy can ask about somebody other than the caller without
-- being stopped by the profiles policies on the way.
create or replace function public.is_suspended(who uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = who and suspended_at is not null
  );
$$;

revoke all on function public.is_suspended(uuid) from public;
grant execute on function public.is_suspended(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- A suspended account cannot do anything to anybody.
--
-- Four things a seeker can create, and all four now ask first. The rest of
-- each policy is exactly as it was; only the suspension clause is new.
-- ---------------------------------------------------------------------------

drop policy if exists "Seekers can book themselves into an open slot" on public.bookings;
create policy "Seekers can book themselves into an open slot"
  on public.bookings for insert
  with check (
    seeker_id = auth.uid()
    and not public.is_suspended()
    and exists (
      select 1 from availability_slots s
      where s.id = bookings.slot_id
        and s.is_booked = false
        and s.mentor_id = bookings.mentor_id
        and s.start_time > now()
    )
  );

drop policy if exists "a seeker asks a specialist" on public.inquiries;
create policy "a seeker asks a specialist"
  on public.inquiries for insert
  with check (
    seeker_id = auth.uid()
    and not public.is_suspended()
    and mentor_id <> auth.uid()
    and is_approved_mentor(mentor_id)
    and answered_at is null
  );

drop policy if exists "seekers can send a brief" on public.project_briefs;
create policy "seekers can send a brief"
  on public.project_briefs for insert
  with check (
    seeker_id = auth.uid()
    and not public.is_suspended()
    and mentor_id <> auth.uid()
    and is_approved_mentor(mentor_id)
    and status = 'pending'
    and exists (
      select 1 from mentor_services s
      where s.mentor_id = project_briefs.mentor_id
        and s.kind = 'hourly_project'
        and s.is_active
    )
  );

drop policy if exists "a seeker reviews a session they had" on public.reviews;
create policy "a seeker reviews a session they had"
  on public.reviews for insert
  with check (
    seeker_id = auth.uid()
    and not public.is_suspended()
    and exists (
      select 1 from bookings b
        join availability_slots s on s.id = b.slot_id
      where b.id = reviews.booking_id
        and b.seeker_id = auth.uid()
        and b.mentor_id = reviews.mentor_id
        and b.status = 'confirmed'
        and s.end_time < now()
    )
  );

-- ---------------------------------------------------------------------------
-- A suspended specialist comes off the site.
--
-- The `id = auth.uid()` branch stays untouched on purpose: they can still see
-- their own page and their own slots. Being suspended should not look like
-- their account was deleted.
-- ---------------------------------------------------------------------------

drop policy if exists "Approved mentor profiles are publicly readable" on public.mentor_profiles;
create policy "Approved mentor profiles are publicly readable"
  on public.mentor_profiles for select
  using (
    (status = 'approved' and not public.is_suspended(id))
    or id = auth.uid()
  );

-- And with the slots hidden, there is nothing left to book: the booking policy
-- proves the slot exists by reading it as the seeker, which is the same reason
-- an unapproved specialist cannot be booked today.
drop policy if exists "Slots for approved mentors are publicly readable" on public.availability_slots;
create policy "Slots for approved mentors are publicly readable"
  on public.availability_slots for select
  using (
    exists (
      select 1 from mentor_profiles
      where mentor_profiles.id = availability_slots.mentor_id
        and mentor_profiles.status = 'approved'
        and not public.is_suspended(mentor_profiles.id)
    )
    or mentor_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Only an admin turns it on or off.
--
-- A function rather than a widened profiles policy, for the same reason
-- admin_set_photo is one: this needs to write a single column on somebody
-- else's row, not to be handed the row.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_suspended(target uuid, suspend boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can suspend an account';
  end if;

  if target = auth.uid() then
    raise exception 'An admin cannot suspend their own account';
  end if;

  update public.profiles
     set suspended_at = case when suspend then now() else null end
   where id = target;
end;
$$;

revoke all on function public.admin_set_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;

-- The admin page reads its list from here, so the state has to come with it.
-- Same function, one column wider.
create or replace function public.admin_list_members()
returns table(id uuid, full_name text, email text, role text, photo_url text,
              status text, phone text, has_google boolean,
              suspended_at timestamptz, created_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      exists (select 1 from public.mentor_google_accounts g where g.id = p.id)
        as has_google,
      p.suspended_at,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.mentor_profiles m on m.id = p.id
    left join public.mentor_contacts mc on mc.id = p.id
    left join public.seeker_contacts sc on sc.id = p.id
    order by p.created_at desc;
end;
$function$;

-- What a specialist cannot write about themselves.
--
-- Every other claim on a profile is theirs: the headline, the years, the bio.
-- The admin checks them, but a check is not evidence. This is the one thing on
-- the page that comes from somebody who actually turned up.
--
-- A review hangs off a booking rather than off a pair of people, and the
-- booking is unique here: one session, one review. That is what makes it
-- verifiable rather than a comment box — there is no way to leave one without
-- a confirmed session that has already happened.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(btrim(body)) between 10 and 1500),
  created_at timestamptz not null default now()
);

create index if not exists reviews_mentor_idx on public.reviews (mentor_id, created_at desc);

alter table public.reviews enable row level security;

-- Public, like the profile they sit on. A review nobody can read is a diary.
drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public"
  on public.reviews for select
  using (true);

-- The only way in: your own session, with that specialist, accepted, and over.
-- Written as a policy rather than checked in the action, because the insert
-- goes through PostgREST and anything enforced only in application code can be
-- skipped by calling the API directly.
drop policy if exists "a seeker reviews a session they had" on public.reviews;
create policy "a seeker reviews a session they had"
  on public.reviews for insert
  with check (
    seeker_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      join public.availability_slots s on s.id = b.slot_id
      where b.id = reviews.booking_id
        and b.seeker_id = auth.uid()
        and b.mentor_id = reviews.mentor_id
        and b.status = 'confirmed'
        and s.end_time < now()
    )
  );

-- Second thoughts belong to the person who wrote it.
drop policy if exists "a seeker can take back their review" on public.reviews;
create policy "a seeker can take back their review"
  on public.reviews for delete
  using (seeker_id = auth.uid() or public.is_admin());

-- A review needs the name of whoever wrote it, and profiles stopped being
-- fully public in 0015 — a signed-out visitor cannot read a seeker's name.
-- So the same approach as booking_parties and held_session_count: definer
-- rights, returning exactly what a review is and nothing else about the
-- person who left it.
create or replace function public.mentor_reviews(mentor uuid)
returns table (
  id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  seeker_name text
)
language sql
security definer
stable
set search_path = public
as $$
  select r.id, r.rating, r.body, r.created_at, p.full_name
  from public.reviews r
  join public.profiles p on p.id = r.seeker_id
  where r.mentor_id = mentor
  order by r.created_at desc;
$$;

revoke execute on function public.mentor_reviews(uuid) from public;
grant execute on function public.mentor_reviews(uuid) to anon, authenticated;

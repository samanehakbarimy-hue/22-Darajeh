-- A question before committing to anything.
--
-- Somebody reads a profile and is not ready to book: they want to ask whether
-- this is even the right person. That question had nowhere to go — the only
-- way to reach a specialist was to take one of their slots.
--
-- The first message is a request, not the start of a chat. One open inquiry
-- per specialist at a time, enforced by an index rather than by the form:
-- until it is answered there is no second one, so nobody can be buried under
-- messages from one person.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(btrim(body)) between 10 and 2000),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create unique index if not exists inquiries_one_open_per_pair
  on public.inquiries (seeker_id, mentor_id)
  where answered_at is null;

create index if not exists inquiries_mentor_idx
  on public.inquiries (mentor_id, created_at desc);

alter table public.inquiries enable row level security;

-- Between the two people in it and nobody else. Not public: an inquiry is a
-- question somebody was unsure enough to ask privately.
drop policy if exists "an inquiry belongs to the two people in it" on public.inquiries;
create policy "an inquiry belongs to the two people in it"
  on public.inquiries for select
  using (seeker_id = auth.uid() or mentor_id = auth.uid());

-- Only as yourself, and only to a specialist the site has approved.
drop policy if exists "a seeker asks a specialist" on public.inquiries;
create policy "a seeker asks a specialist"
  on public.inquiries for insert
  with check (
    seeker_id = auth.uid()
    and mentor_id <> auth.uid()
    and public.is_approved_mentor(mentor_id)
    and answered_at is null
  );

-- The specialist closes it when they have answered, which is what lets the
-- next question through.
drop policy if exists "the specialist marks it answered" on public.inquiries;
create policy "the specialist marks it answered"
  on public.inquiries for update
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- Somebody read a profile, was not ready to book, and had no way to keep it.
--
-- Private to whoever saved it. A specialist has no business knowing who is
-- considering them, and a count of it would be a vanity number that says
-- nothing about whether anyone turned up.
create table if not exists public.saved_specialists (
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (seeker_id, mentor_id)
);

alter table public.saved_specialists enable row level security;

drop policy if exists "your own saved list" on public.saved_specialists;
create policy "your own saved list"
  on public.saved_specialists for all
  using (seeker_id = auth.uid())
  with check (seeker_id = auth.uid());

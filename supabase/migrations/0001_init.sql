-- 22 Darajeh — initial schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run).

-- ============================================================
-- profiles: one row per account (mentor, seeker, or admin)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('mentor', 'seeker', 'admin')),
  full_name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Automatically create a profile row whenever someone signs up.
-- Expects `full_name` and `role` to be passed as signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'seeker'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- mentor_profiles: extra info + approval status for mentors
-- ============================================================
create table public.mentor_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  bio text not null default '',
  expertise_tags text[] not null default '{}',
  linkedin_url text,
  meeting_link text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.mentor_profiles enable row level security;

create index mentor_profiles_status_idx on public.mentor_profiles (status);
create index mentor_profiles_tags_idx on public.mentor_profiles using gin (expertise_tags);

create policy "Approved mentor profiles are publicly readable"
  on public.mentor_profiles for select
  using (status = 'approved' or id = auth.uid());

create policy "Admins can read all mentor profiles"
  on public.mentor_profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Mentors can create their own mentor profile"
  on public.mentor_profiles for insert
  with check (id = auth.uid());

create policy "Mentors and admins can update mentor profiles"
  on public.mentor_profiles for update
  using (
    id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only an admin may change the approval status; mentors can edit everything else.
create or replace function public.guard_mentor_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Only an admin can change a mentor''s approval status';
    end if;
  end if;
  return new;
end;
$$;

create trigger mentor_status_guard
  before update on public.mentor_profiles
  for each row execute function public.guard_mentor_status_change();

-- ============================================================
-- availability_slots: time windows a mentor has opened up
-- ============================================================
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_slot_time check (end_time > start_time)
);

alter table public.availability_slots enable row level security;

create index availability_slots_mentor_idx on public.availability_slots (mentor_id, start_time);

create policy "Slots for approved mentors are publicly readable"
  on public.availability_slots for select
  using (
    exists (
      select 1 from public.mentor_profiles
      where id = availability_slots.mentor_id and status = 'approved'
    )
    or mentor_id = auth.uid()
  );

create policy "Mentors manage their own slots"
  on public.availability_slots for all
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- ============================================================
-- bookings: a seeker claiming a mentor's open slot
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null unique references public.availability_slots (id) on delete cascade,
  mentor_id uuid not null references public.mentor_profiles (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create index bookings_seeker_idx on public.bookings (seeker_id);
create index bookings_mentor_idx on public.bookings (mentor_id);

create policy "Seekers and mentors can read their own bookings"
  on public.bookings for select
  using (seeker_id = auth.uid() or mentor_id = auth.uid());

-- The `slot_id` UNIQUE constraint above is what actually prevents two
-- people from booking the same slot at the same time (the database
-- rejects the second insert even if both requests arrive together);
-- this check just keeps things tidy for the common case.
create policy "Seekers can book themselves into an open slot"
  on public.bookings for insert
  with check (
    seeker_id = auth.uid()
    and exists (
      select 1 from public.availability_slots
      where id = slot_id and is_booked = false
    )
  );

create policy "Seekers and mentors can cancel a booking"
  on public.bookings for update
  using (seeker_id = auth.uid() or mentor_id = auth.uid())
  with check (seeker_id = auth.uid() or mentor_id = auth.uid());

-- Keep availability_slots.is_booked in sync with bookings automatically.
create or replace function public.sync_slot_booked_flag()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.availability_slots set is_booked = true where id = new.slot_id;
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.availability_slots set is_booked = false where id = new.slot_id;
  elsif tg_op = 'DELETE' then
    update public.availability_slots set is_booked = false where id = old.slot_id;
  end if;
  return null;
end;
$$;

create trigger bookings_sync_slot
  after insert or update or delete on public.bookings
  for each row execute function public.sync_slot_booked_flag();

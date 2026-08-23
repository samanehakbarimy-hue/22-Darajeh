-- Paid services a specialist offers, beyond the free 22-minute call.
--
-- Until now the profile showed a catalogue defined in code, identical for
-- everyone and priced by nobody. A price under a named person's photo has to
-- be a price that person set, so it lives here, per specialist.
--
-- The free call is deliberately NOT in this table. There is exactly one, it
-- has no price, and it is the one thing that must exist for every specialist
-- — making it a row would let a specialist delete it by accident.
create table if not exists mentor_services (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references profiles (id) on delete cascade,

  -- Sold by the session, or by the hour.
  kind text not null check (kind in ('consultation', 'hourly_project')),

  title text not null check (length(btrim(title)) between 1 and 80),
  description text not null default '' check (length(description) <= 300),

  -- A consultation has a length; a project has a floor on hours. Each kind
  -- uses one of these, enforced below rather than left to the application.
  minutes integer check (minutes between 5 and 480),
  min_hours integer check (min_hours between 1 and 200),

  -- Toman. Null means "not priced yet", which the profile shows as به‌زودی
  -- rather than as free — the free call is the only free thing here.
  price_toman bigint check (price_toman is null or price_toman >= 0),

  -- Lets a specialist take something down without losing what they wrote.
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  constraint consultation_has_minutes check (
    kind <> 'consultation' or minutes is not null
  ),
  constraint project_has_min_hours check (
    kind <> 'hourly_project' or min_hours is not null
  )
);

create index if not exists mentor_services_mentor_idx
  on mentor_services (mentor_id, kind, sort_order);

alter table mentor_services enable row level security;

-- Readable by anyone: these are shop-window items, not personal data. The
-- check is deliberately not "…and the mentor is approved" — that would query
-- mentor_profiles from inside a policy, which is how this schema produced an
-- infinite recursion once before. An unapproved specialist has no public
-- profile page for these to appear on anyway.
drop policy if exists "active services are public" on mentor_services;
create policy "active services are public"
  on mentor_services for select
  using (is_active);

-- A specialist manages their own, including the inactive ones.
drop policy if exists "mentor reads own services" on mentor_services;
create policy "mentor reads own services"
  on mentor_services for select
  using (auth.uid() = mentor_id);

drop policy if exists "mentor writes own services" on mentor_services;
create policy "mentor writes own services"
  on mentor_services for insert
  with check (auth.uid() = mentor_id);

drop policy if exists "mentor updates own services" on mentor_services;
create policy "mentor updates own services"
  on mentor_services for update
  using (auth.uid() = mentor_id)
  with check (auth.uid() = mentor_id);

drop policy if exists "mentor deletes own services" on mentor_services;
create policy "mentor deletes own services"
  on mentor_services for delete
  using (auth.uid() = mentor_id);

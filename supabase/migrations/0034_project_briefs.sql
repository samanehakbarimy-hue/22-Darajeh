-- The other half of project work: the part the specialist cannot write.
--
-- A seeker describes the job and the specialist answers with terms — a rate
-- and an estimate — or says no. This is the shape every freelance marketplace
-- settles on (Ponisha, Upwork), minus the parts that need money to move:
-- escrow, milestones, invoices. Those wait for a payment gateway.
create table if not exists project_briefs (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,

  brief text not null check (length(btrim(brief)) between 20 and 4000),

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),

  -- The specialist's answer. A rate is quoted per brief rather than taken from
  -- the profile, because the profile rate is a starting point and a particular
  -- job may be worth more or less.
  quoted_rate_toman bigint check (quoted_rate_toman is null or quoted_rate_toman >= 0),
  estimated_hours integer check (estimated_hours is null or (estimated_hours between 1 and 2000)),
  reply_note text check (reply_note is null or length(reply_note) <= 2000),

  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Answering means saying what the terms are. Declining does not.
alter table project_briefs drop constraint if exists accepted_brief_has_terms;
alter table project_briefs
  add constraint accepted_brief_has_terms
  check (
    status <> 'accepted'
    or (quoted_rate_toman is not null and estimated_hours is not null)
  );

create index if not exists project_briefs_mentor_idx on project_briefs (mentor_id, status);
create index if not exists project_briefs_seeker_idx on project_briefs (seeker_id, created_at desc);

-- One open brief at a time between the same two people, so a specialist's
-- inbox cannot be flooded by one person re-sending the same job.
drop index if exists project_briefs_one_open_per_pair;
create unique index project_briefs_one_open_per_pair
  on project_briefs (mentor_id, seeker_id)
  where status = 'pending';

alter table project_briefs enable row level security;

-- Only the two people involved ever see a brief. It contains someone's
-- unpublished work problem, which is not public and not the admin's either.
drop policy if exists "a brief belongs to the two people in it" on project_briefs;
create policy "a brief belongs to the two people in it"
  on project_briefs for select
  using (seeker_id = auth.uid() or mentor_id = auth.uid());

-- Sending one: only as yourself, only to an approved specialist, and only if
-- they actually offer project work.
drop policy if exists "seekers can send a brief" on project_briefs;
create policy "seekers can send a brief"
  on project_briefs for insert
  with check (
    seeker_id = auth.uid()
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

-- Responding is a definer function below; nothing here may update directly,
-- the same treatment bookings got after an over-broad policy let a seeker
-- confirm their own request.

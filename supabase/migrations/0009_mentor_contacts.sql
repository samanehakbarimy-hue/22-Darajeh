-- Contact details need tighter access than the rest of a mentor profile.
-- mentor_profiles is readable by anyone once approved, so meeting_link sitting
-- there meant every mentor's call link was world-readable — and a phone number
-- added beside it would have been too. Move both into their own table, visible
-- only to the mentor, an admin, or a seeker who has actually booked them.
create table if not exists public.mentor_contacts (
  id uuid primary key references public.mentor_profiles (id) on delete cascade,
  phone text not null default '',
  meeting_link text,
  updated_at timestamptz not null default now()
);

alter table public.mentor_contacts enable row level security;

create policy "Mentors manage their own contact details"
  on public.mentor_contacts for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can read contact details"
  on public.mentor_contacts for select
  using (
    exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "Seekers can read contact details of a mentor they booked"
  on public.mentor_contacts for select
  using (
    exists (
      select 1 from public.bookings b
      where b.mentor_id = mentor_contacts.id
        and b.seeker_id = auth.uid()
        and b.status = 'confirmed'
    )
  );

-- Carry across anything already stored before dropping the exposed column.
insert into public.mentor_contacts (id, meeting_link)
select id, meeting_link
from public.mentor_profiles
where meeting_link is not null
on conflict (id) do nothing;

alter table public.mentor_profiles drop column if exists meeting_link;

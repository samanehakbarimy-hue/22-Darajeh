-- The phone number is collected for the platform's own records, not to hand to
-- whoever books a session. It was readable by any seeker with a confirmed
-- booking, which is wrong: only the mentor and an admin should ever see it.
--
-- The meeting link is different — it has to reach whoever booked, or the
-- booking is useless — so it moves to its own table with its own audience.
create table if not exists public.mentor_meeting_links (
  id uuid primary key references public.mentor_profiles (id) on delete cascade,
  meeting_link text,
  updated_at timestamptz not null default now()
);

alter table public.mentor_meeting_links enable row level security;

create policy "Mentors manage their own meeting link"
  on public.mentor_meeting_links for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can read meeting links"
  on public.mentor_meeting_links for select
  using (
    exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'admin'
    )
  );

create policy "Seekers can read the meeting link of a mentor they booked"
  on public.mentor_meeting_links for select
  using (
    exists (
      select 1 from public.bookings b
      where b.mentor_id = mentor_meeting_links.id
        and b.seeker_id = auth.uid()
        and b.status = 'confirmed'
    )
  );

-- Carry existing links across before the column goes.
insert into public.mentor_meeting_links (id, meeting_link)
select id, meeting_link
from public.mentor_contacts
where meeting_link is not null
on conflict (id) do nothing;

alter table public.mentor_contacts drop column if exists meeting_link;

-- mentor_contacts now holds only the phone, so seekers lose access entirely.
drop policy if exists
  "Seekers can read contact details of a mentor they booked"
  on public.mentor_contacts;

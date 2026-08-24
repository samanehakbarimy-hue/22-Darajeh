-- Project work was offered the way sessions are: pick from a list someone else
-- wrote. The list was بررسی فنی مدارک و طراحی, حل یک مسئله مشخص, همراهی در طول
-- اجرا — which reads as an oil and gas job description, because that is the
-- one specialist we had when it was written. An AI engineer would not describe
-- their work that way, and no central list ever will, because being shaped to
-- a particular job is what project work is.
--
-- So a specialist no longer publishes project offerings at all. They publish a
-- rate: so much per hour, or "قابل مذاکره". The work itself gets described by
-- the person who wants it done, and the specialist says yes or no.
alter table mentor_services
  add column if not exists is_negotiable boolean not null default false;

-- A rate is one thing, not a list of things.
drop index if exists mentor_services_one_project_rate;
create unique index mentor_services_one_project_rate
  on mentor_services (mentor_id)
  where kind = 'hourly_project';

-- Negotiable means the number is deliberately absent, not merely unset.
-- Holding both would leave the profile with two answers to the same question.
alter table mentor_services drop constraint if exists mentor_services_negotiable_has_no_price;
alter table mentor_services
  add constraint mentor_services_negotiable_has_no_price
  check (not (is_negotiable and price_toman is not null));

-- min_hours belonged to the template idea: each catalogue entry carried its own
-- floor. With one rate and a brief written by the person asking, a minimum is
-- something the specialist can raise when they reply, not something the profile
-- has to state up front. Optional now rather than required.
alter table mentor_services drop constraint if exists project_has_min_hours;

-- Titles were required on project rows because a template needed a name. A
-- rate does not have a name, and a session takes its title from the catalogue,
-- so nothing needs one now. Only the length is still worth bounding.
alter table mentor_services drop constraint if exists mentor_services_title_check;
alter table mentor_services
  add constraint mentor_services_title_check
  check (length(btrim(title)) <= 80);

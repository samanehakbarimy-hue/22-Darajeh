-- Adds the mentor's location (country), shown on their public profile.
alter table public.mentor_profiles
  add column country text not null default '';

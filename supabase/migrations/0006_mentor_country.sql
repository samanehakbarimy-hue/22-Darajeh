-- Adds the mentor's location (country), shown on their public profile.
alter table public.mentor_profiles
  add column if not exists country text not null default '';

-- How much experience a specialist has.
--
-- Two jobs: it tells a seeker who they are about to talk to, and it is half
-- of what the price suggestion is calculated from — the other half being the
-- length of the session.
--
-- Stored as a level rather than a number of years so it cannot go stale. A
-- profile saying "۸ سال تجربه" is wrong a year later and nobody goes back to
-- fix it; a level stays true until the person changes jobs.
alter table mentor_profiles
  add column if not exists seniority text;

alter table mentor_profiles
  drop constraint if exists mentor_profiles_seniority_check;

alter table mentor_profiles
  add constraint mentor_profiles_seniority_check
  check (
    seniority is null
    or seniority in ('junior', 'mid', 'senior', 'principal')
  );

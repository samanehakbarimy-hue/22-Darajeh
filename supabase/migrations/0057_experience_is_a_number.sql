-- Experience becomes a number of years, not one of three boxes.
--
-- A specialist picked «۷ تا ۱۴ سال تجربه» and that band was what a seeker saw.
-- It is the wrong shape twice over: somebody with nine years and somebody with
-- thirteen are not the same person, and a range on a public profile reads like
-- a category the site assigned rather than a fact the specialist stated.
--
-- So they state a year count, and the band is derived from it. The band stays
-- because the price table is built on it -- nine cells keyed by seniority, and
-- 'somewhere between 7 and 14' is the right granularity for deciding what a
-- session may cost even though it is the wrong granularity for a profile.

alter table public.mentor_profiles
  add column if not exists years_experience integer;

alter table public.mentor_profiles
  drop constraint if exists mentor_profiles_years_experience_range;
alter table public.mentor_profiles
  add constraint mentor_profiles_years_experience_range
    check (years_experience is null or years_experience between 3 and 30);

comment on column public.mentor_profiles.years_experience is
  'Years of professional experience, 3 to 30. The number a seeker sees. '
  'seniority is derived from it by the trigger below and exists only because '
  'the price bands are keyed by band, not by year.';

-- ---------------------------------------------------------------------------
-- Where the boundaries fall.
--
-- 3..6 mid, 7..14 senior, 15..30 principal. The old labels overlapped at both
-- ends -- «۳ تا ۷» and «۷ تا ۱۴» both claimed 7 -- and a number has to land
-- somewhere, so 7 is senior and 15 is the first principal year, which is what
-- «بیش از ۱۴» says.
--
-- Deliberately not left to the application: two places deciding which band a
-- number falls into is two places to disagree, and the one that decides what
-- somebody may charge had better be the one the database enforces.
-- ---------------------------------------------------------------------------
create or replace function public.seniority_for_years(years integer)
returns text
language sql
immutable
as $fn$
  select case
    when years is null then null
    when years < 7  then 'mid'
    when years < 15 then 'senior'
    else 'principal'
  end;
$fn$;

grant execute on function public.seniority_for_years(integer) to authenticated, anon;

create or replace function public.set_seniority_from_years()
returns trigger
language plpgsql
as $fn$
begin
  -- Only when a year count is on file. A profile written before this column
  -- existed keeps the band it chose, so nobody's price range moves under them
  -- and no profile starts claiming a number its owner never gave.
  if new.years_experience is not null then
    new.seniority := public.seniority_for_years(new.years_experience);
  end if;
  return new;
end;
$fn$;

drop trigger if exists mentor_profiles_seniority_from_years on public.mentor_profiles;
create trigger mentor_profiles_seniority_from_years
  before insert or update on public.mentor_profiles
  for each row execute function public.set_seniority_from_years();

-- No backfill, on purpose. Turning 'senior' into a year count means picking a
-- number between 7 and 14 on somebody's behalf and publishing it as their own
-- claim about themselves. Existing profiles keep showing their band until the
-- specialist enters a real figure.

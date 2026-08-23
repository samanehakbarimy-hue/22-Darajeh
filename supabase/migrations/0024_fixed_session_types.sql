-- Sessions get fixed lengths; only project work keeps its own.
--
-- A specialist used to name a session and choose its length, which made no two
-- profiles comparable: one person's "بررسی رزومه" was 30 minutes and the
-- next's was 90, so the prices beside them meant different things. A seeker
-- cannot judge that, and a specialist setting a price has nothing to judge it
-- against either.
--
-- Sessions are now chosen from a fixed set defined in lib/services.ts, and the
-- specialist sets only the price. The title, description and length live in
-- code, so improving the wording updates every profile at once instead of
-- leaving whatever each person typed.
--
-- Project work is the opposite case and stays free-form: the whole point is
-- that it is shaped to a particular job.
alter table mentor_services
  add column if not exists session_key text;

-- A session is identified by its key; project work is not.
alter table mentor_services drop constraint if exists session_has_key;
alter table mentor_services
  add constraint session_has_key check (
    (kind = 'consultation' and session_key is not null)
    or (kind = 'hourly_project' and session_key is null)
  );

-- Offering the same session twice would be two prices for one thing.
drop index if exists mentor_services_one_of_each_session;
create unique index mentor_services_one_of_each_session
  on mentor_services (mentor_id, session_key)
  where session_key is not null;

-- Length now comes from the catalogue, so the column no longer has to be set
-- for a session. The project constraint is untouched: hours are still theirs.
alter table mentor_services drop constraint if exists consultation_has_minutes;

-- Title and description are derived for sessions too, so they may be blank on
-- those rows. The original constraint demanded a non-empty title on every row.
alter table mentor_services drop constraint if exists mentor_services_title_check;
alter table mentor_services
  add constraint mentor_services_title_check check (
    kind = 'consultation' or length(btrim(title)) between 1 and 80
  );

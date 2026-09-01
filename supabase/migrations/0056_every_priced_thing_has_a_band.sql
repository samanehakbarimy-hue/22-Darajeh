-- The two services nobody set a range for.
--
-- 0053 created nine rows: three session types against three experience bands.
-- The catalogue in lib/services.ts has FOUR session types -- پرسش و پاسخ was
-- never given one -- and project work, priced by the hour, has no session key
-- at all and so was never even looked at.
--
-- Both were unenforced rather than merely unlisted. allowed_price_ceiling()
-- returns 0 when no row matches, and the trigger reads 0 as "no rule yet" and
-- lets the price through; project work took an earlier exit still, on
-- session_key being null. A specialist could put any figure on either.

-- ---------------------------------------------------------------------------
-- Project work gets a key of its own.
--
-- It has no session_key because it is not a session, so the band table needs
-- some name to file it under. A reserved key rather than a nullable column:
-- the primary key is (session_key, seniority) and nulls do not group.
-- ---------------------------------------------------------------------------
comment on column public.price_bands.session_key is
  'A session type from lib/services.ts, or the reserved key ''hourly_project'' '
  'for per-hour project work, which has no session type of its own.';

-- ---------------------------------------------------------------------------
-- Seeded from آمادگی مصاحبه, deliberately.
--
-- Both new rows are an hour of somebody's time, and آمادگی مصاحبه is the hour
-- this site already prices -- so its range is the honest starting point rather
-- than a number invented here. These are a floor to build on, not a decision:
-- the whole point of the table is that an admin changes them.
-- ---------------------------------------------------------------------------
insert into public.price_bands (session_key, seniority, min_usd, max_usd)
select k.key, b.seniority, b.min_usd, b.max_usd
  from public.price_bands b
  cross join (values ('open-qa'), ('hourly_project')) as k(key)
 where b.session_key = 'interview-prep'
on conflict (session_key, seniority) do nothing;

-- ---------------------------------------------------------------------------
-- The rule, now covering everything that carries a price.
--
-- The only change is which row of price_bands to look in. Project work is
-- filed under a reserved key; everything else is filed under its session type.
-- A price with neither is not a priced thing and still passes untouched.
-- ---------------------------------------------------------------------------
create or replace function public.band_key(skey text, service_kind text)
returns text
language sql
immutable
as $fn$
  select coalesce(skey, case when service_kind = 'hourly_project'
                            then 'hourly_project' end);
$fn$;

grant execute on function public.band_key(text, text) to authenticated, anon;

create or replace function public.enforce_price_band()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  floor_usd numeric;
  ceil_usd  numeric;
  key       text;
begin
  -- Only when the price itself is being set or changed. The daily job writes
  -- price_toman and nothing else, so it never arrives here.
  if tg_op = 'UPDATE' and new.price_usd is not distinct from old.price_usd then
    return new;
  end if;

  if new.price_usd is null or new.price_usd = 0 then
    return new;
  end if;

  -- Negotiable project work is a deliberate absence of a number, and the
  -- table refuses to hold a price beside it anyway.
  if new.is_negotiable then
    return new;
  end if;

  key := public.band_key(new.session_key, new.kind);
  if key is null then
    return new;
  end if;

  -- An admin setting somebody's price is the decision itself, not a request.
  if public.is_admin() then
    return new;
  end if;

  floor_usd := public.allowed_price_floor(new.mentor_id, key);
  ceil_usd  := public.allowed_price_ceiling(new.mentor_id, key);

  -- No band on file means nothing to enforce yet.
  if ceil_usd = 0 then
    return new;
  end if;

  if new.price_usd > ceil_usd then
    raise exception 'PRICE_ABOVE_BAND:%', ceil_usd;
  end if;
  if new.price_usd < floor_usd then
    raise exception 'PRICE_BELOW_BAND:%', floor_usd;
  end if;

  return new;
end;
$fn$;

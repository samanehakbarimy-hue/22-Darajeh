-- The price is a dollar figure. The toman number is what we show for it.
--
-- Until now the toman amount was the price: a specialist typed 875,000 and
-- that integer was the truth. Iran's open-market rate moves weekly and often
-- daily, so the same number meant $4.20 one month and $3.60 the next, and
-- nobody decided that -- it just drifted.
--
-- So: price_usd is the price. price_toman becomes a cached rendering of it,
-- recomputed once a day by a job and rounded hard, to the nearest 50,000, so
-- the number a seeker sees does not twitch every time the market does.

alter table public.mentor_services
  add column if not exists price_usd numeric(10, 2);

comment on column public.mentor_services.price_usd is
  'The price. What a specialist is actually charging, in dollars.';

comment on column public.mentor_services.price_toman is
  'Not the price -- the current rendering of price_usd, rounded to the nearest '
  '50,000, refreshed daily by the pricing job. Written only when the rounded '
  'figure actually changes, so a rate that wobbles inside one rounding step '
  'leaves every displayed number alone.';

-- The rate lives here now rather than being fetched during a page render.
-- Once a day, by the job, and every page reads what the job left.
alter table public.price_settings
  add column if not exists usd_rate bigint check (usd_rate > 0),
  add column if not exists rate_fetched_at timestamptz,
  add column if not exists prices_refreshed_at timestamptz;

comment on column public.price_settings.usd_rate is
  'Toman per dollar, as last fetched from tgju.org. Null means it has never '
  'been fetched, and callers show toman alone rather than inventing a dollar '
  'figure from a guess.';

-- Seeded with the rate on the day this ran, so the backfill below has
-- something to divide by. The job overwrites it daily from here on.
update public.price_settings
   set usd_rate = coalesce(usd_rate, 206010),
       rate_fetched_at = coalesce(rate_fetched_at, now())
 where id;

-- ---------------------------------------------------------------------------
-- Rounding, in one place, so the job and anything checking its work agree.
--
-- 50,000 toman is roughly a quarter of a dollar at today's rate. Small enough
-- that nobody feels short-changed by it, large enough that a percent or two of
-- market movement lands inside the same step and writes nothing.
-- ---------------------------------------------------------------------------
create or replace function public.display_toman(usd numeric, rate bigint)
returns bigint
language sql
immutable
as $$
  select case
    when usd is null or rate is null or rate <= 0 then null
    else greatest(50000, round(usd * rate / 50000.0) * 50000)::bigint
  end;
$$;

grant execute on function public.display_toman(numeric, bigint) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- The job.
--
-- Recomputes every price from its dollar figure and writes back only the rows
-- whose rounded toman actually moved. Returns how many changed, so the route
-- calling it can say something truthful in a log rather than "done".
-- ---------------------------------------------------------------------------
create or replace function public.refresh_prices(new_rate bigint)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  changed integer;
begin
  if new_rate is null or new_rate <= 0 then
    raise exception 'A rate is needed to price anything';
  end if;

  update public.price_settings
     set usd_rate = new_rate,
         rate_fetched_at = now(),
         prices_refreshed_at = now()
   where id;

  -- IS DISTINCT FROM rather than <>: a row whose toman is still null has to
  -- be written too, and null <> anything is null, which updates nothing.
  with touched as (
    update public.mentor_services s
       set price_toman = public.display_toman(s.price_usd, new_rate)
     where s.price_usd is not null
       and s.price_toman is distinct from public.display_toman(s.price_usd, new_rate)
    returning 1
  )
  select count(*)::integer into changed from touched;

  return changed;
end;
$$;

revoke all on function public.refresh_prices(bigint) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The band now watches the dollar figure, not the toman one.
--
-- It has to. price_toman is no longer a choice anybody makes -- the job
-- rewrites it whenever the market moves, and a rate change pushing a
-- legitimate $4 session across a band boundary would have the job refusing to
-- run. The band is a rule about what a specialist may charge, and what they
-- charge is the dollar figure.
--
-- Comparison still happens in toman, because that is the currency the bands
-- are written in and the one an admin thinks in.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_price_band()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  floor_toman bigint;
  ceil_toman  bigint;
  rate        bigint;
  asking      bigint;
begin
  -- Only when the price itself is being set or changed. The daily job writes
  -- price_toman and nothing else, so it never arrives here.
  if tg_op = 'UPDATE' and new.price_usd is not distinct from old.price_usd then
    return new;
  end if;

  if new.price_usd is null or new.price_usd = 0 or new.session_key is null then
    return new;
  end if;

  -- An admin setting somebody's price is the decision itself, not a request.
  if public.is_admin() then
    return new;
  end if;

  select usd_rate into rate from public.price_settings where id;
  asking := public.display_toman(new.price_usd, rate);
  if asking is null then
    return new;
  end if;

  floor_toman := public.allowed_price_floor(new.mentor_id, new.session_key);
  ceil_toman  := public.allowed_price_ceiling(new.mentor_id, new.session_key);

  if ceil_toman = 0 then
    return new;
  end if;

  if asking > ceil_toman then
    raise exception 'PRICE_ABOVE_BAND:%', ceil_toman;
  end if;
  if asking < floor_toman then
    raise exception 'PRICE_BELOW_BAND:%', floor_toman;
  end if;

  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- Backfill: every price that exists today keeps the toman figure it has, and
-- gets the dollar figure that produced it.
--
-- Deriving dollars from toman rather than the other way round, this once,
-- because the toman number is what a specialist actually chose and what a
-- seeker has already seen. Re-rounding it now would move real prices to tidy
-- up bookkeeping, which is the wrong way round.
-- ---------------------------------------------------------------------------
-- The trigger is off for this one statement. It exists to judge a price a
-- specialist is choosing; this is neither a choice nor new, it is the same
-- price that is already published, written down in the currency it will be
-- kept in from now on. Reza's resume review is above its band today, and
-- keeping it is the point -- the band applies the next time he sets it.
alter table public.mentor_services disable trigger mentor_services_price_band;

update public.mentor_services s
   set price_usd = round(s.price_toman::numeric / nullif((select usd_rate from public.price_settings where id), 0), 2)
 where s.price_usd is null
   and s.price_toman is not null
   and s.price_toman > 0
   and (select usd_rate from public.price_settings where id) is not null;

alter table public.mentor_services enable trigger mentor_services_price_band;

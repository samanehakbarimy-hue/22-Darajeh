-- The price range an admin sets is a dollar range.
--
-- 0054 made price_usd the price and left price_toman as a daily rendering of
-- it. The band it is judged against stayed in toman, which put the rule and
-- the thing it judges in different currencies: every time the market moved,
-- the same $4 session drifted toward one edge of its band without anybody
-- deciding anything, and an admin would have had to re-type nine numbers to
-- undo a move they did not make.
--
-- So the band moves to dollars too. An admin sets what a session is worth;
-- the toman figure shown beside it is arithmetic, done at the rate of the day.

alter table public.price_bands
  add column if not exists min_usd numeric(10, 2),
  add column if not exists max_usd numeric(10, 2);

-- Faithfully, to the cent. These nine numbers are the ranges already in force,
-- and re-rounding them here would quietly narrow or widen what specialists are
-- allowed to charge -- a decision for the admin page, not for a migration.
update public.price_bands b
   set min_usd = round(b.min_toman::numeric / r.rate, 2),
       max_usd = round(b.max_toman::numeric / r.rate, 2)
  from (select usd_rate::numeric as rate from public.price_settings where id) r
 where b.min_usd is null and r.rate > 0;

alter table public.price_bands
  alter column min_usd set not null,
  alter column max_usd set not null;

alter table public.price_bands
  drop constraint if exists price_bands_min_below_max;
alter table public.price_bands
  add constraint price_bands_min_below_max check (min_usd <= max_usd),
  add constraint price_bands_min_not_negative check (min_usd >= 0);

-- The toman columns go rather than linger. Two numbers for one range is how
-- they end up disagreeing, and the stale one always wins an argument with
-- whoever reads it first.
alter table public.price_bands
  drop column if exists min_toman,
  drop column if exists max_toman;

comment on table public.price_bands is
  'What the house will publish without being asked, in US dollars. One row per '
  'session type per experience band. The toman figure a specialist sees is '
  'this range converted at the rate of the day -- it is never stored, because '
  'a stored one would be wrong by the following week.';

-- ---------------------------------------------------------------------------
-- The same, for an allowance granted to one person.
-- ---------------------------------------------------------------------------
alter table public.price_requests
  add column if not exists asked_usd   numeric(10, 2),
  add column if not exists granted_usd numeric(10, 2);

update public.price_requests r
   set asked_usd = round(r.asked_toman::numeric / s.rate, 2),
       granted_usd = round(r.granted_toman::numeric / s.rate, 2)
  from (select usd_rate::numeric as rate from public.price_settings where id) s
 where r.asked_usd is null and s.rate > 0;

-- The insert policy names granted_toman, so the column cannot go while the
-- policy still stands. Dropped here and rewritten below against the new one.
drop policy if exists "a specialist asks about their own price" on public.price_requests;

alter table public.price_requests
  drop column if exists asked_toman,
  drop column if exists granted_toman;

alter table public.price_requests
  alter column asked_usd set not null,
  add constraint price_requests_asked_positive check (asked_usd > 0),
  add constraint price_requests_granted_positive
    check (granted_usd is null or granted_usd > 0);

comment on column public.price_requests.granted_usd is
  'The price the admin allowed, in dollars. Not necessarily the one asked for '
  '-- an admin meeting somebody halfway is a better answer than a flat no.';

create policy "a specialist asks about their own price"
  on public.price_requests for insert to authenticated
  with check (
    mentor_id = auth.uid()
    and not public.is_suspended()
    and status = 'pending'
    and granted_usd is null
  );

-- ---------------------------------------------------------------------------
-- What a specialist is allowed to charge, in the currency they are judged in.
--
-- Dropped rather than replaced: the return type changes from bigint to
-- numeric, and CREATE OR REPLACE cannot do that.
-- ---------------------------------------------------------------------------
drop function if exists public.allowed_price_ceiling(uuid, text);
drop function if exists public.allowed_price_floor(uuid, text);

create function public.allowed_price_ceiling(mentor uuid, skey text)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select greatest(
    coalesce((select b.max_usd from public.price_bands b
               join public.mentor_profiles m on m.id = mentor
              where b.session_key = skey and b.seniority = m.seniority), 0),
    coalesce((select max(r.granted_usd) from public.price_requests r
              where r.mentor_id = mentor and r.session_key = skey
                and r.status = 'approved'), 0)
  );
$fn$;

create function public.allowed_price_floor(mentor uuid, skey text)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select coalesce((select b.min_usd from public.price_bands b
                    join public.mentor_profiles m on m.id = mentor
                   where b.session_key = skey and b.seniority = m.seniority), 0);
$fn$;

grant execute on function public.allowed_price_ceiling(uuid, text) to authenticated, anon;
grant execute on function public.allowed_price_floor(uuid, text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- The rule, now comparing dollars with dollars.
--
-- 0054 had to convert the price to toman before it could be judged, and so
-- carried the exchange rate into a check that has nothing to do with the
-- exchange rate. It does not any more: a rate left unfetched no longer changes
-- anybody's answer here.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_price_band()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  floor_usd numeric;
  ceil_usd  numeric;
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

  floor_usd := public.allowed_price_floor(new.mentor_id, new.session_key);
  ceil_usd  := public.allowed_price_ceiling(new.mentor_id, new.session_key);

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

-- ---------------------------------------------------------------------------
-- The admin's side, in dollars.
-- ---------------------------------------------------------------------------
drop function if exists public.admin_set_price_band(text, text, bigint, bigint);

create function public.admin_set_price_band(
  skey text, level text, lo numeric, hi numeric
) returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set the price bands';
  end if;
  if lo is null or hi is null then
    raise exception 'A band needs both a lowest and a highest price';
  end if;
  if lo > hi then
    raise exception 'The lowest price cannot be above the highest';
  end if;
  -- The ceiling nobody passes, from price_settings. A band reaching above it
  -- would be a rule the site contradicts the moment somebody used it.
  if hi > (select max_usd from public.price_settings where id) then
    raise exception 'A band cannot go above the site maximum of % dollars',
      (select max_usd from public.price_settings where id);
  end if;

  insert into public.price_bands (session_key, seniority, min_usd, max_usd, updated_at)
  values (skey, level, lo, hi, now())
  on conflict (session_key, seniority)
    do update set min_usd = excluded.min_usd,
                  max_usd = excluded.max_usd,
                  updated_at = now();
end;
$fn$;

drop function if exists public.admin_decide_price_request(uuid, text, bigint, text);

create function public.admin_decide_price_request(
  request uuid, decision text, grant_usd numeric, note text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can answer a price request';
  end if;
  if decision not in ('approved', 'declined') then
    raise exception 'A request is either approved or declined';
  end if;
  if decision = 'approved' and (grant_usd is null or grant_usd <= 0) then
    raise exception 'An approval has to say what price is allowed';
  end if;
  if decision = 'approved'
     and grant_usd > (select max_usd from public.price_settings where id) then
    raise exception 'Not even an exception goes above the site maximum';
  end if;

  update public.price_requests
     set status = decision,
         granted_usd = case when decision = 'approved' then grant_usd else null end,
         admin_note = note,
         decided_at = now()
   where id = request and status = 'pending';
end;
$fn$;

revoke all on function public.admin_set_price_band(text, text, numeric, numeric) from public, anon;
revoke all on function public.admin_decide_price_request(uuid, text, numeric, text) from public, anon;
grant execute on function public.admin_set_price_band(text, text, numeric, numeric) to authenticated;
grant execute on function public.admin_decide_price_request(uuid, text, numeric, text) to authenticated;

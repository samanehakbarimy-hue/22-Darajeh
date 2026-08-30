-- What a session may cost, decided by the house rather than by a formula.
--
-- Until now the range was computed in lib/seniority.ts: a base dollar rate,
-- multiplied by a seniority factor and the length of the session, widened
-- 0.7x to 1.5x. It was a suggestion and nothing enforced it, so a specialist
-- could type any number at all and the site would publish it.
--
-- Two things change. The numbers move out of the code and into a table an
-- admin edits, one row per session type per experience band -- nine rows, the
-- three services against the three bands. And the range becomes a rule: a
-- price outside it does not get published, though it can be asked for.

create table if not exists public.price_bands (
  session_key text not null,
  seniority   text not null check (seniority in ('mid', 'senior', 'principal')),
  min_toman   bigint not null check (min_toman >= 0),
  max_toman   bigint not null,
  updated_at  timestamptz not null default now(),
  primary key (session_key, seniority),
  constraint price_bands_min_below_max check (min_toman <= max_toman)
);

comment on table public.price_bands is
  'What the house will publish without being asked. One row per session type '
  'per experience band. Editable by an admin only; readable by everyone, '
  'because a specialist has to be able to see the range they are being held '
  'to before they type a number into it.';

alter table public.price_bands enable row level security;

drop policy if exists "Anyone can read the price bands" on public.price_bands;
create policy "Anyone can read the price bands"
  on public.price_bands for select using (true);

-- No write policy at all: the only way in is the admin function below.

-- The starting nine, from what the old formula produced at today's rate for a
-- 30, 45 and 60 minute session. They are a starting point and nothing more --
-- the point of the table is that an admin changes them.
insert into public.price_bands (session_key, seniority, min_toman, max_toman) values
  ('resume-review',  'mid',        250000,   550000),
  ('resume-review',  'senior',     420000,   900000),
  ('resume-review',  'principal',  650000,  1400000),
  ('career-path',    'mid',        350000,   800000),
  ('career-path',    'senior',     600000,  1300000),
  ('career-path',    'principal',  950000,  2000000),
  ('interview-prep', 'mid',        500000,  1100000),
  ('interview-prep', 'senior',     850000,  1800000),
  ('interview-prep', 'principal', 1300000,  2800000)
on conflict (session_key, seniority) do nothing;

-- ---------------------------------------------------------------------------
-- The ceiling nobody passes.
--
-- Kept in dollars on purpose. The band above is in toman and an admin will
-- want to move it as the rate moves; this is the line that does not move,
-- because it is about what the session is worth to a seeker abroad rather
-- than about the currency. Converted at the moment a price is saved.
-- ---------------------------------------------------------------------------
create table if not exists public.price_settings (
  id           boolean primary key default true check (id),
  max_usd      numeric not null default 60 check (max_usd > 0),
  updated_at   timestamptz not null default now()
);

insert into public.price_settings (id) values (true) on conflict (id) do nothing;

alter table public.price_settings enable row level security;

drop policy if exists "Anyone can read the price settings" on public.price_settings;
create policy "Anyone can read the price settings"
  on public.price_settings for select using (true);

-- ---------------------------------------------------------------------------
-- Asking for a price the band does not allow.
--
-- A specialist who thinks their work is worth more than the table says should
-- have somewhere to say so. Without this the rule is simply a wall, and the
-- only people it stops are the honest ones who tried to use the form.
-- ---------------------------------------------------------------------------
create table if not exists public.price_requests (
  id           uuid primary key default gen_random_uuid(),
  mentor_id    uuid not null references public.profiles(id) on delete cascade,
  session_key  text not null,
  asked_toman  bigint not null check (asked_toman > 0),
  reason       text,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'declined')),
  -- What the admin actually allowed, which need not be what was asked for.
  granted_toman bigint check (granted_toman > 0),
  admin_note   text,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);

comment on column public.price_requests.granted_toman is
  'The price the admin allowed. Not necessarily the one asked for -- an admin '
  'meeting somebody halfway is a better answer than a flat no.';

create unique index if not exists price_requests_one_open_per_service
  on public.price_requests (mentor_id, session_key)
  where status = 'pending';

alter table public.price_requests enable row level security;

drop policy if exists "a specialist asks about their own price" on public.price_requests;
create policy "a specialist asks about their own price"
  on public.price_requests for insert to authenticated
  with check (
    mentor_id = auth.uid()
    and not public.is_suspended()
    and status = 'pending'
    and granted_toman is null
  );

drop policy if exists "a specialist reads their own asks" on public.price_requests;
create policy "a specialist reads their own asks"
  on public.price_requests for select to authenticated
  using (mentor_id = auth.uid() or public.is_admin());

-- Deciding is the admin's, through the function below, so there is no update
-- policy here either.

-- ---------------------------------------------------------------------------
-- An allowance, once granted, is what the band check consults.
-- ---------------------------------------------------------------------------
create or replace function public.allowed_price_ceiling(mentor uuid, skey text)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $$
  select greatest(
    coalesce((select b.max_toman from public.price_bands b
               join public.mentor_profiles m on m.id = mentor
              where b.session_key = skey and b.seniority = m.seniority), 0),
    coalesce((select max(r.granted_toman) from public.price_requests r
              where r.mentor_id = mentor and r.session_key = skey
                and r.status = 'approved'), 0)
  );
$$;

create or replace function public.allowed_price_floor(mentor uuid, skey text)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((select b.min_toman from public.price_bands b
                    join public.mentor_profiles m on m.id = mentor
                   where b.session_key = skey and b.seniority = m.seniority), 0);
$$;

grant execute on function public.allowed_price_ceiling(uuid, text) to authenticated, anon;
grant execute on function public.allowed_price_floor(uuid, text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- The rule itself.
--
-- A trigger rather than a policy: this has to compare the new price against a
-- band that depends on the specialist's seniority and on any allowance they
-- have been granted, and say which of the two it broke. A policy can only
-- refuse.
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
begin
  -- A free session and a price not yet set are both fine. Project work has no
  -- session_key -- it is priced per hour against a different conversation --
  -- so keying off that rather than off kind covers it without naming a value
  -- this file would then have to keep in step with lib/services.ts.
  if new.price_toman is null or new.price_toman = 0
     or new.session_key is null then
    return new;
  end if;

  -- An admin setting somebody's price is the decision itself, not a request.
  if public.is_admin() then
    return new;
  end if;

  floor_toman := public.allowed_price_floor(new.mentor_id, new.session_key);
  ceil_toman  := public.allowed_price_ceiling(new.mentor_id, new.session_key);

  -- No band on file means nothing to enforce yet.
  if ceil_toman = 0 then
    return new;
  end if;

  if new.price_toman > ceil_toman then
    raise exception 'PRICE_ABOVE_BAND:%', ceil_toman;
  end if;

  if new.price_toman < floor_toman then
    raise exception 'PRICE_BELOW_BAND:%', floor_toman;
  end if;

  return new;
end;
$$;

drop trigger if exists mentor_services_price_band on public.mentor_services;
create trigger mentor_services_price_band
  before insert or update on public.mentor_services
  for each row execute function public.enforce_price_band();

-- ---------------------------------------------------------------------------
-- The admin's side: set the bands, and answer the asks.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_price_band(
  skey text, level text, lo bigint, hi bigint
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set the price bands';
  end if;
  if lo > hi then
    raise exception 'The lowest price cannot be above the highest';
  end if;

  insert into public.price_bands (session_key, seniority, min_toman, max_toman, updated_at)
  values (skey, level, lo, hi, now())
  on conflict (session_key, seniority)
    do update set min_toman = excluded.min_toman,
                  max_toman = excluded.max_toman,
                  updated_at = now();
end;
$$;

create or replace function public.admin_decide_price_request(
  request uuid, decision text, grant_toman bigint, note text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can answer a price request';
  end if;
  if decision not in ('approved', 'declined') then
    raise exception 'A request is either approved or declined';
  end if;
  if decision = 'approved' and (grant_toman is null or grant_toman <= 0) then
    raise exception 'An approval has to say what price is allowed';
  end if;

  update public.price_requests
     set status = decision,
         granted_toman = case when decision = 'approved' then grant_toman else null end,
         admin_note = note,
         decided_at = now()
   where id = request and status = 'pending';
end;
$$;

revoke all on function public.admin_set_price_band(text, text, bigint, bigint) from public, anon;
revoke all on function public.admin_decide_price_request(uuid, text, bigint, text) from public, anon;
grant execute on function public.admin_set_price_band(text, text, bigint, bigint) to authenticated;
grant execute on function public.admin_decide_price_request(uuid, text, bigint, text) to authenticated;

-- A login that can do exactly the one thing the pricing job needs.
--
-- /api/cron/prices already proves its own identity with CRON_SECRET, but the
-- Supabase client it calls through resolves to Postgres role `anon`, and
-- refresh_prices() is `revoke all ... from public, anon, authenticated`
-- (migration 0054) on purpose -- a specialist must never be able to invent an
-- exchange rate for their own price. The job inherited that same wall. It has
-- been failing silently every single morning: `set local role anon; select
-- refresh_prices(...)` returns "permission denied for function
-- refresh_prices", and every toman price on the site has been sitting at
-- whatever the rate last was on 2026-08-30.
--
-- Not fixed by granting EXECUTE to anon or authenticated -- either one hands
-- every visitor or every specialist a way to set the site's exchange rate.
-- Not fixed with a service-role key either: that key bypasses every RLS
-- policy on every table, which is a wall this project has deliberately never
-- built a door in.
--
-- So: a role of its own, with no login yet -- see below -- and exactly one
-- privilege. It cannot read a single table. Whatever it does, it does by
-- calling refresh_prices(), which runs as its owner (postgres) regardless of
-- who called it, which is what SECURITY DEFINER has always meant here.
do $$
begin
  if not exists (select from pg_roles where rolname = 'pricing_cron') then
    create role pricing_cron with nologin;
  end if;
end
$$;

comment on role pricing_cron is
  'The daily pricing job, and nothing else. Can call refresh_prices() and '
  'nothing else -- no table grants, no other function. Login is enabled '
  'separately, outside version control, because a password does not belong '
  'in a file that git remembers forever.';

grant execute on function public.refresh_prices(bigint) to pricing_cron;

-- Login and a password are set once, directly against the database, by
-- whoever runs this migration -- never checked in, never printed to a log.
-- Until that happens this role exists but cannot connect, which is a safe
-- default to land in.

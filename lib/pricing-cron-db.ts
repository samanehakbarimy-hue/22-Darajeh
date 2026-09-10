// Server-side only, and only for one route: app/api/cron/prices/route.ts.

/**
 * The one deliberate exception to "every cross-user read goes through a
 * Supabase client and a SECURITY DEFINER function."
 *
 * refresh_prices() is `revoke all ... from public, anon, authenticated`
 * (migration 0054) on purpose — a specialist must never be able to invent an
 * exchange rate for their own price. The ordinary Supabase client resolves to
 * Postgres role `anon` no matter who is asking, so the daily pricing job hit
 * that same wall and failed silently every morning: proof and fix are in
 * migration 0059 and its own comment.
 *
 * The fix is not a service-role key — this project deliberately has none,
 * because that key bypasses every RLS policy on every table. It is a
 * connection as `pricing_cron`, a role that holds exactly one grant: EXECUTE
 * on refresh_prices(bigint). It cannot read a single table — SELECT 1 FROM
 * any table it tried refuses with "permission denied", proven live before
 * this was wired in. Whatever refresh_prices() does, it does as its owner
 * (postgres), which is what SECURITY DEFINER has always meant here; the role
 * calling it stays powerless to do anything else.
 *
 * A direct Postgres connection because that privilege has no way to reach the
 * database through PostgREST — the anon/authenticated/service_role split is
 * the only routing Supabase's REST layer understands, and minting a JWT that
 * claims a fourth role would need the project's JWT signing secret, which is
 * exactly the kind of broad credential this avoids.
 */
export async function refreshPricesAsPricingCron(rate: number): Promise<number> {
  const connectionString = process.env.PRICING_CRON_DATABASE_URL;
  if (!connectionString) {
    throw new Error("PRICING_CRON_DATABASE_URL is not set");
  }

  // Lazy import: this is the only file in the app that touches `pg`, and
  // pulling the driver into every route's bundle for one cron job would be a
  // strange trade for a call that runs once a day.
  const { Client } = await import("pg");

  const client = new Client({
    connectionString,
    // Supabase's pooler presents a certificate this driver cannot chain to a
    // known root; scripts/db.js accepts the same trade-off for the same
    // reason. The connection itself is still encrypted — this only skips
    // verifying who signed the certificate.
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ changed: number }>(
      "select refresh_prices($1) as changed",
      [rate],
    );
    return rows[0]?.changed ?? 0;
  } finally {
    await client.end().catch(() => {});
  }
}

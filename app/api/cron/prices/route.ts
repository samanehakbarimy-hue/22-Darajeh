import { NextResponse, type NextRequest } from "next/server";
import { fetchUsdToToman } from "@/lib/exchange-rate";
import { refreshPricesAsPricingCron } from "@/lib/pricing-cron-db";

// pg needs real sockets; the edge runtime does not have them.
export const runtime = "nodejs";

/**
 * The daily pricing job.
 *
 * Fetches the open-market dollar once, then asks the database to re-render
 * every price from its dollar figure. refresh_prices() writes back only the
 * rows whose toman actually moved after rounding to the nearest 50,000, so an
 * ordinary day's market wobble costs one HTTP request and zero writes.
 *
 * A GET because that is what Vercel Cron sends. It is guarded by CRON_SECRET,
 * which Vercel passes as a bearer token — without that anybody who found the
 * URL could make the site re-price itself on demand, which is not catastrophic
 * but is nobody's business but ours.
 *
 * The write itself goes through a second, narrower credential — see
 * lib/pricing-cron-db.ts. This route's own secret only proves Vercel Cron is
 * the one asking; it says nothing about whether the request that follows is
 * allowed to touch a price, which is a separate question and was, until
 * migration 0059, one this route could not actually answer. It found out the
 * hard way: refresh_prices() has refused the ordinary Supabase client (which
 * resolves to Postgres role `anon` no matter who signed the request) since
 * the day it was written, and every run of this route failed silently.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const offered = request.headers.get("authorization");

  // No secret configured is a misconfiguration, not an invitation.
  if (!secret || offered !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "not yours" }, { status: 401 });
  }

  const rate = await fetchUsdToToman();
  if (rate === null) {
    // Yesterday's prices are right enough. Failing loudly and changing
    // nothing beats writing prices from a rate we could not establish.
    return NextResponse.json(
      { ok: false, reason: "rate unavailable, prices left alone" },
      { status: 503 },
    );
  }

  try {
    const pricesChanged = await refreshPricesAsPricingCron(rate);
    return NextResponse.json({ ok: true, rate, pricesChanged });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}

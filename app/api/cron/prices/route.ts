import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUsdToToman } from "@/lib/exchange-rate";

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

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("refresh_prices", {
    new_rate: rate,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rate, pricesChanged: data ?? 0 });
}

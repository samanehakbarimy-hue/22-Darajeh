// Server-side only: it reaches out over the network and relies on the Next
// data cache. The `server-only` package would enforce that, but it is not a
// dependency here and adding one for a comment is not worth it.

/**
 * The live USD → Toman rate.
 *
 * Iran's free-market rate moves weekly and often daily, so it cannot live in a
 * source file. This fetches it and lets Next's data cache hold it for six
 * hours, which means one request per six hours per deployment rather than one
 * per page view, and no cron job, no table and no service-role key.
 *
 * ── Why this source ───────────────────────────────────────────────────────
 * It must be an Iranian one. International FX APIs report Iran's OFFICIAL
 * rate: on the day this was written open.er-api.com said 1,468,703 rial to the
 * dollar while the open market was 1,997,000 — a 26% error, in the direction
 * that would have made every service on the site look cheap.
 *
 * tgju.org publishes the open-market rate its own site runs on. If it ever
 * needs replacing, Bonbast sells a licensed API; note their terms forbid use
 * in a competing product, which this is not, but it is worth re-reading before
 * relying on it commercially.
 */

const TGJU_FEED = "https://call1.tgju.org/ajax.json";

/** The open-market dollar, quoted in rial. */
const FREE_MARKET_DOLLAR_KEY = "price_dollar_rl";

/**
 * A parse error or a changed feed should read as "no rate", not as a wildly
 * wrong one. These bounds are deliberately wide — they are there to catch a
 * zero, a missing decimal or a switch to a different unit, not to second-guess
 * the market.
 */
const MIN_TOMAN = 20_000;
const MAX_TOMAN = 10_000_000;

type Feed = {
  current?: Record<string, { p?: string | number } | undefined>;
};

/**
 * Returns Toman per US dollar, or null if the rate could not be established.
 *
 * Null is a real answer: callers show Toman alone rather than a made-up
 * dollar figure, so a bad fetch costs a line of display, not a wrong price.
 */
export async function getUsdToToman(): Promise<number | null> {
  try {
    const response = await fetch(TGJU_FEED, {
      // Six hours: the rate moves daily at most, and a stale figure of a few
      // hours is far cheaper than hammering someone else's endpoint.
      next: { revalidate: 21_600 },
      headers: { "user-agent": "jobamooz.com" },
    });
    if (!response.ok) return null;

    const feed = (await response.json()) as Feed;
    const raw = feed.current?.[FREE_MARKET_DOLLAR_KEY]?.p;
    if (raw === undefined) return null;

    // The feed formats numbers for humans: "1,997,000".
    const rial = Number(String(raw).replace(/,/g, ""));
    if (!Number.isFinite(rial) || rial <= 0) return null;

    // Iranians price in Toman; the feed quotes rial. Ten rial to the Toman.
    const toman = rial / 10;
    if (toman < MIN_TOMAN || toman > MAX_TOMAN) return null;

    return Math.round(toman);
  } catch {
    // Network failure, timeout, a blocked region, malformed JSON — all mean
    // the same thing to a caller, and none of them should break a page.
    return null;
  }
}

/**
 * Money reference. The one file to edit when rates move.
 *
 * Everything the product suggests about price is derived from the two numbers
 * below, so nothing else in the codebase contains an amount. In an economy
 * where the rial moves faster than a release cycle, any figure written into a
 * component is wrong within months and nobody remembers where it was.
 *
 * ── Updating ──────────────────────────────────────────────────────────────
 * USD_TO_TOMAN is the one that goes stale. Change it, and every suggested
 * band across the site moves with it — no other file needs touching.
 * Update RATE_CHECKED at the same time so the next person can see how old the
 * number is.
 */

/**
 * The market rate, Toman per US dollar.
 *
 * Deliberately null: I have no reliable source for it, and a wrong exchange
 * rate is worse than none — it would quietly misprice every service on the
 * site while looking authoritative. Set it and the dollar figures appear.
 */
export const USD_TO_TOMAN: number | null = null;

/** When USD_TO_TOMAN was last checked against reality. ISO date. */
export const RATE_CHECKED = "not set";

/**
 * What one hour of a mid-level specialist's time is worth, in Toman.
 *
 * Seniority and duration scale this — see lib/seniority.ts. Set by the
 * founder, who knows the market; it is not derived from anything.
 *
 * Once USD_TO_TOMAN is set, consider moving the anchor here to dollars: a
 * dollar figure holds its meaning across a devaluation, so only the exchange
 * rate would ever need editing.
 */
export const BASE_HOURLY_TOMAN: number | null = 1_000_000;

/** Toman converted to dollars, or null while there is no rate to use. */
export function tomanToUsd(toman: number): number | null {
  if (USD_TO_TOMAN === null || USD_TO_TOMAN <= 0) return null;
  return toman / USD_TO_TOMAN;
}

function faToman(toman: number): string {
  return `${Math.round(toman).toLocaleString("fa-IR")} تومان`;
}

function faUsd(usd: number): string {
  // Whole dollars below ten look falsely precise at one decimal; above it,
  // decimals are noise.
  const rounded = usd < 10 ? Math.round(usd * 2) / 2 : Math.round(usd);
  return `${rounded.toLocaleString("fa-IR")} دلار`;
}

/**
 * "۱۰ دلار (۱٬۰۰۰٬۰۰۰ تومان)" — dollars lead because they are the figure that
 * still means something next year; Toman follows because it is what people
 * actually pay in. Falls back to Toman alone until a rate is set.
 */
export function formatMoney(toman: number): string {
  const usd = tomanToUsd(toman);
  if (usd === null) return faToman(toman);
  return `${faUsd(usd)} (${faToman(toman)})`;
}

/** The same, for a range: "۱۰ تا ۱۸ دلار (۱٬۰۰۰٬۰۰۰ تا ۱٬۸۰۰٬۰۰۰ تومان)". */
export function formatMoneyRange(low: number, high: number): string {
  const lowUsd = tomanToUsd(low);
  const highUsd = tomanToUsd(high);
  const toman = `${Math.round(low).toLocaleString("fa-IR")} تا ${faToman(high)}`;
  if (lowUsd === null || highUsd === null) return toman;
  return `${lowUsd.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} تا ${faUsd(
    highUsd,
  )} (${toman})`;
}

/**
 * Money reference. The one file that decides how an amount is written.
 *
 * The exchange rate is NOT here — it moves weekly and sometimes daily, so it
 * is fetched live in lib/exchange-rate.ts and passed in. Every formatter below
 * takes it as an argument and treats null as "no rate available", falling back
 * to Toman alone rather than inventing a dollar figure.
 */

/**
 * What one hour of a mid-level specialist's time is worth, in Toman.
 *
 * Seniority and duration scale this — see lib/seniority.ts. Set by the
 * founder, who knows the market; it is not derived from anything.
 *
 * This one is safe to hardcode because it is a judgement, not an observation:
 * it changes when the business decides it should, not when the market moves.
 * The exchange rate then carries it into dollars.
 */
export const BASE_HOURLY_TOMAN: number | null = 1_000_000;

export function tomanToUsd(toman: number, rate: number | null): number | null {
  if (rate === null || rate <= 0) return null;
  return toman / rate;
}

function faToman(toman: number): string {
  return `${Math.round(toman).toLocaleString("fa-IR")} تومان`;
}

function faUsd(usd: number): string {
  // Below ten, whole dollars are too coarse and one decimal is false
  // precision; halves read naturally. Above it, decimals are noise.
  const rounded = usd < 10 ? Math.round(usd * 2) / 2 : Math.round(usd);
  return `${rounded.toLocaleString("fa-IR")} دلار`;
}

/**
 * "۵ دلار (۱٬۰۰۰٬۰۰۰ تومان)" — dollars lead because that figure still means
 * something after a devaluation; Toman follows because it is what people
 * actually pay in. Toman alone when there is no rate.
 */
export function formatMoney(toman: number, rate: number | null): string {
  const usd = tomanToUsd(toman, rate);
  if (usd === null) return faToman(toman);
  return `${faUsd(usd)} (${faToman(toman)})`;
}

/** The same for a range, with the currency named once at each end. */
export function formatMoneyRange(
  low: number,
  high: number,
  rate: number | null,
): string {
  const lowUsd = tomanToUsd(low, rate);
  const highUsd = tomanToUsd(high, rate);
  const tomanPart = `${Math.round(low).toLocaleString("fa-IR")} تا ${faToman(high)}`;
  if (lowUsd === null || highUsd === null) return tomanPart;

  const lowLabel = (lowUsd < 10 ? Math.round(lowUsd * 2) / 2 : Math.round(lowUsd))
    .toLocaleString("fa-IR");
  return `${lowLabel} تا ${faUsd(highUsd)} (${tomanPart})`;
}

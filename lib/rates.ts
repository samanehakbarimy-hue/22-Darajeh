/**
 * Money reference. The one file that decides how an amount is written.
 *
 * The exchange rate is NOT here — it moves weekly and sometimes daily, so it
 * is fetched live in lib/exchange-rate.ts and passed in. Every formatter below
 * takes it as an argument and treats null as "no rate available", falling back
 * to Toman alone rather than inventing a dollar figure.
 *
 * Toman leads and the dollar follows, marked حدود. People here pay in Toman,
 * so that is the real number; the dollar is a reference that was true when the
 * page rendered and drifts afterwards. Presenting it as exact would claim a
 * precision the rate does not have.
 */

/**
 * What one hour of a mid-level specialist's time is worth, in US dollars.
 *
 * Anchored in dollars rather than Toman on purpose: a dollar figure keeps its
 * meaning through a devaluation, so when the rial moves only the exchange rate
 * needs updating and every suggestion follows automatically. A Toman anchor
 * would have to be re-decided by hand every few months.
 *
 * Seniority and duration scale it — see lib/seniority.ts. Set by the founder,
 * who knows what this market can pay; it is not derived from anything.
 */
export const BASE_HOURLY_USD: number | null = 2;

export function tomanToUsd(toman: number, rate: number | null): number | null {
  if (rate === null || rate <= 0) return null;
  return toman / rate;
}

/** Suggested amounts are rounded hard: they are a hint, not an invoice. */
export function roundToman(amount: number): number {
  if (amount >= 1_000_000) return Math.round(amount / 100_000) * 100_000;
  if (amount >= 300_000) return Math.round(amount / 50_000) * 50_000;
  return Math.round(amount / 10_000) * 10_000;
}

function faToman(toman: number): string {
  return `${Math.round(toman).toLocaleString("fa-IR")} تومان`;
}

/** Dollars are a rough guide here, so halves are as precise as it gets. */
function usdNumber(usd: number): string {
  const rounded = usd < 10 ? Math.round(usd * 2) / 2 : Math.round(usd);
  return rounded.toLocaleString("fa-IR");
}

/**
 * "۱٬۰۰۰٬۰۰۰ تومان (حدود ۵ دلار)" — the price they pay, then the reference.
 * Toman alone when no rate is available.
 *
 * Note this does NOT round: a specialist who set 470,000 must see 470,000.
 * Rounding belongs to suggestions, via roundToman.
 */
export function formatMoney(toman: number, rate: number | null): string {
  const usd = tomanToUsd(toman, rate);
  if (usd === null) return faToman(toman);
  return `${faToman(toman)} (حدود ${usdNumber(usd)} دلار)`;
}

/** The same for a range, with each unit named once. */
export function formatMoneyRange(
  low: number,
  high: number,
  rate: number | null,
): string {
  const tomanPart = `${Math.round(low).toLocaleString("fa-IR")} تا ${faToman(high)}`;
  const lowUsd = tomanToUsd(low, rate);
  const highUsd = tomanToUsd(high, rate);
  if (lowUsd === null || highUsd === null) return tomanPart;

  return `${tomanPart} (حدود ${usdNumber(lowUsd)} تا ${usdNumber(highUsd)} دلار)`;
}

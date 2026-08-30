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
export const BASE_HOURLY_USD: number | null = 3;

export function tomanToUsd(toman: number, rate: number | null): number | null {
  if (rate === null || rate <= 0) return null;
  return toman / rate;
}

/**
 * How coarse a toman figure should be at a given size.
 *
 * Bigger numbers get bigger steps because the eye reads them by their leading
 * digits: 7,050,000 and 7,000,000 are the same amount of money to anybody
 * deciding whether to book, and only one of them looks like a decision.
 */
function tomanStep(amount: number): number {
  if (amount >= 1_000_000) return 100_000;
  if (amount >= 300_000) return 50_000;
  return 10_000;
}

/** Rounded hard, for display. A price is read, not audited. */
export function roundToman(amount: number): number {
  return Math.round(amount / tomanStep(amount)) * tomanStep(amount);
}

/**
 * The same, but never past the number it came from.
 *
 * A limit is not a price: it is something somebody has to type a figure inside
 * of. Rounding a ceiling of 550,047 up to 600,000 invites a specialist to
 * enter 600,000 and be refused by the very rule that just quoted it, so
 * ceilings round down and floors round up.
 */
export function floorToman(amount: number): number {
  return Math.floor(amount / tomanStep(amount)) * tomanStep(amount);
}

export function ceilToman(amount: number): number {
  return Math.ceil(amount / tomanStep(amount)) * tomanStep(amount);
}

function faToman(toman: number): string {
  return `${Math.round(toman).toLocaleString("fa-IR")} تومان`;
}

/**
 * Whole dollars, never cents.
 *
 * $33.98 is a conversion artefact, not a price anybody set — the specialist
 * typed a toman figure and this is what fell out of dividing it by a rate that
 * will be different tomorrow. Printing the cents claims a precision that
 * nothing behind the number has, so they go.
 */
function usdNumber(usd: number): string {
  return Math.max(1, Math.round(usd)).toLocaleString("fa-IR");
}

/** «حدود ۳۴ دلار» — the reference figure, said as the estimate it is. */
export function formatUsdApprox(usd: number): string {
  return `حدود ${usdNumber(usd)} دلار`;
}

/** «۷٬۰۰۰٬۰۰۰ تومان», rounded to something a person would actually say. */
export function formatTomanApprox(toman: number): string {
  return faToman(roundToman(toman));
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

const SCALES: { value: number; word: string }[] = [
  { value: 1_000_000_000, word: "میلیارد" },
  { value: 1_000_000, word: "میلیون" },
  { value: 1_000, word: "هزار" },
];

/**
 * A Toman figure said out loud: ۲۲٬۰۲۰٬۰۰۰ becomes «۲۲ میلیون و ۲۰ هزار تومان».
 *
 * Prices here run to seven and eight digits, and a row of zeros is genuinely
 * hard to read — ۱۰۰۰۰۰۰ and ۱۰۰۰۰۰۰۰ differ by one character and by ten times
 * the money. Grouping helps the eye; saying the magnitude in words is what
 * actually catches a mis-typed zero, which is why banks print both.
 *
 * Only the magnitude is spelled, not every digit: «۲۲ میلیون» reads faster
 * than «بیست و دو میلیون» and is just as hard to get wrong.
 */
export function spellToman(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";

  let left = Math.round(amount);
  const parts: string[] = [];

  for (const { value, word } of SCALES) {
    const count = Math.floor(left / value);
    if (count > 0) {
      parts.push(`${count.toLocaleString("fa-IR")} ${word}`);
      left -= count * value;
    }
  }

  if (left > 0) parts.push(left.toLocaleString("fa-IR"));
  if (parts.length === 0) return "";

  return `${parts.join(" و ")} تومان`;
}

/**
 * Prices are rounded to the nearest thousand Toman on the way in.
 *
 * A price of ۲۲٬۰۲۰٬۲۱۳ is not a decision anybody made; it is a slip, and it
 * looks like one on a public profile. Nothing in this market is priced to the
 * Toman, so the last three digits carry no information and only cost trust.
 */
export function roundEnteredPrice(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount / 1000) * 1000;
}

/**
 * Above this, a price is a typo rather than a decision.
 *
 * Not a judgement about what anyone may charge — the highest band tops out
 * near ۲٬۴۰۰٬۰۰۰ for an hour, so this sits forty times above the most
 * expensive thing the site suggests. It exists to stop ۹۰۰٬۰۰۰٬۰۰۰ reaching a
 * public profile, which is what happens when a hand rests on a key.
 */
export const MAX_PRICE_TOMAN = 100_000_000;

/**
 * The toman figure shown for a dollar price: rounded to the nearest 50,000.
 *
 * Must agree with display_toman() in the database, which is what the daily job
 * uses. If the two ever disagree, a price saved here would be rewritten by the
 * job the same night for no visible reason — so the arithmetic is deliberately
 * the same shape in both places rather than merely equivalent.
 *
 * 50,000 toman is roughly a quarter of a dollar. Small enough that nobody feels
 * short-changed, large enough that a percent or two of market movement lands
 * inside one step and changes nothing.
 */
export function displayToman(usd: number, rate: number | null): number | null {
  if (!rate || rate <= 0) return null;
  return Math.max(50_000, Math.round((usd * rate) / 50_000) * 50_000);
}

/**
 * Experience level, and the price suggestion built on it.
 *
 * No amount is written here. The base rate and the exchange rate both live in
 * lib/rates.ts, so this file only decides how experience and duration scale
 * them — see that file when a number needs changing.
 */

import {
  BASE_HOURLY_USD,
  formatMoneyRange,
  roundToman,
} from "@/lib/rates";

export type Seniority = "mid" | "senior" | "principal";

export const SENIORITY_LEVELS: {
  value: Seniority;
  label: string;
  /** What a seeker sees on the profile. */
  badge: string;
  /** Multiplier against the base hourly rate. */
  factor: number;
}[] = [
  { value: "mid", label: "۳ تا ۷ سال تجربه", badge: "۳ تا ۷ سال تجربه", factor: 1 },
  {
    value: "senior",
    label: "۷ تا ۱۴ سال تجربه",
    badge: "۷ تا ۱۴ سال تجربه",
    factor: 1.7,
  },
  {
    value: "principal",
    label: "بیش از ۱۴ سال تجربه",
    badge: "بیش از ۱۴ سال تجربه",
    factor: 2.6,
  },
];

export function seniorityBadge(value: string | null | undefined): string | null {
  return SENIORITY_LEVELS.find((l) => l.value === value)?.badge ?? null;
}

/** The narrowest and widest a specialist may claim. */
export const MIN_YEARS = 3;
export const MAX_YEARS = 30;

/**
 * Which price band a year count falls into.
 *
 * Must agree with seniority_for_years() in migration 0057, which is what the
 * database actually enforces. This copy exists so a form can show somebody
 * their band as they type, and it is only ever a preview — the stored value
 * comes from the trigger, never from here.
 */
export function seniorityForYears(
  years: number | null | undefined,
): Seniority | null {
  if (years === null || years === undefined || !Number.isFinite(years)) {
    return null;
  }
  if (years < 7) return "mid";
  if (years < 15) return "senior";
  return "principal";
}

/**
 * What a seeker reads: «۹ سال تجربه».
 *
 * Falls back to the old band label for a profile written before years were
 * asked for. Inventing a number to fill the gap would publish a claim about
 * somebody that they never made, so the band stays until they say otherwise.
 */
export function experienceLabel(
  years: number | null | undefined,
  seniority: string | null | undefined,
): string | null {
  if (typeof years === "number" && years > 0) {
    return `${years.toLocaleString("fa-IR")} سال تجربه`;
  }
  return seniorityBadge(seniority);
}

/**
 * A suggested range, not a rule. Returns null when there is no base rate or no
 * seniority to scale it by — a suggestion drawn from nothing is worse than
 * none, because people anchor on whatever number they are shown.
 *
 * `hours` lets a 45-minute session and a 3-hour minimum share one formula.
 */
export function suggestedRange(
  seniority: string | null | undefined,
  hours: number,
  usdRate: number | null,
): { low: number; high: number } | null {
  // The base is in dollars, so without a rate there is nothing to convert it
  // into. No suggestion is the right answer — better than one in the wrong
  // currency, or one built on a guessed rate.
  if (BASE_HOURLY_USD === null || usdRate === null || usdRate <= 0) return null;
  const level = SENIORITY_LEVELS.find((l) => l.value === seniority);
  if (!level || hours <= 0) return null;

  const centre = BASE_HOURLY_USD * usdRate * level.factor * hours;

  // Wider downwards than up, because most people booking here are early in
  // their careers and paying for themselves. But the floor used to sit at
  // 0.55, which put an hour with a ۷–۱۴ سال engineer below what that engineer
  // earns as an employee — a suggestion that quietly says the work is not
  // worth much. Anyone who wants to help for nothing already has the free
  // 22-minute call; a paid session should be a real price.
  return { low: roundToman(centre * 0.7), high: roundToman(centre * 1.5) };
}

/** Delegates, so currency and exchange rate stay in one file. */
export function formatRange(
  range: { low: number; high: number },
  rate: number | null,
): string {
  return formatMoneyRange(range.low, range.high, rate);
}

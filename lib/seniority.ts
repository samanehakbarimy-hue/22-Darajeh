/**
 * Experience level, and the price suggestion built on it.
 */

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
  { value: "senior", label: "۷ تا ۱۴ سال تجربه", badge: "۷ تا ۱۴ سال تجربه", factor: 1.7 },
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

/**
 * The one number the price suggestion is built from: what an hour of a
 * mid-level specialist's time is worth, in Toman.
 *
 * Deliberately null until someone who knows the Iranian market sets it. Every
 * suggested band is derived from this, so one number keeps the whole thing
 * current — which matters in an economy where a figure hardcoded today is
 * wrong within a year. While it is null the app simply shows no suggestion
 * rather than a made-up one.
 *
 * Set it, and bands appear everywhere at once.
 */
export const BASE_HOURLY_TOMAN: number | null = null;

/** Rounded to something a person would actually type. */
function tidy(amount: number): number {
  if (amount >= 1_000_000) return Math.round(amount / 100_000) * 100_000;
  if (amount >= 100_000) return Math.round(amount / 50_000) * 50_000;
  return Math.round(amount / 10_000) * 10_000;
}

/**
 * A suggested range, not a rule. Returns null when there is no base rate, or
 * no seniority to scale it by — a suggestion drawn from nothing is worse than
 * none, because people anchor on whatever number they are shown.
 *
 * `hours` lets a 45-minute session and a 3-hour minimum share one formula.
 */
export function suggestedRange(
  seniority: string | null | undefined,
  hours: number,
): { low: number; high: number } | null {
  if (BASE_HOURLY_TOMAN === null) return null;
  const level = SENIORITY_LEVELS.find((l) => l.value === seniority);
  if (!level || hours <= 0) return null;

  const centre = BASE_HOURLY_TOMAN * level.factor * hours;
  // Wide enough to be a range rather than a price in disguise.
  return { low: tidy(centre * 0.75), high: tidy(centre * 1.35) };
}

export function formatRange(range: { low: number; high: number }): string {
  return `${range.low.toLocaleString("fa-IR")} تا ${range.high.toLocaleString("fa-IR")} تومان`;
}

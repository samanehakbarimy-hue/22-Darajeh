/**
 * Persian formatting helpers. These were copied into three components before
 * this file existed, which meant three chances to drift apart.
 */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Rewrites Latin digits as Persian ones. */
export function fa(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** A local calendar date as YYYY-MM-DD, never shifted by timezone. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Midnight today, for comparing whole days rather than instants. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function hhmm(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * The date formats the app uses, defined once. Building an Intl formatter
 * inline in thirteen places produced thirteen slightly different results.
 */
export const dateFormats = {
  /** چهارشنبه ۵ شهریور ساعت ۱۴:۴۰ */
  full: new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  /** چهارشنبه ۵ شهریور */
  day: new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
  /** ۵ شهریور */
  shortDay: new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    day: "numeric",
  }),
  /** شهریور ۱۴۰۵ */
  monthYear: new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    year: "numeric",
  }),
  /** ۱۴:۴۰ */
  clock: new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  /** چهارشنبه */
  weekday: new Intl.DateTimeFormat("fa-IR", { weekday: "long" }),
} as const;

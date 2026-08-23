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
 * Every time in this product is Tehran time.
 *
 * Not the server's clock and not the visitor's: a session at ۹ صبح has to
 * mean the same moment to the specialist who offered it and the person who
 * booked it, whichever machine renders the page. Server components format on
 * the server (UTC on Vercel) and client components format on the device, so
 * leaving it unpinned made those two disagree by the offset.
 */
export const TEHRAN = "Asia/Tehran";

/** How far ahead of UTC Tehran is at a given moment, in milliseconds. */
function tehranOffsetMs(instant: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TEHRAN,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    // Some environments render midnight as hour 24.
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asIfUtc - instant;
}

/**
 * Turns a wall-clock date and time the specialist picked ("2026-08-27",
 * "09:00") into the actual instant it names in Tehran.
 *
 * new Date("2026-08-27T09:00:00") would read those digits in whatever zone
 * the machine happens to be in — UTC on Vercel — and store a moment three
 * and a half hours away from the one intended.
 */
export function tehranWallTimeToInstant(
  date: string,
  time: string,
): Date | null {
  const asIfUtc = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(asIfUtc)) return null;
  return new Date(asIfUtc - tehranOffsetMs(asIfUtc));
}

/** Adds whole days to a YYYY-MM-DD string without touching any timezone. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
/**
 * The date formats the app uses, defined once. Building an Intl formatter
 * inline in thirteen places produced thirteen slightly different results.
 */
export const dateFormats = {
  /** چهارشنبه ۵ شهریور ساعت ۱۴:۴۰ */
  full: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  /** چهارشنبه ۵ شهریور */
  day: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
  /** ۵ شهریور */
  shortDay: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    month: "long",
    day: "numeric",
  }),
  /** شهریور ۱۴۰۵ */
  monthYear: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    month: "long",
    year: "numeric",
  }),
  /** ۱۴:۴۰ */
  clock: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    hour: "2-digit",
    minute: "2-digit",
  }),
  /** ۵ شهریور ۱۴۰۵ */
  fullDate: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  /** چهارشنبه */
  weekday: new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    weekday: "long",
  }),
} as const;

/**
 * What a specialist offers.
 *
 * Two shapes, deliberately different:
 *
 * Sessions are fixed. The catalogue below defines the title, the description
 * and the length, and a specialist only decides whether to offer one and what
 * to charge. That is what makes two profiles comparable — when one person's
 * "بررسی رزومه" is 30 minutes and another's is 90, the prices beside them mean
 * different things and a seeker cannot judge either.
 *
 * Project work is free-form, because the whole point of it is being shaped to
 * a particular job.
 *
 * The free 22-minute call is not stored at all: there is exactly one, it has
 * no price, and every specialist has it.
 */

import { displayToman, formatUsdApprox } from "@/lib/rates";

export type ServiceKind = "consultation" | "hourly_project";

/** The two tabs on a profile. The free call sits inside sessions. */
export type ServiceTab = "intro" | "sessions" | "projects";

/** A row of mentor_services. */
export type MentorService = {
  id: string;
  kind: ServiceKind;
  session_key: string | null;
  title: string;
  description: string;
  minutes: number | null;
  min_hours: number | null;
  price_toman: number | null;
  price_usd?: number | null;
  is_active: boolean;
  /** Project work only: a rate deliberately left open. */
  is_negotiable: boolean;
};

// Three ways to work with somebody, cheapest first — and the first one is
// free, which is the whole proposition of the site rather than a tier of it.
export const TABS: { tab: ServiceTab; label: string; note?: string }[] = [
  { tab: "intro", label: "گفت‌وگوی مشاوره‌ای" },
  { tab: "sessions", label: "جلسات تخصصی" },
  { tab: "projects", label: "کار پروژه", note: "(نفر-ساعت)" },
];

export const KIND_LABEL: Record<ServiceKind, string> = {
  consultation: "جلسه مشاوره",
  hourly_project: "پروژه نفرساعتی",
};

/** The introductory call: first row of the sessions tab, and the only free one. */
export const FREE_CALL = {
  title: "گفتگوی راهنمایی",
  description: "بگو دنبال چه هستی و ببین این کارشناس می‌تواند کمکت کند.",
  minutes: 22,
} as const;

export type SessionType = {
  key: string;
  title: string;
  description: string;
  minutes: number;
};

/**
 * Every session anyone can offer. A specialist picks from these and sets a
 * price; they cannot rename one or change its length.
 *
 * Adding an entry offers it to everyone, and changing wording here rewrites it
 * on every profile — which is the point. Changing a `key` would orphan the
 * rows pointing at it, so add a new entry instead.
 */
export const SESSION_TYPES: SessionType[] = [
  {
    key: "resume-review",
    title: "بررسی رزومه",
    description: "بازخورد دقیق برای ارتقای رزومه.",
    minutes: 30,
  },
  {
    key: "career-path",
    title: "مسیر شغلی",
    description: "برنامه‌ریزی برای مسیر رشد شغلی.",
    minutes: 45,
  },
  {
    key: "interview-prep",
    title: "آمادگی مصاحبه",
    description: "تمرین و آمادگی برای مصاحبه شغلی.",
    minutes: 60,
  },
  {
    key: "open-qa",
    title: "پرسش و پاسخ",
    description: "هر سؤالی داری بپرس.",
    minutes: 60,
  },
];

/**
 * What the price band table files project work under.
 *
 * Project work has no session type — it is priced by the hour against a
 * different conversation — so the band table, keyed by session type, needs
 * some name for it. Must match band_key() in migration 0056; if the two ever
 * disagree, an admin sets a range that nothing consults.
 */
export const HOURLY_BAND_KEY = "hourly_project";

export function sessionType(key: string | null): SessionType | null {
  if (!key) return null;
  return SESSION_TYPES.find((s) => s.key === key) ?? null;
}

/** Starting points for project work, which a specialist then rewrites. */

/** For a session these come from the catalogue, not from the stored row. */
export function serviceTitle(service: MentorService): string {
  return sessionType(service.session_key)?.title ?? service.title;
}

export function serviceDescription(service: MentorService): string {
  return sessionType(service.session_key)?.description ?? service.description;
}

export function formatDuration(service: MentorService): string {
  const session = sessionType(service.session_key);
  if (session) return `${session.minutes.toLocaleString("fa-IR")} دقیقه`;
  return `حداقل ${(service.min_hours ?? 1).toLocaleString("fa-IR")} ساعت`;
}

/**
 * The price, as two lines rather than one string.
 *
 * Two, because they are not the same kind of statement. The toman figure is
 * what a seeker pays; the dollar figure is what the specialist actually set,
 * and it is here so that a number changing overnight has something on the page
 * to explain itself by. Returning them separately lets the card give each its
 * own weight — the first bold, the second quiet underneath — instead of
 * running them together into one line that has to wrap somewhere.
 *
 * Both are rounded, and only here. price_usd keeps its cents in the database
 * and the conversion is done at full precision; what gets rounded is the
 * sentence, not the money.
 */
export type ServicePrice = { toman: string; usd: string | null };

export function servicePrice(
  service: MentorService,
  rate: number | null,
): ServicePrice | null {
  const usd = typeof service.price_usd === "number" ? service.price_usd : null;

  // Rendered through the very function the daily job writes with, rather than
  // rounded again here. Two rounding rules for one number is how the figure a
  // specialist confirmed on save turns into a different figure on their public
  // profile — so there is one rule, and this is a call to it.
  //
  // The stored column is the fallback for when no rate is on file at all. It
  // is the same arithmetic, done on the day the job last ran.
  const toman =
    usd !== null && usd > 0 && rate
      ? displayToman(usd, rate)
      : service.price_toman;
  if (toman === null || toman <= 0) return null;

  const amount = `${toman.toLocaleString("fa-IR")} تومان`;
  return {
    toman: service.kind === "hourly_project" ? `${amount} در ساعت` : amount,
    // Derived from toman when the price predates price_usd entirely.
    usd:
      usd !== null && usd > 0
        ? formatUsdApprox(usd)
        : rate
          ? formatUsdApprox(toman / rate)
          : null,
  };
}

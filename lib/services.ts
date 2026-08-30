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
 * The price, with toman leading and the dollar figure after it.
 *
 * This used to be toman only, on the reasoning that a seeker pays in toman and
 * has no use for dollars. That is still true of the payment — but the dollar
 * figure is now the price itself, and the toman number is a rendering of it
 * that moves when the market does. Showing only the derived number means a
 * price that changes overnight with nothing on the page to explain why.
 *
 * Parenthesised and second, so it reads as the reference it is rather than as a
 * second price to weigh against the first. Hourly work still says so, and the
 * suffix stays outside the brackets where it belongs.
 */
export function formatServicePrice(service: MentorService): string {
  if (service.price_toman === null) return "به‌زودی";

  const toman = `${service.price_toman.toLocaleString("fa-IR")} تومان`;
  const usd =
    typeof service.price_usd === "number" && service.price_usd > 0
      ? ` ($${Number(service.price_usd).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })})`
      : "";

  const amount = `${toman}${usd}`;
  return service.kind === "hourly_project" ? `${amount} در ساعت` : amount;
}

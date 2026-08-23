/**
 * What a specialist offers.
 *
 * The free 22-minute call is not stored: there is exactly one, it has no
 * price, and every specialist must have it — a row could be deleted by
 * accident. Everything else lives in mentor_services, entered by the
 * specialist, because a price under someone's photo has to be one they set.
 */

export type ServiceKind = "consultation" | "hourly_project";
export type ServiceType = "free_call" | ServiceKind;

/** A row of mentor_services. */
export type MentorService = {
  id: string;
  kind: ServiceKind;
  title: string;
  description: string;
  minutes: number | null;
  min_hours: number | null;
  price_toman: number | null;
  is_active: boolean;
};

export const TABS: { type: ServiceType; label: string }[] = [
  { type: "free_call", label: "تماس رایگان" },
  { type: "consultation", label: "جلسات مشاوره" },
  { type: "hourly_project", label: "پروژه نفرساعتی" },
];

export const KIND_LABEL: Record<ServiceKind, string> = {
  consultation: "جلسه مشاوره",
  hourly_project: "پروژه نفرساعتی",
};

/** The introductory call, the same for everyone and the only free thing. */
export const FREE_CALL = {
  title: "تماس راهنمایی",
  description: "بگو دنبال چه هستی و ببین این متخصص به کارت می‌آید. بدون هزینه.",
  minutes: 22,
} as const;

/**
 * Starting points in the editor, not offers on a profile. A specialist picks
 * one to prefill the form and then sets their own wording and price; nothing
 * here reaches a public page until they save it.
 */
export const TEMPLATES: {
  kind: ServiceKind;
  title: string;
  description: string;
  minutes?: number;
  minHours?: number;
}[] = [
  {
    kind: "consultation",
    title: "بررسی رزومه",
    description: "رزومه‌ات را با هم می‌خوانیم و می‌گوییم کجا باید عوض شود.",
    minutes: 45,
  },
  {
    kind: "consultation",
    title: "آمادگی مصاحبه",
    description: "یک مصاحبه تمرینی واقعی، بعدش بازخورد رک.",
    minutes: 60,
  },
  {
    kind: "consultation",
    title: "مسیر شغلی",
    description: "کجا ایستاده‌ای، قدم بعدی چیست، و چه چیزی را باید یاد بگیری.",
    minutes: 60,
  },
  {
    kind: "consultation",
    title: "پرسش و پاسخ",
    description: "هر سؤالی که درباره این حوزه داری، بدون مقدمه.",
    minutes: 30,
  },
  {
    kind: "hourly_project",
    title: "بررسی فنی مدارک و طراحی",
    description: "مدارک یا طراحی پروژه‌ات را می‌خواند و ایرادها را می‌گوید.",
    minHours: 3,
  },
  {
    kind: "hourly_project",
    title: "حل یک مسئله مشخص",
    description: "روی یک مسئله معین در پروژه‌ات با هم کار می‌کنید.",
    minHours: 2,
  },
  {
    kind: "hourly_project",
    title: "همراهی در طول اجرا",
    description: "در جریان پروژه در دسترس است و هر جا لازم شد کمک می‌کند.",
    minHours: 5,
  },
];

/** "۸۰۰٬۰۰۰ تومان", or the honest placeholder while nothing is priced. */
export function formatPrice(price: number | null): string {
  if (price === null) return "به‌زودی";
  return `${price.toLocaleString("fa-IR")} تومان`;
}

/** "۴۵ دقیقه" for a session, "حداقل ۳ ساعت" for project work. */
export function formatDuration(service: MentorService): string {
  if (service.kind === "consultation") {
    return `${(service.minutes ?? 0).toLocaleString("fa-IR")} دقیقه`;
  }
  return `حداقل ${(service.min_hours ?? 1).toLocaleString("fa-IR")} ساعت`;
}

/** Hourly work is priced per hour, and the label has to say so. */
export function formatServicePrice(service: MentorService): string {
  if (service.price_toman === null) return "به‌زودی";
  const amount = formatPrice(service.price_toman);
  return service.kind === "hourly_project" ? `${amount} در ساعت` : amount;
}

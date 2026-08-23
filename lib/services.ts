/**
 * What a specialist can offer.
 *
 * The free 22-minute call is real: it has slots, a booking flow and a row in
 * the database. The other two kinds are not yet — nothing stores them, no
 * specialist has entered any, and there is no way to take payment. This file
 * is the catalogue they will be chosen from, and the shape a per-specialist
 * table will hold when there is one.
 *
 * Prices are deliberately absent rather than invented. These profiles carry a
 * named person's photo on a public page: printing "بررسی رزومه — ۸۰۰٬۰۰۰
 * تومان" under someone's face would be advertising terms they never agreed
 * to, at a number nobody set. The fields exist; the values wait for the
 * specialist.
 */

export type ServiceType = "free_call" | "consultation" | "hourly_project";

export type Service = {
  id: string;
  title: string;
  description: string;
  /** Consultations are sold by the session. */
  minutes?: number;
  /** Projects are sold by the hour. */
  minHours?: number;
  /**
   * Toman. null means the specialist has not priced this yet, which is every
   * service today — the UI shows "به‌زودی" rather than a made-up number.
   */
  price: number | null;
  cta: string;
};

export const TABS: { type: ServiceType; label: string }[] = [
  { type: "free_call", label: "تماس رایگان" },
  { type: "consultation", label: "جلسات مشاوره" },
  { type: "hourly_project", label: "پروژه نفرساعتی" },
];

/** The introductory call. One per specialist, and the only one that is live. */
export const FREE_CALL = {
  title: "تماس راهنمایی",
  description:
    "بگو دنبال چه هستی و ببین این متخصص به کارت می‌آید. بدون هزینه.",
  minutes: 22,
} as const;

export const CONSULTATIONS: Service[] = [
  {
    id: "resume-review",
    title: "بررسی رزومه",
    description: "رزومه‌ات را با هم می‌خوانیم و می‌گوییم کجا باید عوض شود.",
    minutes: 45,
    price: null,
    cta: "رزرو",
  },
  {
    id: "interview-prep",
    title: "آمادگی مصاحبه",
    description: "یک مصاحبه تمرینی واقعی، بعدش بازخورد رک.",
    minutes: 60,
    price: null,
    cta: "رزرو",
  },
  {
    id: "career-path",
    title: "مسیر شغلی",
    description: "کجا ایستاده‌ای، قدم بعدی چیست، و چه چیزی را باید یاد بگیری.",
    minutes: 60,
    price: null,
    cta: "رزرو",
  },
  {
    id: "open-qa",
    title: "پرسش و پاسخ",
    description: "هر سؤالی که درباره این حوزه داری، بدون مقدمه.",
    minutes: 30,
    price: null,
    cta: "رزرو",
  },
];

export const HOURLY_PROJECTS: Service[] = [
  {
    id: "technical-review",
    title: "بررسی فنی مدارک و طراحی",
    description: "مدارک یا طراحی پروژه‌ات را می‌خواند و ایرادها را می‌گوید.",
    minHours: 3,
    price: null,
    cta: "درخواست همکاری",
  },
  {
    id: "problem-solving",
    title: "حل یک مسئله مشخص",
    description: "روی یک مسئله معین در پروژه‌ات با هم کار می‌کنید.",
    minHours: 2,
    price: null,
    cta: "درخواست همکاری",
  },
  {
    id: "ongoing-support",
    title: "همراهی در طول اجرا",
    description: "در جریان پروژه در دسترس است و هر جا لازم شد کمک می‌کند.",
    minHours: 5,
    price: null,
    cta: "درخواست همکاری",
  },
];

/** "۸۰۰٬۰۰۰ تومان" — or the honest placeholder while nothing is priced. */
export function formatPrice(price: number | null): string {
  if (price === null) return "به‌زودی";
  return `${price.toLocaleString("fa-IR")} تومان`;
}

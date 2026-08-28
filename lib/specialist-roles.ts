/**
 * The fields the hero types through, in the order it types them.
 *
 * This is a hand-written list on purpose, and the one place to edit it. It is
 * not the same thing as the tags کارشناس‌ها actually carry: those are derived
 * from the database and drive real filters, and a field named here does not
 * promise anybody works in it. This list says what the site is for; the
 * browse page says who is on it.
 *
 * Order is honoured exactly and loops from the top after the last one, so
 * moving a line here moves it on the page.
 */
export const SPECIALIST_ROLES = [
  "هوش مصنوعی",
  "امنیت سایبری",
  "تحلیل داده",
  "یادگیری ماشین",
  "طراحی UI/UX",
  "دیجیتال مارکتینگ",
  "سئو",
  "رایانش ابری",
  "دیجیتال مارکتینگ",
  "DevOps",
  "کنترل پروژه",
  "رباتیک",
  "اتوماسیون صنعتی",
  "ابزار دقیق",
  "پایپینگ",
  "شبکه",
  "تجهیزات دوار",
] as const;

/**
 * Job titles, offered in both languages.
 *
 * An Iranian engineer routinely writes the English title professionally — this
 * site's first profile said "Senior Mechanical Engineer" on a Persian page.
 * Each language is searchable by the other, so "mech" and «مکانیک» reach the
 * same job, and whichever one is clicked is the one that shows.
 *
 * The English half is the canonical key: lib/skills.ts hangs its tool
 * suggestions off it, so a title and its translation always suggest the same
 * things.
 */
export const JOB_TITLE_PAIRS: [string, string][] = [
  // نرم‌افزار
  ["مهندس نرم‌افزار", "Software Engineer"],
  ["توسعه‌دهنده فرانت‌اند", "Frontend Developer"],
  ["توسعه‌دهنده بک‌اند", "Backend Developer"],
  ["توسعه‌دهنده فول‌استک", "Full Stack Developer"],
  ["توسعه‌دهنده موبایل", "Mobile Developer"],
  ["توسعه‌دهنده اندروید", "Android Developer"],
  ["توسعه‌دهنده iOS", "iOS Developer"],
  ["توسعه‌دهنده پایتون", "Python Developer"],
  ["توسعه‌دهنده جاوا", "Java Developer"],
  ["توسعه‌دهنده دات‌نت", ".NET Developer"],
  ["توسعه‌دهنده Node.js", "Node.js Developer"],
  ["مهندس دواپس", "DevOps Engineer"],
  ["مهندس قابلیت اطمینان", "Site Reliability Engineer"],
  ["مهندس رایانش ابری", "Cloud Engineer"],
  ["مهندس تست", "QA Engineer"],
  ["مهندس امنیت", "Security Engineer"],
  ["مهندس سیستم‌های نهفته", "Embedded Engineer"],
  ["بازی‌ساز", "Game Developer"],
  ["معمار نرم‌افزار", "Software Architect"],
  ["راهبر فنی", "Tech Lead"],
  ["مدیر مهندسی", "Engineering Manager"],
  ["مدیر ارشد فناوری", "CTO"],
  // داده و هوش مصنوعی
  ["دانشمند داده", "Data Scientist"],
  ["تحلیلگر داده", "Data Analyst"],
  ["مهندس داده", "Data Engineer"],
  ["مهندس یادگیری ماشین", "Machine Learning Engineer"],
  ["مهندس هوش مصنوعی", "AI Engineer"],
  ["مهندس MLOps", "MLOps Engineer"],
  ["پژوهشگر هوش مصنوعی", "AI Research Scientist"],
  // محصول و طراحی
  ["مدیر محصول", "Product Manager"],
  ["طراح محصول", "Product Designer"],
  ["طراح UX/UI", "UX/UI Designer"],
  ["پژوهشگر تجربه کاربری", "UX Researcher"],
  // کسب‌وکار
  ["مدیر پروژه", "Project Manager"],
  ["تحلیلگر کسب‌وکار", "Business Analyst"],
  ["اسکرام مستر", "Scrum Master"],
  ["مدیر بازاریابی", "Marketing Manager"],
  ["کارشناس بازاریابی دیجیتال", "Digital Marketing Specialist"],
  ["مدیر فروش", "Sales Manager"],
  ["مدیر مالی", "Financial Manager"],
  ["حسابدار", "Accountant"],
  ["مدیر منابع انسانی", "HR Manager"],
  // صنعت و مهندسی
  ["مهندس مکانیک", "Mechanical Engineer"],
  ["مهندس برق", "Electrical Engineer"],
  ["مهندس عمران", "Civil Engineer"],
  ["مهندس شیمی", "Chemical Engineer"],
  ["مهندس فرآیند", "Process Engineer"],
  ["مهندس تجهیزات ثابت", "Static Equipment Engineer"],
  ["مهندس پایپینگ", "Piping Engineer"],
  ["مهندس نفت", "Petroleum Engineer"],
  ["مهندس رباتیک", "Robotics Engineer"],
  ["مهندس مکاترونیک", "Mechatronics Engineer"],
  ["مهندس HSE", "HSE Engineer"],
  ["معمار", "Architect"],
];

/** Every title as a selectable option, each searchable by the other language. */
export const JOB_TITLES = JOB_TITLE_PAIRS.flatMap(([fa, en]) => [
  { label: fa, alt: en },
  { label: en, alt: fa },
]);

/**
 * The English form of a title, whichever language it was written in.
 * Returns null for anything typed freehand, which is not an error — it just
 * means there are no tool suggestions keyed to it.
 */
export function canonicalTitle(written: string): string | null {
  const needle = written.trim().toLowerCase();
  if (!needle) return null;
  for (const [fa, en] of JOB_TITLE_PAIRS) {
    if (fa.toLowerCase() === needle || en.toLowerCase() === needle) return en;
  }
  return null;
}

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
 * things. Every title here has an entry there.
 *
 * Scoped to the fields this site is for, and to the shape ADPList and
 * MentorCruise use — software, data, product, design, marketing, business,
 * people, leadership — with oil, gas and heavy engineering added, which those
 * sites do not cover and this one exists partly to serve.
 */
export const JOB_TITLE_PAIRS: [string, string][] = [
  // نرم‌افزار
  ["مهندس نرم‌افزار", "Software Engineer"],
  ["توسعه‌دهنده فرانت‌اند", "Frontend Developer"],
  ["توسعه‌دهنده بک‌اند", "Backend Developer"],
  ["توسعه‌دهنده فول‌استک", "Full Stack Developer"],
  ["توسعه‌دهنده وب", "Web Developer"],
  ["توسعه‌دهنده موبایل", "Mobile Developer"],
  ["توسعه‌دهنده اندروید", "Android Developer"],
  ["توسعه‌دهنده iOS", "iOS Developer"],
  ["توسعه‌دهنده پایتون", "Python Developer"],
  ["توسعه‌دهنده جاوا", "Java Developer"],
  ["توسعه‌دهنده دات‌نت", ".NET Developer"],
  ["توسعه‌دهنده Node.js", "Node.js Developer"],
  ["توسعه‌دهنده React", "React Developer"],
  ["توسعه‌دهنده PHP", "PHP Developer"],
  ["توسعه‌دهنده Go", "Go Developer"],
  ["توسعه‌دهنده وردپرس", "WordPress Developer"],
  ["توسعه‌دهنده بلاک‌چین", "Blockchain Developer"],
  ["بازی‌ساز", "Game Developer"],
  ["مهندس سیستم‌های نهفته", "Embedded Engineer"],
  ["مهندس تست", "QA Engineer"],
  ["مهندس دواپس", "DevOps Engineer"],
  ["مهندس قابلیت اطمینان", "Site Reliability Engineer"],
  ["مهندس رایانش ابری", "Cloud Engineer"],
  ["مهندس پلتفرم", "Platform Engineer"],
  ["مهندس امنیت", "Security Engineer"],
  ["مدیر پایگاه داده", "Database Administrator"],
  ["معمار نرم‌افزار", "Software Architect"],
  ["معمار راهکار", "Solutions Architect"],

  // داده و هوش مصنوعی
  ["دانشمند داده", "Data Scientist"],
  ["تحلیلگر داده", "Data Analyst"],
  ["مهندس داده", "Data Engineer"],
  ["مهندس تحلیل داده", "Analytics Engineer"],
  ["مهندس یادگیری ماشین", "Machine Learning Engineer"],
  ["مهندس هوش مصنوعی", "AI Engineer"],
  ["مهندس MLOps", "MLOps Engineer"],
  ["پژوهشگر هوش مصنوعی", "AI Research Scientist"],
  ["مهندس بینایی ماشین", "Computer Vision Engineer"],
  ["مهندس پردازش زبان طبیعی", "NLP Engineer"],
  ["توسعه‌دهنده هوش تجاری", "BI Developer"],

  // محصول و طراحی
  ["مدیر محصول", "Product Manager"],
  ["مالک محصول", "Product Owner"],
  ["مدیر محصول فنی", "Technical Product Manager"],
  ["طراح محصول", "Product Designer"],
  ["طراح UX/UI", "UX/UI Designer"],
  ["پژوهشگر تجربه کاربری", "UX Researcher"],
  ["طراح گرافیک", "Graphic Designer"],
  ["طراح موشن", "Motion Designer"],
  ["طراح برند", "Brand Designer"],
  ["راهبر طراحی", "Design Lead"],

  // بازاریابی و فروش
  ["مدیر بازاریابی", "Marketing Manager"],
  ["کارشناس بازاریابی دیجیتال", "Digital Marketing Specialist"],
  ["کارشناس سئو", "SEO Specialist"],
  ["بازاریاب محتوا", "Content Marketer"],
  ["مدیر شبکه‌های اجتماعی", "Social Media Manager"],
  ["بازاریاب رشد", "Growth Marketer"],
  ["کارشناس بازاریابی عملکرد", "Performance Marketing Specialist"],
  ["مدیر برند", "Brand Manager"],
  ["مدیر فروش", "Sales Manager"],
  ["مدیر حساب مشتری", "Account Manager"],
  ["مدیر توسعه کسب‌وکار", "Business Development Manager"],
  ["مدیر موفقیت مشتری", "Customer Success Manager"],

  // کسب‌وکار، مالی و عملیات
  ["تحلیلگر کسب‌وکار", "Business Analyst"],
  ["تحلیلگر مالی", "Financial Analyst"],
  ["مدیر مالی", "Financial Manager"],
  ["تحلیلگر سرمایه‌گذاری", "Investment Analyst"],
  ["حسابدار", "Accountant"],
  ["حسابرس", "Auditor"],
  ["مدیر عملیات", "Operations Manager"],
  ["مدیر زنجیره تأمین", "Supply Chain Manager"],
  ["مدیر پروژه", "Project Manager"],
  ["مدیر برنامه", "Program Manager"],
  ["اسکرام مستر", "Scrum Master"],

  // منابع انسانی
  ["مدیر منابع انسانی", "HR Manager"],
  ["کارشناس جذب", "Recruiter"],
  ["کارشناس جذب استعداد", "Talent Acquisition Specialist"],
  ["شریک کسب‌وکار منابع انسانی", "HR Business Partner"],

  // رهبری
  ["راهبر فنی", "Tech Lead"],
  ["مدیر مهندسی", "Engineering Manager"],
  ["معاون مهندسی", "VP of Engineering"],
  ["مدیر ارشد فناوری", "CTO"],
  ["مدیر ارشد محصول", "CPO"],
  ["مدیر ارشد عملیات", "COO"],
  ["مدیرعامل", "CEO"],
  ["بنیان‌گذار", "Founder"],

  // محتوا
  ["نویسنده محتوا", "Content Writer"],
  ["نویسنده فنی", "Technical Writer"],

  // نفت، گاز و مهندسی سنگین
  ["مهندس مکانیک", "Mechanical Engineer"],
  ["مهندس برق", "Electrical Engineer"],
  ["مهندس عمران", "Civil Engineer"],
  ["مهندس سازه", "Structural Engineer"],
  ["مهندس شیمی", "Chemical Engineer"],
  ["مهندس فرآیند", "Process Engineer"],
  ["مهندس تجهیزات ثابت", "Static Equipment Engineer"],
  ["مهندس تجهیزات دوار", "Rotating Equipment Engineer"],
  ["مهندس پایپینگ", "Piping Engineer"],
  ["مهندس خط لوله", "Pipeline Engineer"],
  ["مهندس ابزار دقیق", "Instrumentation Engineer"],
  ["مهندس نفت", "Petroleum Engineer"],
  ["مهندس حفاری", "Drilling Engineer"],
  ["مهندس مخزن", "Reservoir Engineer"],
  ["مهندس بهره‌برداری", "Production Engineer"],
  ["مهندس خوردگی", "Corrosion Engineer"],
  ["مهندس جوش", "Welding Engineer"],
  ["مهندس بازرسی فنی", "Inspection Engineer"],
  ["مهندس راه‌اندازی", "Commissioning Engineer"],
  ["مهندس برنامه‌ریزی و کنترل پروژه", "Planning Engineer"],
  ["مهندس مواد و متالورژی", "Materials Engineer"],
  ["مهندس HSE", "HSE Engineer"],
  ["مهندس رباتیک", "Robotics Engineer"],
  ["مهندس مکاترونیک", "Mechatronics Engineer"],
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

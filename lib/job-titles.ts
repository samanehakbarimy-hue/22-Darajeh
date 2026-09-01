/**
 * Job titles, offered in both languages, grouped by the field they belong to.
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
 * The grouping used to be comments over a flat list. It is data now, because
 * the browse page filters on it — a comment cannot be read at runtime, and a
 * second list of the same titles kept somewhere else would drift from this one
 * the first time anybody added a job. JOB_TITLE_PAIRS is derived below rather
 * than maintained, so the two can never disagree.
 *
 * Scoped to the fields this site is for, and to the shape ADPList and
 * MentorCruise use — software, data, product, design, marketing, business,
 * people — with oil and gas, manufacturing and construction
 * added, which those sites do not cover and this one exists partly to serve.
 */
export type JobField =
  | "software"
  | "data_ai"
  | "product_design"
  | "marketing_sales"
  | "business_ops"
  | "hr"
  | "content"
  | "oil_gas"
  | "manufacturing"
  | "civil";

/** The Persian name of each field, in the order the filter should list them. */
export const JOB_FIELDS: { key: JobField; label: string }[] = [
  { key: "software", label: "مهندسی نرم‌افزار" },
  { key: "data_ai", label: "هوش مصنوعی، داده و یادگیری ماشین" },
  // The industry calls itself this. «مهندسی سنگین» was a translation of
  // "heavy engineering" that nobody in Iran actually says.
  { key: "oil_gas", label: "نفت، گاز و پتروشیمی" },
  { key: "manufacturing", label: "تولید و ساخت" },
  { key: "civil", label: "عمران و ساختمان" },
  { key: "product_design", label: "محصول و طراحی" },
  { key: "marketing_sales", label: "بازاریابی و فروش" },
  { key: "business_ops", label: "کسب‌وکار، مالی و عملیات" },
  { key: "hr", label: "منابع انسانی" },
  { key: "content", label: "محتوا" },
];

export const TITLES_BY_FIELD: Record<JobField, [string, string][]> = {
  software: [
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
    // «سیستم» is not decoration: without it this is word-for-word the
    // manufacturing reliability engineer below, and one of the two would
    // silently win every lookup.
    ["مهندس قابلیت اطمینان سیستم", "Site Reliability Engineer"],
    ["مهندس رایانش ابری", "Cloud Engineer"],
    ["مهندس پلتفرم", "Platform Engineer"],
    ["مهندس امنیت", "Security Engineer"],
    ["مهندس شبکه", "Network Engineer"],
    ["مدیر پایگاه داده", "Database Administrator"],
    ["معمار نرم‌افزار", "Software Architect"],
    ["معمار راهکار", "Solutions Architect"],
    // Engineering leadership sits with engineering. These had a «رهبری» field
    // of their own, which asked a seeker to know they wanted a manager before
    // they knew what they wanted a manager of.
    ["راهبر فنی", "Tech Lead"],
    ["مدیر مهندسی", "Engineering Manager"],
    ["معاون مهندسی", "VP of Engineering"],
    ["مدیر ارشد فناوری", "CTO"],
  ],

  data_ai: [
    ["دانشمند داده", "Data Scientist"],
    ["تحلیلگر داده", "Data Analyst"],
    ["مهندس داده", "Data Engineer"],
    ["مهندس تحلیل داده", "Analytics Engineer"],
    ["مهندس یادگیری ماشین", "Machine Learning Engineer"],
    ["مهندس هوش مصنوعی", "AI Engineer"],
    ["مهندس هوش مصنوعی مولد", "Generative AI Engineer"],
    ["مهندس MLOps", "MLOps Engineer"],
    ["پژوهشگر هوش مصنوعی", "AI Research Scientist"],
    ["مهندس بینایی ماشین", "Computer Vision Engineer"],
    ["مهندس پردازش زبان طبیعی", "NLP Engineer"],
    ["تحلیلگر هوش تجاری", "Business Intelligence Analyst"],
    ["توسعه‌دهنده هوش تجاری", "BI Developer"],
  ],

  product_design: [
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
    ["مدیر ارشد محصول", "CPO"],
  ],

  marketing_sales: [
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
  ],

  business_ops: [
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
    ["مدیر ارشد عملیات", "COO"],
    ["مدیرعامل", "CEO"],
    ["بنیان‌گذار", "Founder"],
  ],

  hr: [
    ["مدیر منابع انسانی", "HR Manager"],
    ["کارشناس جذب", "Recruiter"],
    ["کارشناس جذب استعداد", "Talent Acquisition Specialist"],
    ["شریک کسب‌وکار منابع انسانی", "HR Business Partner"],
  ],

  content: [
    ["نویسنده محتوا", "Content Writer"],
    ["نویسنده فنی", "Technical Writer"],
  ],

  oil_gas: [
    ["مهندس مکانیک", "Mechanical Engineer"],
    ["مهندس برق", "Electrical Engineer"],
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
    // Wells, not factories — the manufacturing sense is «مهندس تولید» below.
    ["مهندس بهره‌برداری", "Production Engineer"],
    ["مهندس خوردگی", "Corrosion Engineer"],
    ["مهندس جوش", "Welding Engineer"],
    ["مهندس بازرسی فنی", "Inspection Engineer"],
    ["مهندس راه‌اندازی", "Commissioning Engineer"],
    ["مهندس برنامه‌ریزی و کنترل پروژه", "Planning Engineer"],
    ["مهندس مواد و متالورژی", "Materials Engineer"],
    ["مهندس HSE", "HSE Engineer"],
  ],

  civil: [
    ["مهندس عمران", "Civil Engineer"],
    ["مهندس سازه", "Structural Engineer"],
    ["معمار", "Architect"],
  ],

  manufacturing: [
    ["مهندس تولید", "Manufacturing Engineer"],
    ["مهندس طراحی مکانیک", "Mechanical Design Engineer"],
    ["مهندس توسعه محصول", "Product Development Engineer"],
    ["مهندس صنایع", "Industrial Engineer"],
    ["مهندس اتوماسیون", "Automation Engineer"],
    ["مهندس رباتیک", "Robotics Engineer"],
    ["مهندس مکاترونیک", "Mechatronics Engineer"],
    ["مهندس کیفیت", "Quality Engineer"],
    ["مهندس قابلیت اطمینان", "Reliability Engineer"],
    ["مهندس خودرو", "Automotive Engineer"],
  ],
};

/** Every title, flattened. Derived, so it cannot fall out of step with the fields. */
export const JOB_TITLE_PAIRS: [string, string][] = JOB_FIELDS.flatMap(
  ({ key }) => TITLES_BY_FIELD[key],
);

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

/**
 * Which field a written title belongs to, in either language.
 *
 * Null for a freehand title — the browse page shows those under no field
 * rather than guessing one, the same way a profile with no country answers
 * neither side of the location filter.
 */
export function fieldOfTitle(written: string | null): JobField | null {
  const canonical = canonicalTitle(written ?? "");
  if (!canonical) return null;
  for (const { key } of JOB_FIELDS) {
    if (TITLES_BY_FIELD[key].some(([, en]) => en === canonical)) return key;
  }
  return null;
}

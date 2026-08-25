/**
 * Tools and skills, suggested from the field someone already picked.
 *
 * A field says where you work; a skill says what you work with, and the second
 * is what a mentee is actually looking for. "نفت و گاز" tells them almost
 * nothing — "PV Elite، ASME VIII، Caesar II" tells them whether this is the
 * person who can answer their question.
 *
 * Keyed by expertise tag so the suggestions follow the work. A static
 * equipment engineer should never be offered React, and a front-end developer
 * should never be offered AutoCAD; a single flat list would do both.
 *
 * Anything missing can still be typed and is saved as written, which matters
 * more here than anywhere else on the form: this list can never be complete.
 */
const BY_FIELD: Record<string, string[]> = {
  // نفت، گاز و فرآیند
  "نفت و گاز": [
    "AutoCAD",
    "PV Elite",
    "ASME VIII",
    "API 650",
    "API 653",
    "Caesar II",
    "Aspen HYSYS",
    "AutoPIPE",
    "TEMA",
    "SP3D",
  ],
  پتروشیمی: ["Aspen HYSYS", "Aspen Plus", "PV Elite", "ASME VIII", "AutoCAD", "HTRI"],
  "مهندسی شیمی": ["Aspen HYSYS", "Aspen Plus", "HTRI", "MATLAB", "AutoCAD"],

  // مهندسی
  "مهندسی مکانیک": [
    "AutoCAD",
    "SolidWorks",
    "CATIA",
    "ANSYS",
    "Caesar II",
    "PV Elite",
    "Inventor",
  ],
  "مهندسی برق": ["ETAP", "MATLAB", "Simulink", "AutoCAD", "PLC", "SCADA"],
  "مهندسی عمران": ["AutoCAD", "ETABS", "SAP2000", "SAFE", "Revit", "Civil 3D"],
  "انرژی و تجدیدپذیر": ["PVsyst", "HOMER", "MATLAB", "AutoCAD"],

  // نرم‌افزار
  برنامه‌نویسی: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Git", "SQL"],
  "توسعه نرم‌افزار": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Git", "Docker", "SQL"],
  "توسعه وب": ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS", "GraphQL"],
  "توسعه موبایل": ["Swift", "Kotlin", "Flutter", "React Native"],
  "معماری نرم‌افزار": ["Microservices", "Kubernetes", "AWS", "PostgreSQL", "Redis"],
  "دواپس و زیرساخت": ["Docker", "Kubernetes", "Terraform", "Linux", "CI/CD", "Ansible"],
  "رایانش ابری": ["AWS", "Azure", "Google Cloud", "Kubernetes", "Terraform"],
  "تست و تضمین کیفیت": ["Selenium", "Playwright", "Jest", "Postman"],
  "امنیت سایبری": ["Burp Suite", "Wireshark", "Kali Linux", "Nmap", "Metasploit"],
  بازی‌سازی: ["Unity", "Unreal Engine", "C#", "Blender"],
  "اینترنت اشیا": ["Arduino", "Raspberry Pi", "MQTT", "Embedded C"],
  بلاک‌چین: ["Solidity", "Ethereum", "Web3.js"],

  // داده و هوش مصنوعی
  "هوش مصنوعی": ["Python", "PyTorch", "TensorFlow", "Hugging Face", "scikit-learn"],
  "یادگیری ماشین": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "MLflow"],
  "علم داده": ["Python", "Pandas", "NumPy", "scikit-learn", "SQL", "Jupyter"],
  "مهندسی داده": ["SQL", "Spark", "Airflow", "dbt", "Kafka", "Python"],
  "داده و تحلیل": ["SQL", "Power BI", "Tableau", "Excel", "Python"],
  "پردازش زبان طبیعی": ["Python", "Hugging Face", "spaCy", "PyTorch"],
  "بینایی ماشین": ["Python", "OpenCV", "PyTorch", "YOLO"],

  // محصول و طراحی
  "مدیریت محصول": ["Jira", "Figma", "Amplitude", "Scrum", "Notion"],
  "طراحی UX/UI": ["Figma", "Adobe XD", "Sketch", "Adobe Illustrator", "Framer"],
  "تحقیق کاربر": ["Figma", "Maze", "Hotjar", "Google Analytics"],

  // کسب‌وکار
  "مدیریت پروژه": ["Primavera P6", "MS Project", "Jira", "Scrum", "PMBOK"],
  "بازاریابی دیجیتال": ["Google Analytics", "Google Ads", "SEO", "Meta Ads", "Mailchimp"],
  فروش: ["CRM", "HubSpot", "Salesforce"],
  "رشد کسب‌وکار": ["Google Analytics", "SQL", "A/B Testing"],
  "مدیریت مالی": ["Excel", "SAP", "Power BI"],
  "منابع انسانی": ["Excel", "ATS", "LinkedIn Recruiter"],
};

/** Suggestions for the fields a specialist has chosen, most relevant first. */
export function skillsForFields(fields: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const field of fields) {
    for (const skill of BY_FIELD[field] ?? []) {
      if (seen.has(skill)) continue;
      seen.add(skill);
      out.push(skill);
    }
  }
  return out;
}

/** Everything known, for when no field has been chosen yet. */
export const ALL_SKILLS: string[] = [
  ...new Set(Object.values(BY_FIELD).flat()),
];

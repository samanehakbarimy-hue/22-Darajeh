import { canonicalTitle } from "@/lib/job-titles";

/**
 * Tools and skills, suggested from the job title first.
 *
 * A field says where someone works; a title says what they actually do, and
 * that is what decides the tools. An AI engineer, a backend developer and a
 * QA engineer all sit in توسعه نرم‌افزار and share almost nothing — suggesting
 * from the field alone would hand all three the same generic list.
 *
 * So the title leads and the field only fills in behind it. A مهندس تجهیزات
 * ثابت gets PV Elite and API 650 because of the title, not because of نفت و
 * گاز; someone who wrote their title freehand still gets the field's list.
 *
 * Anything missing can still be typed and is saved as written. That matters
 * more here than anywhere else on the form: this list can never be complete,
 * and it is not meant to be.
 */
const BY_TITLE: Record<string, string[]> = {
  // نرم‌افزار
  "Software Engineer": ["Python", "Java", "Git", "SQL", "Docker", "System Design"],
  "Frontend Developer": ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "Tailwind CSS"],
  "Backend Developer": ["Node.js", "Python", "PostgreSQL", "REST API", "Docker", "Redis"],
  "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "Docker"],
  "Mobile Developer": ["Flutter", "React Native", "Swift", "Kotlin", "Firebase"],
  "Android Developer": ["Kotlin", "Java", "Jetpack Compose", "Android SDK", "Firebase"],
  "iOS Developer": ["Swift", "SwiftUI", "Xcode", "UIKit", "Core Data"],
  "Python Developer": ["Python", "Django", "FastAPI", "Flask", "PostgreSQL", "Celery"],
  "Java Developer": ["Java", "Spring Boot", "Hibernate", "Maven", "PostgreSQL"],
  ".NET Developer": ["C#", "ASP.NET Core", "Entity Framework", "SQL Server"],
  "Node.js Developer": ["Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "REST API"],
  "DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Ansible"],
  "Site Reliability Engineer": ["Kubernetes", "Prometheus", "Grafana", "Linux", "Terraform"],
  "Cloud Engineer": ["AWS", "Azure", "Terraform", "Kubernetes", "Linux"],
  "QA Engineer": ["Selenium", "Playwright", "Postman", "Cypress", "Jest"],
  "Security Engineer": ["Burp Suite", "Wireshark", "Nmap", "Kali Linux", "OWASP"],
  "Embedded Engineer": ["Embedded C", "ARM", "RTOS", "Altium Designer", "Arduino"],
  "Game Developer": ["Unity", "Unreal Engine", "C#", "Blender"],
  "Software Architect": ["System Design", "Microservices", "Kubernetes", "AWS", "PostgreSQL"],
  "Tech Lead": ["System Design", "Code Review", "Git", "Agile", "Mentoring"],
  "Engineering Manager": ["Agile", "Jira", "OKR", "Hiring", "Performance Review"],
  CTO: ["System Design", "Cloud Architecture", "Hiring", "Product Strategy", "OKR"],

  // داده و هوش مصنوعی
  "Data Scientist": ["Python", "Pandas", "scikit-learn", "SQL", "Jupyter", "Statistics"],
  "Data Analyst": ["SQL", "Power BI", "Tableau", "Excel", "Python"],
  "Data Engineer": ["SQL", "Spark", "Airflow", "dbt", "Kafka", "Python"],
  "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "MLflow", "Docker"],
  "AI Engineer": ["Python", "PyTorch", "Hugging Face", "LangChain", "LLM", "Vector Database"],
  "MLOps Engineer": ["MLflow", "Kubernetes", "Docker", "Airflow", "AWS SageMaker"],
  "AI Research Scientist": ["PyTorch", "Python", "Mathematics", "Hugging Face", "Paper Writing"],

  // محصول و طراحی
  "Product Manager": ["Jira", "Figma", "Amplitude", "Scrum", "Roadmap", "A/B Testing"],
  "Product Designer": ["Figma", "Prototyping", "Design System", "User Research"],
  "UX/UI Designer": ["Figma", "Adobe XD", "Sketch", "Prototyping", "Design System"],
  "UX Researcher": ["User Interview", "Usability Testing", "Maze", "Hotjar"],

  // کسب‌وکار
  "Project Manager": ["Primavera P6", "MS Project", "Jira", "Scrum", "PMBOK", "Risk Management"],
  "Business Analyst": ["SQL", "Excel", "BPMN", "Power BI", "Requirement Analysis"],
  "Scrum Master": ["Scrum", "Jira", "Kanban", "Agile", "Retrospective"],
  "Marketing Manager": ["Google Analytics", "SEO", "Content Strategy", "Meta Ads"],
  "Digital Marketing Specialist": ["Google Ads", "Google Analytics", "SEO", "Meta Ads", "Mailchimp"],
  "Sales Manager": ["CRM", "HubSpot", "Salesforce", "Negotiation"],
  "Financial Manager": ["Excel", "SAP", "Power BI", "Financial Modeling"],
  Accountant: ["Excel", "SAP", "همکاران سیستم", "سپیدار", "گزارشگری مالی"],
  "HR Manager": ["ATS", "LinkedIn Recruiter", "Excel", "Performance Review"],

  // صنعت و مهندسی
  "Mechanical Engineer": ["AutoCAD", "SolidWorks", "ANSYS", "CATIA", "Inventor"],
  "Electrical Engineer": ["ETAP", "MATLAB", "AutoCAD", "PLC", "SCADA"],
  "Civil Engineer": ["AutoCAD", "ETABS", "SAP2000", "SAFE", "Revit"],
  "Chemical Engineer": ["Aspen HYSYS", "Aspen Plus", "HTRI", "MATLAB"],
  "Process Engineer": ["Aspen HYSYS", "HTRI", "PFD و P&ID", "Aspen Plus"],
  "Static Equipment Engineer": ["PV Elite", "ASME VIII", "API 650", "API 653", "AutoCAD", "Caesar II"],
  "Piping Engineer": ["Caesar II", "AutoPIPE", "ASME B31.3", "SP3D", "AutoCAD"],
  "Petroleum Engineer": ["Petrel", "Eclipse", "PIPESIM", "MATLAB"],
  "Robotics Engineer": ["ROS", "Python", "C++", "MATLAB", "Simulink", "Computer Vision"],
  "Mechatronics Engineer": ["MATLAB", "Simulink", "PLC", "SolidWorks", "Arduino", "Control Systems"],
  "HSE Engineer": ["HAZOP", "ISO 45001", "Risk Assessment", "PHA"],
  Architect: ["AutoCAD", "Revit", "SketchUp", "3ds Max", "Lumion"],
};

/** Broader fallback, for a title written freehand or left blank. */
const BY_FIELD: Record<string, string[]> = {
  "نفت و گاز": ["AutoCAD", "PV Elite", "ASME VIII", "API 650", "Caesar II", "Aspen HYSYS"],
  پتروشیمی: ["Aspen HYSYS", "Aspen Plus", "HTRI", "PV Elite", "AutoCAD"],
  "مهندسی شیمی": ["Aspen HYSYS", "Aspen Plus", "HTRI", "MATLAB"],
  "مهندسی مکانیک": ["AutoCAD", "SolidWorks", "ANSYS", "CATIA"],
  "مهندسی برق": ["ETAP", "MATLAB", "AutoCAD", "PLC", "SCADA"],
  "مهندسی عمران": ["AutoCAD", "ETABS", "SAP2000", "Revit"],
  "انرژی و تجدیدپذیر": ["PVsyst", "HOMER", "MATLAB", "AutoCAD"],
  برنامه‌نویسی: ["Python", "JavaScript", "TypeScript", "Git", "SQL"],
  "توسعه نرم‌افزار": ["Python", "JavaScript", "TypeScript", "Git", "Docker", "SQL"],
  "توسعه وب": ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS"],
  "توسعه موبایل": ["Swift", "Kotlin", "Flutter", "React Native"],
  "معماری نرم‌افزار": ["System Design", "Microservices", "Kubernetes", "AWS"],
  "دواپس و زیرساخت": ["Docker", "Kubernetes", "Terraform", "Linux", "CI/CD"],
  "رایانش ابری": ["AWS", "Azure", "Google Cloud", "Kubernetes", "Terraform"],
  "تست و تضمین کیفیت": ["Selenium", "Playwright", "Postman", "Cypress"],
  "امنیت سایبری": ["Burp Suite", "Wireshark", "Kali Linux", "Nmap"],
  بازی‌سازی: ["Unity", "Unreal Engine", "C#", "Blender"],
  "اینترنت اشیا": ["Arduino", "Raspberry Pi", "MQTT", "Embedded C"],
  بلاک‌چین: ["Solidity", "Ethereum", "Web3.js"],
  "هوش مصنوعی": ["Python", "PyTorch", "TensorFlow", "Hugging Face", "LangChain"],
  "یادگیری ماشین": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "MLflow"],
  "علم داده": ["Python", "Pandas", "scikit-learn", "SQL", "Jupyter"],
  "مهندسی داده": ["SQL", "Spark", "Airflow", "dbt", "Kafka"],
  "داده و تحلیل": ["SQL", "Power BI", "Tableau", "Excel", "Python"],
  "پردازش زبان طبیعی": ["Python", "Hugging Face", "spaCy", "PyTorch"],
  "بینایی ماشین": ["Python", "OpenCV", "PyTorch", "YOLO"],
  "مدیریت محصول": ["Jira", "Figma", "Amplitude", "Scrum"],
  "طراحی UX/UI": ["Figma", "Adobe XD", "Sketch", "Prototyping"],
  "تحقیق کاربر": ["User Interview", "Maze", "Hotjar", "Google Analytics"],
  "مدیریت پروژه": ["Primavera P6", "MS Project", "Jira", "Scrum", "PMBOK"],
  "بازاریابی دیجیتال": ["Google Analytics", "Google Ads", "SEO", "Meta Ads"],
  فروش: ["CRM", "HubSpot", "Salesforce"],
  "رشد کسب‌وکار": ["Google Analytics", "SQL", "A/B Testing"],
  "مدیریت مالی": ["Excel", "SAP", "Power BI"],
  "منابع انسانی": ["ATS", "LinkedIn Recruiter", "Excel"],
};

/**
 * Suggestions for one person: their title's tools first, then anything their
 * field adds. Order matters — the first few are all most people read.
 */
export function skillsFor(title: string, fields: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (list: string[] | undefined) => {
    for (const skill of list ?? []) {
      if (seen.has(skill)) continue;
      seen.add(skill);
      out.push(skill);
    }
  };

  push(BY_TITLE[canonicalTitle(title) ?? ""]);
  for (const field of fields) push(BY_FIELD[field]);
  return out;
}

/** Everything known, for a profile with neither a title nor a field yet. */
export const ALL_SKILLS: string[] = [
  ...new Set([...Object.values(BY_TITLE).flat(), ...Object.values(BY_FIELD).flat()]),
];

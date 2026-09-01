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
 * ثابت gets PV Elite and API 650 because of the title, not because of
 * نفت و گاز; someone who wrote their title freehand still gets the field's
 * list rather than nothing.
 *
 * Every key here is an English title from lib/job-titles.ts, and a test keeps
 * the two in step.
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
  "Web Developer": ["JavaScript", "HTML/CSS", "React", "PHP", "WordPress", "REST API"],
  "Mobile Developer": ["Flutter", "React Native", "Swift", "Kotlin", "Firebase"],
  "Android Developer": ["Kotlin", "Java", "Jetpack Compose", "Android SDK", "Firebase"],
  "iOS Developer": ["Swift", "SwiftUI", "Xcode", "UIKit", "Core Data"],
  "Python Developer": ["Python", "Django", "FastAPI", "Flask", "PostgreSQL", "Celery"],
  "Java Developer": ["Java", "Spring Boot", "Hibernate", "Maven", "PostgreSQL"],
  ".NET Developer": ["C#", "ASP.NET Core", "Entity Framework", "SQL Server", "Azure"],
  "Node.js Developer": ["Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "REST API"],
  "React Developer": ["React", "TypeScript", "Next.js", "Redux", "Tailwind CSS"],
  "PHP Developer": ["PHP", "Laravel", "MySQL", "REST API", "Composer"],
  "Go Developer": ["Go", "gRPC", "PostgreSQL", "Docker", "Kubernetes"],
  "WordPress Developer": ["WordPress", "PHP", "Elementor", "WooCommerce", "MySQL"],
  "Blockchain Developer": ["Solidity", "Ethereum", "Web3.js", "Hardhat", "Smart Contract"],
  "Game Developer": ["Unity", "Unreal Engine", "C#", "Blender", "Game Design"],
  "Embedded Engineer": ["Embedded C", "ARM", "RTOS", "Altium Designer", "Arduino"],
  "QA Engineer": ["Selenium", "Playwright", "Postman", "Cypress", "Jest"],
  "DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Ansible"],
  "Site Reliability Engineer": ["Kubernetes", "Prometheus", "Grafana", "Linux", "Terraform"],
  "Cloud Engineer": ["AWS", "Azure", "Terraform", "Kubernetes", "Linux"],
  "Platform Engineer": ["Kubernetes", "Terraform", "CI/CD", "Go", "Observability"],
  "Security Engineer": ["Burp Suite", "Wireshark", "Nmap", "Kali Linux", "OWASP"],
  "Network Engineer": ["Cisco IOS", "TCP/IP", "BGP", "MikroTik", "Wireshark", "VPN"],
  "Database Administrator": ["PostgreSQL", "SQL Server", "Oracle", "MySQL", "Backup و Recovery"],
  "Software Architect": ["System Design", "Microservices", "Kubernetes", "AWS", "PostgreSQL"],
  "Solutions Architect": ["AWS", "System Design", "Azure", "Microservices", "Pre-sales"],

  // داده و هوش مصنوعی
  "Data Scientist": ["Python", "Pandas", "scikit-learn", "SQL", "Jupyter", "Statistics"],
  "Data Analyst": ["SQL", "Power BI", "Tableau", "Excel", "Python"],
  "Data Engineer": ["SQL", "Spark", "Airflow", "dbt", "Kafka", "Python"],
  "Analytics Engineer": ["dbt", "SQL", "Snowflake", "Looker", "Python"],
  "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "MLflow", "Docker"],
  "AI Engineer": ["Python", "PyTorch", "Hugging Face", "LangChain", "LLM", "Vector Database"],
  "MLOps Engineer": ["MLflow", "Kubernetes", "Docker", "Airflow", "AWS SageMaker"],
  "AI Research Scientist": ["PyTorch", "Python", "Mathematics", "Hugging Face", "Paper Writing"],
  "Computer Vision Engineer": ["OpenCV", "PyTorch", "YOLO", "Python", "CUDA"],
  "NLP Engineer": ["Hugging Face", "spaCy", "PyTorch", "Python", "LLM"],
  "Generative AI Engineer": ["LLM", "LangChain", "RAG", "Hugging Face", "Prompt Engineering", "Vector Database"],
  "Business Intelligence Analyst": ["Power BI", "SQL", "Tableau", "Excel", "DAX", "Data Modeling"],
  "BI Developer": ["Power BI", "SQL", "Tableau", "DAX", "ETL"],

  // محصول و طراحی
  "Product Manager": ["Jira", "Figma", "Amplitude", "Scrum", "Roadmap", "A/B Testing"],
  "Product Owner": ["Scrum", "Jira", "User Story", "Backlog", "Agile"],
  "Technical Product Manager": ["Jira", "SQL", "REST API", "Roadmap", "System Design"],
  "Product Designer": ["Figma", "Prototyping", "Design System", "User Research"],
  "UX/UI Designer": ["Figma", "Adobe XD", "Sketch", "Prototyping", "Design System"],
  "UX Researcher": ["User Interview", "Usability Testing", "Maze", "Hotjar"],
  "Graphic Designer": ["Adobe Illustrator", "Adobe Photoshop", "InDesign", "Figma"],
  "Motion Designer": ["After Effects", "Cinema 4D", "Premiere Pro", "Lottie"],
  "Brand Designer": ["Adobe Illustrator", "Figma", "Brand Guideline", "Typography"],
  "Design Lead": ["Figma", "Design System", "Design Critique", "Mentoring"],

  // بازاریابی و فروش
  "Marketing Manager": ["Google Analytics", "SEO", "Content Strategy", "Meta Ads"],
  "Digital Marketing Specialist": ["Google Ads", "Google Analytics", "SEO", "Meta Ads", "Mailchimp"],
  "SEO Specialist": ["Google Search Console", "Ahrefs", "Semrush", "Google Analytics", "Technical SEO"],
  "Content Marketer": ["Content Strategy", "SEO", "Copywriting", "Google Analytics"],
  "Social Media Manager": ["Instagram", "Meta Ads", "Content Calendar", "Canva"],
  "Growth Marketer": ["Google Analytics", "A/B Testing", "SQL", "Funnel Analysis"],
  "Performance Marketing Specialist": ["Google Ads", "Meta Ads", "Google Analytics", "Conversion Tracking"],
  "Brand Manager": ["Brand Strategy", "Market Research", "Content Strategy"],
  "Sales Manager": ["CRM", "HubSpot", "Salesforce", "Negotiation", "Forecasting"],
  "Account Manager": ["CRM", "Negotiation", "Upselling", "Reporting"],
  "Business Development Manager": ["CRM", "Negotiation", "Market Research", "Partnership"],
  "Customer Success Manager": ["CRM", "Onboarding", "Churn Analysis", "HubSpot"],

  // کسب‌وکار، مالی و عملیات
  "Business Analyst": ["SQL", "Excel", "BPMN", "Power BI", "Requirement Analysis"],
  "Financial Analyst": ["Excel", "Financial Modeling", "Power BI", "Valuation"],
  "Financial Manager": ["Excel", "SAP", "Power BI", "Financial Modeling", "Budgeting"],
  "Investment Analyst": ["Financial Modeling", "Valuation", "Excel", "Market Research"],
  Accountant: ["Excel", "همکاران سیستم", "سپیدار", "گزارشگری مالی", "SAP"],
  Auditor: ["Excel", "استانداردهای حسابرسی", "گزارشگری مالی", "Internal Control"],
  "Operations Manager": ["Excel", "Process Improvement", "KPI", "ERP"],
  "Supply Chain Manager": ["SAP", "Excel", "Inventory Planning", "Logistics"],
  "Project Manager": ["Primavera P6", "MS Project", "Jira", "Scrum", "PMBOK", "Risk Management"],
  "Program Manager": ["Jira", "MS Project", "Stakeholder Management", "OKR"],
  "Scrum Master": ["Scrum", "Jira", "Kanban", "Agile", "Retrospective"],

  // منابع انسانی
  "HR Manager": ["ATS", "LinkedIn Recruiter", "Excel", "Performance Review"],
  Recruiter: ["LinkedIn Recruiter", "ATS", "Interviewing", "Sourcing"],
  "Talent Acquisition Specialist": ["LinkedIn Recruiter", "ATS", "Sourcing", "Employer Branding"],
  "HR Business Partner": ["Performance Review", "OKR", "Employee Relations", "Excel"],

  // نقش‌های ارشد — زیر همان حوزه‌ای که رهبری می‌کنند
  "Tech Lead": ["System Design", "Code Review", "Git", "Agile", "Mentoring"],
  "Engineering Manager": ["Agile", "Jira", "OKR", "Hiring", "Performance Review"],
  "VP of Engineering": ["OKR", "Hiring", "System Design", "Budgeting", "Org Design"],
  CTO: ["System Design", "Cloud Architecture", "Hiring", "Product Strategy", "OKR"],
  CPO: ["Product Strategy", "Roadmap", "OKR", "Analytics"],
  COO: ["Process Improvement", "KPI", "Budgeting", "Org Design"],
  CEO: ["Fundraising", "Product Strategy", "Hiring", "OKR"],
  Founder: ["Fundraising", "Pitch Deck", "Product Strategy", "Hiring", "MVP"],

  // محتوا
  "Content Writer": ["Copywriting", "SEO", "Content Strategy", "Editing"],
  "Technical Writer": ["Markdown", "Docs as Code", "API Documentation", "Git"],

  // نفت، گاز و پتروشیمی — و عمران و ساختمان
  "Mechanical Engineer": ["AutoCAD", "SolidWorks", "ANSYS", "CATIA", "Inventor"],
  "Electrical Engineer": ["ETAP", "MATLAB", "AutoCAD", "PLC", "SCADA"],
  "Civil Engineer": ["AutoCAD", "ETABS", "SAP2000", "SAFE", "Revit"],
  "Structural Engineer": ["ETABS", "SAP2000", "STAAD.Pro", "Tekla", "AutoCAD"],
  "Chemical Engineer": ["Aspen HYSYS", "Aspen Plus", "HTRI", "MATLAB"],
  "Process Engineer": ["Aspen HYSYS", "HTRI", "PFD و P&ID", "Aspen Plus", "Flarenet"],
  "Static Equipment Engineer": ["PV Elite", "ASME VIII", "API 650", "API 653", "AutoCAD", "Caesar II"],
  "Rotating Equipment Engineer": ["API 610", "API 617", "Vibration Analysis", "AutoCAD", "ANSYS"],
  "Piping Engineer": ["Caesar II", "AutoPIPE", "ASME B31.3", "SP3D", "AutoCAD"],
  "Pipeline Engineer": ["ASME B31.4", "ASME B31.8", "Caesar II", "PIPESIM", "AutoCAD"],
  "Instrumentation Engineer": ["PLC", "DCS", "SCADA", "SIL", "P&ID"],
  "Petroleum Engineer": ["Petrel", "Eclipse", "PIPESIM", "MATLAB"],
  "Drilling Engineer": ["WellPlan", "Compass", "Drilling Fluids", "Well Control"],
  "Reservoir Engineer": ["Eclipse", "Petrel", "CMG", "MBAL"],
  "Production Engineer": ["PIPESIM", "Prosper", "Well Testing", "Artificial Lift"],
  "Corrosion Engineer": ["NACE", "Cathodic Protection", "Coating", "Material Selection"],
  "Welding Engineer": ["AWS D1.1", "ASME IX", "WPS و PQR", "NDT"],
  "Inspection Engineer": ["API 510", "API 570", "API 653", "NDT", "ASNT"],
  "Commissioning Engineer": ["Pre-commissioning", "Loop Test", "Punch List", "P&ID"],
  "Planning Engineer": ["Primavera P6", "MS Project", "Earned Value", "Excel"],
  "Materials Engineer": ["Material Selection", "Metallurgy", "ASTM", "Failure Analysis"],
  "HSE Engineer": ["HAZOP", "ISO 45001", "Risk Assessment", "PHA", "JSA"],
  Architect: ["AutoCAD", "Revit", "SketchUp", "3ds Max", "Lumion"],

  // تولید و ساخت
  "Manufacturing Engineer": ["Lean Manufacturing", "AutoCAD", "SolidWorks", "APQP", "Six Sigma", "ERP"],
  "Mechanical Design Engineer": ["SolidWorks", "CATIA", "AutoCAD", "ANSYS", "GD&T", "Inventor"],
  "Product Development Engineer": ["SolidWorks", "CATIA", "DFM و DFA", "Prototyping", "APQP", "GD&T"],
  "Industrial Engineer": ["Lean Manufacturing", "Six Sigma", "Arena", "Excel", "ERP", "Time Study"],
  "Automation Engineer": ["PLC", "SCADA", "HMI", "Siemens TIA Portal", "Ladder Logic", "Industrial Robot"],
  "Robotics Engineer": ["ROS", "Python", "C++", "MATLAB", "Simulink", "Computer Vision"],
  "Mechatronics Engineer": ["MATLAB", "Simulink", "PLC", "SolidWorks", "Arduino", "Control Systems"],
  "Quality Engineer": ["ISO 9001", "SPC", "FMEA", "Six Sigma", "APQP و PPAP", "Minitab"],
  "Reliability Engineer": ["RCM", "FMEA", "Root Cause Analysis", "CMMS", "Weibull Analysis", "Vibration Analysis"],
  "Automotive Engineer": ["CATIA", "IATF 16949", "GD&T", "ANSYS", "CAN Bus", "APQP"],
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

/** Titles that carry their own tools — exported so a test can check coverage. */
export const TITLES_WITH_SKILLS = Object.keys(BY_TITLE);

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

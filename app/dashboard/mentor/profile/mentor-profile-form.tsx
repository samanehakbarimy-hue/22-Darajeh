"use client";

import { useActionState, useState } from "react";
import { saveMentorProfile } from "@/lib/actions/mentor";
import Spinner from "@/components/Spinner";
import { SENIORITY_LEVELS } from "@/lib/seniority";
import { skillsForFields, ALL_SKILLS } from "@/lib/skills";

// Only fields this site is actually for — no medicine, insurance or tourism,
// because nobody here works in them and offering them tells a visitor the site
// is something it is not.
//
// Fields only. Tools live in lib/skills.ts and have their own input — Python
// is not the same kind of answer as نفت و گاز, and putting them in one list
// forced a specialist to choose which of the two questions to answer.
//
// Deep on software, data and AI on purpose. That is where the sites this one
// is compared to live, and where the questions are; a marketplace that cannot
// name یادگیری ماشین or مهندسی داده is not serving the people most likely to
// ask. Depth is free now that suggestions only appear while someone is typing.
//
// A field that is missing can still be typed, and is saved as written.
const SUGGESTED_TAGS = [
  // نرم‌افزار
  "برنامه‌نویسی",
  "توسعه نرم‌افزار",
  "توسعه وب",
  "توسعه موبایل",
  "معماری نرم‌افزار",
  "دواپس و زیرساخت",
  "رایانش ابری",
  "تست و تضمین کیفیت",
  "امنیت سایبری",
  "بازی‌سازی",
  "اینترنت اشیا",
  "بلاک‌چین",
  // داده و هوش مصنوعی
  "هوش مصنوعی",
  "یادگیری ماشین",
  "علم داده",
  "مهندسی داده",
  "داده و تحلیل",
  "پردازش زبان طبیعی",
  "بینایی ماشین",
  // محصول و طراحی
  "مدیریت محصول",
  "طراحی UX/UI",
  "تحقیق کاربر",
  // کسب‌وکار
  "مدیریت پروژه",
  "بازاریابی دیجیتال",
  "فروش",
  "رشد کسب‌وکار",
  "کارآفرینی",
  "مدیریت مالی",
  "منابع انسانی",
  // صنعت و مهندسی
  "نفت و گاز",
  "پتروشیمی",
  "مهندسی مکانیک",
  "مهندسی برق",
  "مهندسی عمران",
  "مهندسی شیمی",
  "انرژی و تجدیدپذیر",
  // مسیر شغلی
  "رزومه و مصاحبه",
  "مسیر شغلی",
  "مهاجرت کاری",
  "مهاجرت تحصیلی",
];

// Both languages are offered, because an Iranian engineer routinely writes the
// English title professionally — this profile said "Senior Mechanical Engineer"
// on a Persian page. Each is searchable by the other, so "mech" and «مکانیک»
// reach the same job, and whichever is clicked is the one that shows.
const JOB_TITLE_PAIRS: [string, string][] = [
  // نرم‌افزار
  ["مهندس نرم‌افزار", "Software Engineer"],
  ["توسعه‌دهنده فرانت‌اند", "Frontend Developer"],
  ["توسعه‌دهنده بک‌اند", "Backend Developer"],
  ["توسعه‌دهنده فول‌استک", "Full Stack Developer"],
  ["توسعه‌دهنده موبایل", "Mobile Developer"],
  ["توسعه‌دهنده پایتون", "Python Developer"],
  ["توسعه‌دهنده جاوا", "Java Developer"],
  ["توسعه‌دهنده دات‌نت", ".NET Developer"],
  ["توسعه‌دهنده اندروید", "Android Developer"],
  ["توسعه‌دهنده iOS", "iOS Developer"],
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
  ["مهندس HSE", "HSE Engineer"],
  ["معمار", "Architect"],
];

const JOB_TITLES = JOB_TITLE_PAIRS.flatMap(([fa, en]) => [
  { label: fa, alt: en },
  { label: en, alt: fa },
]);

const MAX_PHOTO_MB = 3;

const FIELD_CLASS =
  "w-full rounded-lg border border-card-border bg-background px-4 py-2.5 outline-none transition focus:border-brand-deep focus:ring-2 focus:ring-brand/20";

function parseTags(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-card-border bg-card p-6">
      <h2 className="font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function MentorProfileForm({
  initialPhotoUrl,
  initialHeadline,
  initialCompany,
  initialCountry,
  initialBio,
  initialTags,
  initialSkills,
  initialLinkedin,
  initialMeetingLink,
  initialPhone,
  initialSeniority,
  googleConnected,
}: {
  initialPhotoUrl: string;
  initialHeadline: string;
  initialCompany: string;
  initialCountry: string;
  initialBio: string;
  initialTags: string;
  initialSkills: string;
  initialLinkedin: string;
  initialMeetingLink: string;
  initialPhone: string;
  initialSeniority: string;
  /** Connected specialists get a link per booking and need no fallback. */
  googleConnected: boolean;
}) {
  const [state, action, pending] = useActionState(saveMentorProfile, undefined);
  const [preview, setPreview] = useState(initialPhotoUrl);
  const [photoError, setPhotoError] = useState("");
  const [photoName, setPhotoName] = useState("");

  // Controlled so nothing typed is lost when the form re-renders after saving.
  const [headline, setHeadline] = useState(initialHeadline);
  const [company, setCompany] = useState(initialCompany);
  const [country, setCountry] = useState(initialCountry);
  const [bio, setBio] = useState(initialBio);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink);
  const [phone, setPhone] = useState(initialPhone);
  const [seniority, setSeniority] = useState(initialSeniority);

  const [tags, setTags] = useState<string[]>(parseTags(initialTags));
  const [draft, setDraft] = useState("");

  const [skills, setSkills] = useState<string[]>(parseTags(initialSkills));
  const [skillDraft, setSkillDraft] = useState("");

  // Suggestions follow the fields already chosen, so a static equipment
  // engineer is offered PV Elite and never React. Before any field is picked
  // there is nothing to narrow by, so everything is searchable.
  const skillPool = tags.length ? skillsForFields(tags) : ALL_SKILLS;
  const skillQuery = skillDraft.trim().toLowerCase();
  const skillMatches = (
    skillQuery
      ? skillPool.filter((skill) => skill.toLowerCase().includes(skillQuery))
      : skillPool
  )
    .filter((skill) => !skills.includes(skill))
    .slice(0, 10);

  function addSkill(value: string) {
    const clean = value.trim();
    if (!clean || skills.includes(clean)) return;
    setSkills([...skills, clean]);
    setSkillDraft("");
  }

  function removeSkill(value: string) {
    setSkills(skills.filter((s) => s !== value));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "،") {
      e.preventDefault();
      addSkill(skillDraft);
    } else if (e.key === "Backspace" && skillDraft === "" && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  }

  const query = draft.trim().toLowerCase();
  // Only while they are typing. Showing the whole list by default put a wall
  // of thirty chips under the field and read as clutter; showing the first
  // eight of it, as this once did, was worse — a mechanical engineer was
  // offered nothing but software and added a single tag.
  const matches = query
    ? SUGGESTED_TAGS.filter(
        (tag) => !tags.includes(tag) && tag.toLowerCase().includes(query),
      ).slice(0, 8)
    : [];

  const titleQuery = headline.trim().toLowerCase();
  const titleMatches =
    titleQuery.length < 2
      ? []
      : JOB_TITLES.filter(
          (title) =>
            title.label.toLowerCase() !== titleQuery &&
            (title.label.toLowerCase().includes(titleQuery) ||
              title.alt.toLowerCase().includes(titleQuery)),
        ).slice(0, 6);

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    setTags([...tags, clean]);
    setDraft("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "،") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`حجم عکس باید کمتر از ${MAX_PHOTO_MB} مگابایت باشد.`);
      e.target.value = "";
      return;
    }

    setPhotoError("");
    setPhotoName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <Section
        title="معرفی"
        description="این بخش روی پروفایل عمومی تو نمایش داده می‌شه."
      >
        <div className="flex items-center gap-5">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-24 w-24 shrink-0 rounded-full border border-card-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dashed border-card-border text-3xl text-muted">
              ؟
            </div>
          )}

          <div className="min-w-0">
            {/* The native file input shows English browser text ("No file
                chosen"), so it is hidden and driven by this label instead. */}
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="sr-only"
            />
            <label
              htmlFor="photo"
              className="inline-block cursor-pointer rounded-full bg-brand-light px-5 py-2 text-sm font-medium text-brand-deep transition hover:bg-brand hover:text-brand-on"
            >
              {preview ? "تغییر عکس" : "انتخاب عکس"}
            </label>
            <p className="mt-2 truncate text-xs text-muted">
              {photoName
                ? photoName
                : `عکس واضح از صورت، کمتر از ${MAX_PHOTO_MB} مگابایت`}
            </p>
          </div>
        </div>
        {photoError && <p className="text-sm text-danger">{photoError}</p>}

        <div>
          <label htmlFor="headline" className="mb-1.5 block text-sm font-medium">
            سمت فعلی
          </label>
          <input
            id="headline"
            name="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="مثلاً «مدیر ارشد پروژه»"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {titleMatches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {titleMatches.map((title) => (
                <button
                  key={title.label}
                  type="button"
                  onClick={() => setHeadline(title.label)}
                  className="rounded-full border border-card-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand-deep"
                >
                  {title.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium">
            کجا کار می‌کنی؟{" "}
            <span className="text-xs font-normal text-muted">(اختیاری)</span>
          </label>
          <input
            id="company"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={80}
            placeholder="مثلاً «پتروپارس»"
            className={FIELD_CLASS}
          />
          <p className="mt-1.5 text-xs leading-6 text-muted">
            کنار سمتت روی پروفایل نوشته می‌شود. برای خیلی‌ها همین جای کار است
            که نشان می‌دهد با چه کسی طرف‌اند.
          </p>
        </div>

        <div>
          <label
            htmlFor="tag_draft"
            className="mb-1.5 block text-sm font-medium"
          >
            حوزه‌های تخصص
          </label>
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand-deep"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`حذف ${tag}`}
                  className="text-brand-deep/60 transition hover:text-brand-deep"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          id="tag_draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="مثلاً «نفت و گاز»"
          className={FIELD_CLASS}
        />
        {/* The real value the server reads. */}
        <input type="hidden" name="expertise_tags" value={tags.join("، ")} />

        {matches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {matches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-card-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand-deep"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}

        {draft.trim() && !SUGGESTED_TAGS.includes(draft.trim()) && (
          <button
            type="button"
            onClick={() => addTag(draft)}
            className="mt-3 text-xs text-brand-deep hover:underline"
          >
            افزودن «{draft.trim()}» به‌عنوان تخصص جدید
          </button>
        )}
          <p className="mt-1.5 text-xs leading-6 text-muted">
            متقاضی‌ها با همین حوزه‌ها تو رو پیدا می‌کنن.
          </p>
        </div>

        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
            کشور محل زندگی
          </label>
          <input
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="مثلاً «ایران» یا «آلمان»"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            چقدر تجربه داری؟
          </span>
          {/* Shown to seekers, and what a price suggestion scales from
              when this specialist adds a paid service. */}
          <input type="hidden" name="seniority" value={seniority} />
          <div className="flex flex-wrap gap-2">
            {SENIORITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setSeniority(seniority === level.value ? "" : level.value)
                }
                aria-pressed={seniority === level.value}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  seniority === level.value
                    ? "border-brand bg-brand-light text-brand-deep"
                    : "border-card-border text-muted hover:border-brand hover:text-brand-deep"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
            معرفی کوتاه
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="در چند خط بنویس چه تجربه‌ای داری و توی این ۲۲ دقیقه می‌تونی به چه کسی کمک کنی."
            className={FIELD_CLASS}
          />
        </div>
      </Section>

      <Section
        title="مهارت‌ها و ابزارها"
        description="چیزهایی که باهاشان کار می‌کنی. متقاضی‌ها معمولاً دنبال همین‌اند، نه فقط عنوان حوزه."
      >
        <div>
          {skills.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-xs text-brand-deep"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`حذف ${skill}`}
                    className="text-sm leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <input
            id="skill_draft"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder={
              tags.length
                ? `مثلاً «${skillPool[0] ?? "AutoCAD"}»`
                : "اول حوزه‌ات را انتخاب کن تا پیشنهادها دقیق‌تر شوند"
            }
            className={FIELD_CLASS}
            autoComplete="off"
          />
          <input type="hidden" name="skills" value={skills.join("، ")} />

          {skillMatches.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skillMatches.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="rounded-full border border-card-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand-deep"
                >
                  + {skill}
                </button>
              ))}
            </div>
          )}

          {skillDraft.trim() && !skillPool.includes(skillDraft.trim()) && (
            <button
              type="button"
              onClick={() => addSkill(skillDraft)}
              className="mt-3 text-xs text-brand-deep hover:underline"
            >
              افزودن «{skillDraft.trim()}»
            </button>
          )}
        </div>
      </Section>

      <Section
        title="راه‌های ارتباطی"
        description="شماره تماست پیش ما می‌مونه و به کسی نشون داده نمی‌شه. لینک جلسه فقط بعد از رزرو، به همون متقاضی نشون داده می‌شه."
      >
        <div>
          <label
            htmlFor="linkedin_url"
            className="mb-1.5 block text-sm font-medium"
          >
            لینک لینکدین
            <span className="mr-1 text-xs font-normal text-muted">
              (روی پروفایل عمومی دیده می‌شه)
            </span>
          </label>
          <input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            dir="ltr"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className={`${FIELD_CLASS} text-left`}
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
            شماره تماس
            <span className="mr-1 text-xs font-normal text-muted">
              (خصوصی)
            </span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09123456789"
            className={`${FIELD_CLASS} text-left`}
          />
        </div>

        <div>
          <label
            htmlFor="meeting_link"
            className="mb-1.5 block text-sm font-medium"
          >
            لینک جلسه آنلاین
            <span className="mr-1 text-xs font-normal text-muted">
              (فقط برای کسی که رزرو کرده)
            </span>
          </label>
          <input
            id="meeting_link"
            name="meeting_link"
            type="url"
            dir="ltr"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            required={!googleConnected}
            placeholder="https://meet.google.com/..."
            className={`${FIELD_CLASS} text-left`}
          />
          <p className="mt-1.5 text-xs leading-6 text-muted">
            {googleConnected
              ? "لازم نیست پرش کنی — حساب گوگلت وصل است و برای هر جلسه لینک جدا ساخته می‌شود. اگر اینجا هم لینکی بگذاری، فقط وقتی استفاده می‌شود که ساختن خودکار به مشکل بخورد."
              : "یک لینک ثابت Google Meet بساز و همین‌جا بگذار، یا حساب گوگلت را وصل کن تا لینک‌ها خودکار ساخته شوند. بدون یکی از این دو، کسی که وقتت را رزرو کرده جایی برای آمدن ندارد."}
          </p>
        </div>
      </Section>

      {state?.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand-deep">
          پروفایلت ذخیره شد.
        </p>
      )}

      <button
        disabled={pending}
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-brand-on transition hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال ذخیره..." : "ذخیره پروفایل"}
      </button>
    </form>
  );
}

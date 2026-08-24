"use client";

import { useActionState, useState } from "react";
import { saveMentorProfile } from "@/lib/actions/mentor";
import Spinner from "@/components/Spinner";
import { SENIORITY_LEVELS } from "@/lib/seniority";

const SUGGESTED_TAGS = [
  // فناوری
  "توسعه نرم‌افزار",
  "طراحی UX/UI",
  "داده و تحلیل",
  "هوش مصنوعی",
  "امنیت سایبری",
  "شبکه و زیرساخت",
  // کسب‌وکار
  "مدیریت محصول",
  "مدیریت پروژه",
  "بازاریابی دیجیتال",
  "فروش",
  "رشد کسب‌وکار",
  "کارآفرینی",
  "مدیریت مالی",
  "حسابداری",
  "منابع انسانی",
  "لجستیک و زنجیره تأمین",
  // صنعت و مهندسی
  "نفت و گاز",
  "پتروشیمی",
  "مهندسی مکانیک",
  "مهندسی برق",
  "مهندسی عمران",
  "معماری",
  "ساختمان و املاک",
  "انرژی و تجدیدپذیر",
  "کشاورزی",
  "صنایع غذایی",
  // سلامت و علوم
  "پزشکی و سلامت",
  "پرستاری",
  "داروسازی",
  "روان‌شناسی",
  "زیست‌فناوری",
  // خدمات و سایر
  "حقوق",
  "آموزش و تدریس",
  "ترجمه و محتوا",
  "رسانه و تولید محتوا",
  "گردشگری",
  "بیمه",
  "بانکداری",
  // مسیر شغلی
  "مهاجرت تحصیلی",
  "مهاجرت کاری",
  "رزومه و مصاحبه",
  "مسیر شغلی",
];

const MAX_PHOTO_MB = 3;

const FIELD_CLASS =
  "w-full rounded-lg border border-card-border bg-background px-4 py-2.5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

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
  initialCountry,
  initialBio,
  initialTags,
  initialLinkedin,
  initialMeetingLink,
  initialPhone,
  initialSeniority,
  googleConnected,
}: {
  initialPhotoUrl: string;
  initialHeadline: string;
  initialCountry: string;
  initialBio: string;
  initialTags: string;
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
  const [country, setCountry] = useState(initialCountry);
  const [bio, setBio] = useState(initialBio);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink);
  const [phone, setPhone] = useState(initialPhone);
  const [seniority, setSeniority] = useState(initialSeniority);

  const [tags, setTags] = useState<string[]>(parseTags(initialTags));
  const [draft, setDraft] = useState("");

  const query = draft.trim().toLowerCase();
  const matches = SUGGESTED_TAGS.filter(
    (tag) => !tags.includes(tag) && tag.toLowerCase().includes(query),
  ).slice(0, 8);

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
              className="inline-block cursor-pointer rounded-full bg-brand-light px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand hover:text-background"
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
        {photoError && <p className="text-sm text-red-400">{photoError}</p>}

        <div>
          <label htmlFor="headline" className="mb-1.5 block text-sm font-medium">
            سمت فعلی
          </label>
          <input
            id="headline"
            name="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="مثلاً «مدیر ارشد پروژه در شرکت پتروپارس»"
            className={FIELD_CLASS}
          />
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
                    ? "border-brand bg-brand-light text-brand"
                    : "border-card-border text-muted hover:border-brand hover:text-brand"
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
        title="حوزه‌های تخصص"
        description="متقاضی‌ها با همین حوزه‌ها تو رو پیدا می‌کنن."
      >
        <div>
          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`حذف ${tag}`}
                    className="text-brand/60 transition hover:text-brand"
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
                  className="rounded-full border border-card-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand"
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
              className="mt-3 text-xs text-brand hover:underline"
            >
              افزودن «{draft.trim()}» به‌عنوان تخصص جدید
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
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand">
          پروفایلت ذخیره شد.
        </p>
      )}

      <button
        disabled={pending}
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-background transition hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال ذخیره..." : "ذخیره پروفایل"}
      </button>
    </form>
  );
}

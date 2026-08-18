"use client";

import { useActionState, useState } from "react";
import { saveMentorProfile } from "@/lib/actions/mentor";

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

function parseTags(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function MentorProfileForm({
  initialPhotoUrl,
  initialHeadline,
  initialCountry,
  initialBio,
  initialTags,
  initialLinkedin,
  initialMeetingLink,
}: {
  initialPhotoUrl: string;
  initialHeadline: string;
  initialCountry: string;
  initialBio: string;
  initialTags: string;
  initialLinkedin: string;
  initialMeetingLink: string;
}) {
  const [state, action, pending] = useActionState(saveMentorProfile, undefined);
  const [preview, setPreview] = useState(initialPhotoUrl);
  const [photoError, setPhotoError] = useState("");

  // Controlled so nothing typed is lost when the form re-renders after saving.
  const [headline, setHeadline] = useState(initialHeadline);
  const [country, setCountry] = useState(initialCountry);
  const [bio, setBio] = useState(initialBio);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink);

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
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="photo" className="mb-1 block text-sm font-medium">
          عکس پروفایل
        </label>
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-brand-light" />
          )}
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
          />
        </div>
        {photoError && <p className="mt-1 text-sm text-red-400">{photoError}</p>}
      </div>

      <div>
        <label htmlFor="headline" className="mb-1 block text-sm font-medium">
          سمت فعلی
        </label>
        <input
          id="headline"
          name="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="مثلاً «مدیر محصول ارشد در اسنپ»"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium">
          کشور محل زندگی
        </label>
        <input
          id="country"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="مثلاً «ایران» یا «آلمان»"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          معرفی کوتاه
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          required
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="tag_draft" className="mb-1 block text-sm font-medium">
          حوزه‌های تخصص
        </label>

        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`حذف ${tag}`}
                  className="text-brand/70 hover:text-brand"
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
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
        {/* The real value the server reads. */}
        <input type="hidden" name="expertise_tags" value={tags.join("، ")} />

        {matches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {matches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-card-border px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand"
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
            className="mt-2 text-xs text-brand hover:underline"
          >
            افزودن «{draft.trim()}» به‌عنوان تخصص جدید
          </button>
        )}
      </div>

      <div>
        <label htmlFor="linkedin_url" className="mb-1 block text-sm font-medium">
          لینک لینکدین (اختیاری)
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>

      <div>
        <label htmlFor="meeting_link" className="mb-1 block text-sm font-medium">
          لینک تماس تصویری (اختیاری)
        </label>
        <input
          id="meeting_link"
          name="meeting_link"
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
        <p className="mt-1 text-xs text-muted">
          می‌تونی الان خالی بذاری و بعداً پرش کنی. لینک ثابت Google Meet، Zoom یا
          Microsoft Teams هر کدوم کار می‌کنه و بعد از رزرو به منتی نشون داده
          می‌شه.
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-brand">پروفایلت ذخیره شد.</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}

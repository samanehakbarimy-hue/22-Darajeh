"use client";

import { useActionState, useState } from "react";
import { saveMentorProfile } from "@/lib/actions/mentor";

const SUGGESTED_TAGS = [
  "مدیریت محصول",
  "طراحی UX/UI",
  "توسعه نرم‌افزار",
  "بازاریابی دیجیتال",
  "فروش",
  "رشد کسب‌وکار",
  "منابع انسانی",
  "مدیریت مالی",
  "کارآفرینی",
  "داده و تحلیل",
];

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
  const [tags, setTags] = useState(initialTags);
  const [photoError, setPhotoError] = useState("");

  const MAX_PHOTO_MB = 3;

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

  function addSuggestedTag(tag: string) {
    const current = tags
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (current.includes(tag)) return;
    setTags([...current, tag].join("، "));
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
          defaultValue={initialHeadline}
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
          defaultValue={initialCountry}
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
          defaultValue={initialBio}
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="expertise_tags" className="mb-1 block text-sm font-medium">
          حوزه‌های تخصص (با ، از هم جدا کن)
        </label>
        <input
          id="expertise_tags"
          name="expertise_tags"
          required
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="مثلاً طراحی محصول، مدیریت محصول"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addSuggestedTag(tag)}
              className="rounded-full border border-card-border px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="linkedin_url" className="mb-1 block text-sm font-medium">
          لینک لینکدین (اختیاری)
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          defaultValue={initialLinkedin}
          placeholder="https://linkedin.com/in/..."
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="meeting_link" className="mb-1 block text-sm font-medium">
          لینک تماس تصویری (مثلاً Google Meet یا Zoom)
        </label>
        <input
          id="meeting_link"
          name="meeting_link"
          type="url"
          defaultValue={initialMeetingLink}
          placeholder="این لینک بعد از رزرو به منتی نشون داده می‌شه"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-brand">پروفایلت ذخیره شد.</p>
      )}

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

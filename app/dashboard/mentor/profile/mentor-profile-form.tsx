"use client";

import { useActionState } from "react";
import { saveMentorProfile } from "@/lib/actions/mentor";

export default function MentorProfileForm({
  initialBio,
  initialTags,
  initialLinkedin,
  initialMeetingLink,
}: {
  initialBio: string;
  initialTags: string;
  initialLinkedin: string;
  initialMeetingLink: string;
}) {
  const [state, action, pending] = useActionState(saveMentorProfile, undefined);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
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
          defaultValue={initialTags}
          placeholder="مثلاً طراحی محصول، مدیریت محصول"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
        />
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
          placeholder="این لینک بعد از رزرو به جویا نشون داده می‌شه"
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

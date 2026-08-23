"use client";

import { useState } from "react";
import { requestMentorChanges } from "@/lib/actions/admin";

/**
 * Pulls an already-approved specialist back for another look.
 *
 * Approval used to be one-way. Rejection could be undone and changes could be
 * requested, but once someone was approved the admin had no move left: a
 * specialist who turned out to have overstated their experience stayed listed,
 * bookable, and public, and only hand-written SQL could change that — the one
 * thing this admin page exists to avoid.
 *
 * It asks first, because this un-publishes a live specialist, and it insists on
 * a reason, because they see that text on their profile and can then fix it and
 * resubmit. Sending someone back with no explanation is how they get stuck.
 */
export default function SendBackForReview({
  mentorId,
  name,
}: {
  mentorId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-muted underline-offset-4 hover:text-brand hover:underline"
      >
        بازبینی دوباره
      </button>
    );
  }

  return (
    <form
      action={requestMentorChanges}
      className="mt-2 rounded-xl border border-card-border p-3 text-right"
    >
      <input type="hidden" name="mentor_id" value={mentorId} />
      <p className="text-xs leading-6 text-muted">
        {name} از فهرست عمومی برداشته می‌شود تا وقتی اصلاح کند و دوباره بفرستد.
        جلسه‌های قبول‌شده‌اش سر جایشان می‌مانند.
      </p>
      <textarea
        name="review_note"
        rows={2}
        required
        maxLength={500}
        placeholder="چه چیزی باید اصلاح شود؟ همین متن را خودش می‌بیند."
        className="mt-2 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-xs leading-6 outline-none focus:border-brand"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-full border border-card-border px-4 py-1.5 text-xs font-medium text-red-400 hover:border-red-400"
        >
          بفرست برای اصلاح
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          بی‌خیال
        </button>
      </div>
    </form>
  );
}

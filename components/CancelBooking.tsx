"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { cancelBooking } from "@/lib/actions/booking-cancel";

/**
 * Calling off a session, with a step in between.
 *
 * Cancelling frees the slot and cannot be undone, and it is the one action
 * here that disappoints somebody — so it is never one click. The reason is
 * optional but asked for plainly: the other side sees only that the session
 * vanished unless something is written here.
 */
export default function CancelBooking({
  bookingId,
  /** A request not yet accepted is withdrawn; an accepted one is cancelled. */
  kind,
}: {
  bookingId: string;
  kind: "request" | "session";
}) {
  const [state, action] = useActionState(cancelBooking, undefined);
  const [open, setOpen] = useState(false);

  const noun = kind === "request" ? "درخواست" : "جلسه";

  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted underline-offset-4 hover:text-danger hover:underline"
        >
          {kind === "request" ? "انصراف از درخواست" : "لغو جلسه"}
        </button>
        {state?.error && (
          <p className="mt-2 text-sm text-danger">{state.error}</p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-3 rounded-xl border border-card-border p-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <p className="text-sm font-semibold">
        {noun} را لغو کنم؟
      </p>
      <p className="mt-1 text-xs leading-6 text-muted">
        {kind === "request"
          ? "این زمان دوباره آزاد می‌شود و متخصص دیگر درخواستت را نمی‌بیند."
          : "این زمان دوباره آزاد می‌شود و طرف مقابل خبردار می‌شود. برگرداندنش ممکن نیست."}
      </p>

      <label className="mt-3 block">
        <span className="text-xs text-muted">
          دلیلش را بنویس (اختیاری، ولی کمک می‌کند)
        </span>
        <input
          type="text"
          name="reason"
          maxLength={500}
          autoComplete="off"
          className="mt-1.5 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="مثلاً: برایم کاری پیش آمد"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <SubmitButton
          variant="danger"
          pendingLabel="در حال لغو..."
          className="px-5 py-2 text-sm font-medium"
        >
          بله، لغو کن
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          بی‌خیال
        </button>
      </div>

      {state?.error && (
        <p className="mt-2 text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}

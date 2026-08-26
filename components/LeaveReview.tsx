"use client";

import { useActionState, useState } from "react";
import { leaveReview } from "@/lib/actions/reviews";
import Spinner from "@/components/Spinner";

const SCORES = [1, 2, 3, 4, 5];

/**
 * Written after the session, from the seeker's own list.
 *
 * Folded away behind a link until they want it. Somebody scrolling their past
 * sessions is usually looking for something else, and five open forms down a
 * page is a page nobody reads.
 */
export default function LeaveReview({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(leaveReview, undefined);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  if (state?.success) {
    return (
      <p className="mt-4 border-t border-card-border pt-4 text-sm text-brand-deep">
        نظرت ثبت شد. روی پروفایل این کارشناس دیده می‌شود.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-brand-deep hover:underline"
      >
        نظرت را بنویس
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 border-t border-card-border pt-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <span className="block text-sm font-medium">چطور بود؟</span>

      <div className="mt-2 flex flex-row-reverse justify-end gap-1">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => setRating(score)}
            aria-label={`${score} از ۵`}
            aria-pressed={rating === score}
            className={`text-2xl leading-none transition ${
              score <= rating ? "text-brand" : "text-card-border hover:text-muted"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor={`body-${bookingId}`} className="mt-4 block text-sm font-medium">
        چه چیزی به کارت آمد؟
      </label>
      <textarea
        id={`body-${bookingId}`}
        name="body"
        rows={3}
        required
        minLength={10}
        maxLength={1500}
        className="mt-1.5 w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
      />

      {state?.error && (
        <p className="mt-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-on transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending && <Spinner />}
          {pending ? "در حال ثبت..." : "ثبت نظر"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          بی‌خیال
        </button>
      </div>
    </form>
  );
}

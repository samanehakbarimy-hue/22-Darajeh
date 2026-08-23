"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { generateMeetingLink } from "@/lib/actions/booking-response";

/**
 * What the specialist sees about where a confirmed session will happen.
 *
 * Three states, and the reason this exists is the middle one: a booking
 * confirmed before Google was connected gets no link, because generation runs
 * at the moment of accepting. Without a way to make one afterwards, that
 * session is quietly unattendable and nobody finds out until the day.
 */
export default function ConfirmedSessionLink({
  bookingId,
  bookingLink,
  fallbackLink,
  googleConnected,
}: {
  bookingId: string;
  /** Generated for this booking. */
  bookingLink: string | null;
  /** The specialist's permanent pasted link, used when there is no other. */
  fallbackLink: string | null;
  googleConnected: boolean;
}) {
  const [state, action] = useActionState(generateMeetingLink, undefined);

  const link = bookingLink ?? fallbackLink;

  return (
    <div className="mt-4 border-t border-card-border pt-4">
      {link ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
          >
            ورود به جلسه
          </a>
          <span className="text-xs text-muted">
            {bookingLink
              ? "لینک مخصوص همین جلسه"
              : "لینک ثابت پروفایلت — همان را برای متقاضی می‌فرستیم"}
          </span>
        </div>
      ) : (
        <>
          <p className="text-sm leading-7 text-muted">
            این جلسه هنوز لینکی ندارد. متقاضی جایی برای آمدن ندارد.
          </p>
          {googleConnected ? (
            <form action={action} className="mt-3">
              <input type="hidden" name="booking_id" value={bookingId} />
              <SubmitButton
                pendingLabel="در حال ساختن..."
                className="px-5 py-2.5 text-sm"
              >
                ساختن لینک جلسه
              </SubmitButton>
            </form>
          ) : (
            <p className="mt-2 text-xs leading-6 text-muted">
              از صفحه پروفایل یک لینک ثابت بگذار، یا حساب گوگلت را وصل کن تا
              برای هر جلسه لینک جدا ساخته شود.
            </p>
          )}
        </>
      )}

      {state?.error && (
        <p className="mt-2 text-sm text-red-400">{state.error}</p>
      )}
    </div>
  );
}

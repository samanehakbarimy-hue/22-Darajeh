"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { replyToInquiry } from "@/lib/actions/inquiries";

/**
 * The one reply a specialist writes to a message.
 *
 * What stood here was a button saying «جواب دادم», which wrote a timestamp and
 * made the message disappear. Nothing was sent and nothing was kept, so the
 * person who asked was left with a promise of a notice that no code existed to
 * send. This is a box that actually holds an answer.
 *
 * Open by default, unlike the other folded forms on this site. Those hide an
 * action most people will not want; this is the whole point of the card.
 */
export default function InquiryReply({ inquiryId }: { inquiryId: string }) {
  const [state, action] = useActionState(replyToInquiry, undefined);

  if (state?.sent) {
    return (
      <p className="mt-4 text-sm text-success">
        جوابت فرستاده شد و برایش ایمیل رفت.
      </p>
    );
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="inquiry_id" value={inquiryId} />
      <label htmlFor={`reply-${inquiryId}`} className="text-xs text-muted">
        جوابت
      </label>
      <textarea
        id={`reply-${inquiryId}`}
        name="reply"
        rows={4}
        required
        maxLength={2000}
        placeholder="کوتاه جواب بده. اگر حرف بیشتری هست، بگو گفت‌وگوی رایگان را رزرو کند."
        className="mt-1.5 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm leading-7 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
      />

      {state?.error && (
        <p className="mt-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <SubmitButton pendingLabel="در حال ارسال..." className="px-5 py-2 text-sm">
          ارسال پاسخ
        </SubmitButton>
        <span className="text-xs text-muted">یک بار — بعد از این بسته می‌شود.</span>
      </div>
    </form>
  );
}

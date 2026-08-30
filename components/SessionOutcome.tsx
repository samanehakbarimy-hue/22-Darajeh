"use client";

import { useActionState } from "react";
import { setSessionOutcome } from "@/lib/actions/session-outcome";

/**
 * Asks, once, whether a session that has passed actually happened.
 *
 * It sits on sessions whose time is up and that nobody has answered for yet.
 * Both answers are one click and neither is styled as the right one: a
 * specialist whose «برگزار شد» is a button and whose «برگزار نشد» is a
 * grey afterthought is being nudged, and the number this feeds is the one
 * strangers use to decide whether to trust them.
 */
export default function SessionOutcome({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(setSessionOutcome, undefined);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <span className="text-xs text-muted">برگزار شد؟</span>

      <button
        type="submit"
        name="outcome"
        value="held"
        disabled={pending}
        className="rounded-full border border-card-border px-3 py-1 text-xs hover:border-brand hover:text-brand-deep disabled:opacity-60"
      >
        بله
      </button>
      <button
        type="submit"
        name="outcome"
        value="missed"
        disabled={pending}
        className="rounded-full border border-card-border px-3 py-1 text-xs hover:border-brand hover:text-brand-deep disabled:opacity-60"
      >
        نه
      </button>

      {state?.error && (
        <span className="text-xs text-danger">{state.error}</span>
      )}
    </form>
  );
}

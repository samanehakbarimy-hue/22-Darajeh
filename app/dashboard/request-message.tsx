"use client";

import { useActionState, useState } from "react";
import { editBookingMessage } from "@/lib/actions/booking-message";
import Spinner from "@/components/Spinner";

/**
 * The request as sent, with the option to reword it while the specialist has
 * not opened it yet — the way a message can be edited before it is read.
 */
export default function RequestMessage({
  bookingId,
  message,
  editable,
  edited = false,
}: {
  bookingId: string;
  message: string;
  editable: boolean;
  edited?: boolean;
}) {
  const [state, action, pending] = useActionState(editBookingMessage, undefined);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);

  if (!editing) {
    return (
      <div className="mt-3 border-t border-card-border pt-3">
        <p className="whitespace-pre-line text-sm text-muted">
          {message}
          {edited && (
            <span className="mr-2 text-xs text-muted/70">(ویرایش شده)</span>
          )}
        </p>
        {editable && (
          <button
            type="button"
            onClick={() => {
              setDraft(message);
              setEditing(true);
            }}
            className="mt-2 text-xs text-brand hover:underline"
          >
            ویرایش پیام
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-3 border-t border-card-border pt-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <textarea
        name="message"
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {state?.error && (
        <p className="mt-1 text-xs text-red-400">{state.error}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
        >
          {pending && <Spinner />}
        {pending ? "در حال ذخیره..." : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-card-border px-4 py-1.5 text-xs text-muted"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}

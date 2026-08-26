"use client";

import { useActionState } from "react";
import { sendInquiry } from "@/lib/actions/inquiries";
import Spinner from "@/components/Spinner";

/**
 * The message itself, once there is an account behind it.
 *
 * Signed-out visitors get the signup form instead, which carries the message
 * through the confirmation link — see the page beside this file.
 */
export default function MessageForm({
  specialistId,
  blocked,
}: {
  specialistId: string;
  /** They already have a question waiting with this specialist. */
  blocked: boolean;
}) {
  const [state, action, pending] = useActionState(sendInquiry, undefined);

  if (blocked) {
    return (
      <p className="rounded-xl border border-card-border bg-card px-5 py-4 text-sm leading-7 text-muted">
        یک پیام بی‌جواب برای این کارشناس داری. تا جواب ندهد، پیام تازه‌ای
        نمی‌شود فرستاد.
      </p>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="mentor_id" value={specialistId} />

      <label htmlFor="body" className="block text-sm font-medium">
        پیام
      </label>
      <textarea
        id="body"
        name="body"
        rows={6}
        required
        minLength={10}
        maxLength={2000}
        className="mt-1.5 w-full rounded-xl border border-card-border bg-background px-4 py-3 leading-8 outline-none transition focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
      />

      <p className="mt-2 text-sm leading-7 text-muted">
        اولین پیام یک درخواست است — تا وقتی کارشناس جواب ندهد، پیام دیگری
        نمی‌شود فرستاد.
      </p>

      {state?.error && (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-on transition hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال فرستادن..." : "فرستادن پیام"}
      </button>
    </form>
  );
}

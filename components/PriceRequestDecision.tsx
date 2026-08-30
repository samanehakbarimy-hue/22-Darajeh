"use client";

import { useActionState } from "react";
import { decidePriceRequest } from "@/lib/actions/pricing";

/**
 * Answering a specialist who asked to charge above their band.
 *
 * The approve field is pre-filled with what they asked for and is editable,
 * because the useful answer is often neither yes nor no. Somebody asking for
 * three times the band and being offered one and a half has been given a real
 * reply; being declined outright teaches them only that the form does nothing.
 */
export default function PriceRequestDecision({
  requestId,
  asked,
}: {
  requestId: string;
  asked: number;
}) {
  const [state, action, pending] = useActionState(decidePriceRequest, undefined);

  if (state?.saved) {
    return <p className="mt-2 text-xs text-success">جواب ثبت شد.</p>;
  }

  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name="request_id" value={requestId} />

      <div>
        <label
          htmlFor={`grant-${requestId}`}
          className="block text-xs text-muted"
        >
          قیمت مجاز (تومان)
        </label>
        <input
          id={`grant-${requestId}`}
          name="granted_toman"
          inputMode="numeric"
          defaultValue={asked}
          className="mt-1 w-36 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand-deep"
        />
      </div>

      <div className="min-w-[12rem] flex-1">
        <label
          htmlFor={`note-${requestId}`}
          className="block text-xs text-muted"
        >
          توضیح برای کارشناس
        </label>
        <input
          id={`note-${requestId}`}
          name="admin_note"
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand-deep"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
        >
          تأیید
        </button>
        <button
          type="submit"
          name="decision"
          value="declined"
          disabled={pending}
          className="rounded-full border border-card-border px-4 py-1.5 text-xs hover:border-danger hover:text-danger disabled:opacity-60"
        >
          رد
        </button>
      </div>

      {state?.error && (
        <p className="w-full text-xs text-danger">{state.error}</p>
      )}
    </form>
  );
}

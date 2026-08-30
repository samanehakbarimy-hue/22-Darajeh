"use client";

import { useActionState, useState } from "react";
import { requestPriceException } from "@/lib/actions/pricing";

type Ask = {
  status: "pending" | "approved" | "declined";
  asked_toman: number;
  granted_toman: number | null;
  admin_note: string | null;
};

/**
 * Asking to charge more than the band allows.
 *
 * Folded away until wanted, because most people will price inside the range
 * and a form asking "why should you be an exception?" open on every service is
 * an invitation to feel like one.
 *
 * It insists on a reason. An admin looking at a number with no argument
 * attached can only guess, and guessing is how this becomes arbitrary.
 */
export default function AskHigherPrice({
  sessionKey,
  title,
  ceiling,
  existing,
}: {
  sessionKey: string;
  title: string;
  ceiling: number | null;
  existing: Ask | null;
}) {
  const [state, action, pending] = useActionState(
    requestPriceException,
    undefined,
  );
  const [open, setOpen] = useState(false);

  if (existing?.status === "pending" && !state?.sent) {
    return (
      <p className="mt-2 text-xs text-muted">
        درخواست {existing.asked_toman.toLocaleString("fa-IR")} تومانی‌ات ثبت شده
        و منتظر جواب است.
      </p>
    );
  }

  if (existing?.status === "approved" && existing.granted_toman) {
    return (
      <p className="mt-2 text-xs text-success">
        تا {existing.granted_toman.toLocaleString("fa-IR")} تومان برای این جلسه
        برایت باز شده.
        {existing.admin_note ? ` ${existing.admin_note}` : ""}
      </p>
    );
  }

  if (state?.sent) {
    return (
      <p className="mt-2 text-xs text-success">
        درخواستت فرستاده شد. جواب که آمد همین‌جا می‌بینی.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-2">
        {existing?.status === "declined" && (
          <p className="mb-1 text-xs text-muted">
            درخواست قبلی‌ات پذیرفته نشد.
            {existing.admin_note ? ` ${existing.admin_note}` : ""}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-brand-deep underline-offset-4 hover:underline"
        >
          می‌خواهم بیشتر از این بازه بگیرم
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-2 rounded-xl border border-card-border p-3">
      <input type="hidden" name="session_key" value={sessionKey} />

      <p className="text-xs text-muted">
        برای «{title}»
        {ceiling
          ? ` بیشترین قیمت فعلی ${ceiling.toLocaleString("fa-IR")} تومان است.`
          : ""}
      </p>

      <label className="mt-2 block text-xs text-muted" htmlFor={`ask-${sessionKey}`}>
        قیمتی که می‌خواهی (تومان)
      </label>
      <input
        id={`ask-${sessionKey}`}
        name="asked_toman"
        inputMode="numeric"
        required
        className="mt-1 w-40 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand-deep"
      />

      <label className="mt-2.5 block text-xs text-muted" htmlFor={`why-${sessionKey}`}>
        چرا؟
      </label>
      <textarea
        id={`why-${sessionKey}`}
        name="reason"
        rows={3}
        required
        maxLength={600}
        placeholder="چه چیزی در این جلسه هست که این قیمت را توجیه می‌کند؟"
        className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-brand-deep"
      />

      {state?.error && <p className="mt-2 text-xs text-danger">{state.error}</p>}

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
        >
          فرستادن درخواست
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

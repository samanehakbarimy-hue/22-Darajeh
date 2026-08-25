"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import PriceInput from "@/components/PriceInput";
import { respondToBrief } from "@/lib/actions/project-brief";

const FIELD =
  "w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

/**
 * Answering a brief: terms, or no.
 *
 * Accepting opens a small form rather than being a single button, because
 * "yes" here has to carry a number. A specialist who could accept in one click
 * would be agreeing to work whose price nobody had stated, which is the
 * argument people actually have later.
 */
export default function BriefReply({ briefId }: { briefId: string }) {
  const [state, action] = useActionState(respondToBrief, undefined);
  const [open, setOpen] = useState(false);

  return (
    <form action={action} className="mt-4 border-t border-card-border pt-4">
      <input type="hidden" name="brief_id" value={briefId} />

      {open ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">نرخ هر ساعت (تومان)</span>
              <PriceInput
                name="rate"
                placeholder="۹۰۰,۰۰۰"
                className={`w-44 ${FIELD}`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">تخمین ساعت</span>
              <input
                name="hours"
                inputMode="numeric"
                autoComplete="off"
                placeholder="۱۰"
                className={`w-28 ${FIELD}`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">
              توضیح برای متقاضی (اختیاری)
            </span>
            <textarea
              name="note"
              rows={2}
              maxLength={2000}
              placeholder="مثلاً: اول مدارک را می‌بینم و بعد زمان دقیق را می‌گویم."
              className={`leading-7 ${FIELD}`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton
              name="accept"
              value="1"
              pendingLabel="در حال فرستادن..."
              className="px-5 py-2 text-sm"
            >
              قبول می‌کنم
            </SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="py-1 text-sm text-muted hover:text-foreground"
            >
              بی‌خیال
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
          >
            قبول می‌کنم
          </button>
          <SubmitButton
            name="accept"
            value="0"
            variant="outline"
            pendingLabel="در حال رد..."
            className="px-5 py-2.5 text-sm font-medium"
          >
            رد می‌کنم
          </SubmitButton>
        </div>
      )}

      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </form>
  );
}

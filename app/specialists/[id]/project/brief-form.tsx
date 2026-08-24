"use client";

import { useActionState } from "react";
import { sendBrief } from "@/lib/actions/project-brief";
import Spinner from "@/components/Spinner";

const FIELD =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm leading-7 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function BriefForm({ mentorId }: { mentorId: string }) {
  const [state, action, pending] = useActionState(sendBrief, undefined);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="mentor_id" value={mentorId} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">کار چیست؟</span>
        <textarea
          name="brief"
          rows={9}
          required
          minLength={20}
          maxLength={4000}
          placeholder="چه چیزی ساخته یا بررسی شود، در چه مرحله‌ای هستی، چه چیزی از قبل آماده است، و تا کِی لازمش داری."
          className={FIELD}
        />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال فرستادن..." : "فرستادن درخواست"}
      </button>

      <p className="text-xs leading-6 text-muted">
        تا وقتی جواب نگرفتی می‌تونی پسش بگیری. پرداخت آنلاین هنوز فعال نیست، پس
        این فقط توافق روی کار و نرخ است.
      </p>
    </form>
  );
}

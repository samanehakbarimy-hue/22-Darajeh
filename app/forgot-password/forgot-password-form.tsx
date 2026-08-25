"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import Spinner from "@/components/Spinner";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  // Deliberately the same words whether or not that address has an account.
  // A form that says "no such user" is a way of finding out who registered.
  if (state?.sent) {
    return (
      <div className="mt-8 rounded-2xl border border-card-border bg-card p-5">
        <p className="font-bold">اگر این ایمیل حساب داشته باشد، لینک رفت.</p>
        <p className="mt-2 text-sm leading-7 text-muted">
          صندوق ورودی را نگاه کن. اگر چیزی نیامد، پوشه اسپم را هم ببین — و
          مطمئن شو همان ایمیلی را نوشتی که باهاش ثبت‌نام کردی.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          ایمیل
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 text-left outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال فرستادن..." : "فرستادن لینک"}
      </button>
    </form>
  );
}

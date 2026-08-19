"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, resendConfirmation } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import LinkedInButton from "@/components/LinkedInButton";

export default function LoginForm({
  next,
  confirmFailed,
}: {
  next: string;
  confirmFailed: boolean;
}) {
  const [state, action, pending] = useActionState(login, undefined);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmation,
    undefined,
  );

  return (
    <>
      {confirmFailed && !resendState?.success && (
        <div className="mt-6 rounded-lg border border-card-border bg-card p-4 text-sm">
          <p className="text-red-400">
            لینک تأیید ایمیل منقضی شده یا قبلاً استفاده شده.
          </p>
          <p className="mt-1 text-muted">
            ایمیلت رو وارد کن تا یک لینک تازه برات بفرستیم:
          </p>
          <form action={resendAction} className="mt-3 flex gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="ایمیل"
              className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              disabled={resendPending}
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
            >
              {resendPending ? "..." : "ارسال دوباره"}
            </button>
          </form>
          {resendState?.error && (
            <p className="mt-2 text-red-400">{resendState.error}</p>
          )}
        </div>
      )}
      {resendState?.success && (
        <p className="mt-6 text-sm text-brand">
          لینک تازه فرستاده شد، ایمیلت رو چک کن.
        </p>
      )}

      <div className="mt-8">
        <LinkedInButton label="ورود با لینکدین" />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-card-border" />
        یا با ایمیل
        <div className="h-px flex-1 bg-card-border" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            ایمیل
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            رمز عبور
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "در حال ورود..." : "ورود"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        حساب نداری؟{" "}
        <Link href="/signup/seeker" className="font-medium text-brand">
          ثبت‌نام به‌عنوان متقاضی
        </Link>{" "}
        یا{" "}
        <Link href="/signup/mentor" className="font-medium text-brand">
          متخصص شو
        </Link>
      </p>
    </>
  );
}

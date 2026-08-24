"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import Spinner from "@/components/Spinner";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          رمز تازه
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1.5 text-xs text-muted">حداقل ۶ کاراکتر.</p>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
          یک بار دیگر بنویس
        </label>
        <PasswordInput
          id="confirm"
          name="confirm"
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        disabled={pending}
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "در حال ذخیره..." : "ذخیره رمز تازه"}
      </button>
    </form>
  );
}

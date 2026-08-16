"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <form action={action} className="mt-8 flex flex-col gap-4">
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
          <input
            id="password"
            name="password"
            type="password"
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
          ثبت‌نام به‌عنوان جویا
        </Link>{" "}
        یا{" "}
        <Link href="/signup/mentor" className="font-medium text-brand">
          متخصص شو
        </Link>
      </p>
    </>
  );
}

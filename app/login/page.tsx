"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">ورود</h1>
      <p className="mt-2 text-sm text-foreground/70">
        به حساب ۲۲ درجه‌ات وارد شو.
      </p>

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
            className="w-full rounded-lg border border-foreground/20 px-4 py-2 outline-none focus:border-brand"
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
            className="w-full rounded-lg border border-foreground/20 px-4 py-2 outline-none focus:border-brand"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="mt-2 rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "در حال ورود..." : "ورود"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        حساب نداری؟{" "}
        <Link href="/signup/seeker" className="font-medium text-brand">
          ثبت‌نام به‌عنوان جویا
        </Link>{" "}
        یا{" "}
        <Link href="/signup/mentor" className="font-medium text-brand">
          مربی شو
        </Link>
      </p>
    </div>
  );
}

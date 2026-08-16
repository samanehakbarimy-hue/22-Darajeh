"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpMentor } from "@/lib/actions/auth";

export default function MentorSignupPage() {
  const [state, action, pending] = useActionState(signUpMentor, undefined);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">ثبت‌نام به‌عنوان مربی</h1>
      <p className="mt-2 text-sm text-foreground/70">
        پروفایلت رو بساز؛ بعد از تأیید توسط ادمین، در فهرست مربیان نمایش داده
        می‌شی.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
            نام و نام خانوادگی
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className="w-full rounded-lg border border-foreground/20 px-4 py-2 outline-none focus:border-brand"
          />
        </div>
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
            minLength={6}
            className="w-full rounded-lg border border-foreground/20 px-4 py-2 outline-none focus:border-brand"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="mt-2 rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        حساب داری؟{" "}
        <Link href="/login" className="font-medium text-brand">
          وارد شو
        </Link>
      </p>
    </div>
  );
}

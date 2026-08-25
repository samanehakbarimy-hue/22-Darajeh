"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpSeeker } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import LinkedInButton from "@/components/LinkedInButton";
import Spinner from "@/components/Spinner";

export default function SeekerSignupPage() {
  const [state, action, pending] = useActionState(signUpSeeker, undefined);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">ثبت‌نام</h1>
      <p className="mt-2 text-sm text-muted">
        یک حساب رایگان بساز و شروع کن به پیدا کردن کارشناس مناسب خودت.
      </p>

      <div className="mt-8">
        <LinkedInButton role="seeker" label="ثبت‌نام با لینکدین" />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-card-border" />
        یا با ایمیل
        <div className="h-px flex-1 bg-card-border" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
            نام و نام خانوادگی
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
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
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
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
            minLength={6}
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="inline-flex items-center justify-center gap-2 mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
        >
          {pending && <Spinner />}
        {pending ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        حساب داری؟{" "}
        <Link href="/login" className="font-medium text-brand-deep">
          وارد شو
        </Link>
      </p>
    </div>
  );
}

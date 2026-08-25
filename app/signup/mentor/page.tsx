"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpMentor } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import LinkedInButton from "@/components/LinkedInButton";
import Spinner from "@/components/Spinner";


const WHY = [
  "زمان‌ها را خودت می‌گذاری؛ هر درخواستی را می‌توانی بپذیری یا رد کنی.",
  "هر گفتگو ۲۲ دقیقه است — کوتاه و مشخص.",
  "جلسه روی لینک خودت برگزار می‌شود و شماره تماس هیچ‌وقت نمایش داده نمی‌شود.",
  "ثبت‌نام یکی‌دو دقیقه بیشتر نیست.",
];

export default function MentorSignupPage() {
  const [state, action, pending] = useActionState(signUpMentor, undefined);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">ثبت‌نام به‌عنوان کارشناس</h1>
      <p className="mt-2 text-sm text-muted">
        پروفایلت رو بساز؛ بعد از تأیید ادمین، در فهرست کارشناس‌ها نمایش داده
        می‌شی.
      </p>

      {/* Someone arriving from a link has not been told why they would want
          this. MentorCruise and ADPList answer that on a whole page of their
          own, before the form; with our traffic an extra click costs more
          than the pitch gains, so it sits above the form instead. Their wall
          of mentor faces is left alone deliberately — with one specialist it
          would say the opposite of what it says for them. */}
      <div className="mt-6 rounded-xl border border-card-border bg-card px-5 py-4">
        <h2 className="text-sm font-bold">چرا کارشناس ۲۲ درجه بشوی؟</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {WHY.map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="mt-1 h-4 w-4 shrink-0 text-brand-deep"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-sm leading-6 text-muted">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <LinkedInButton role="mentor" label="ثبت‌نام با لینکدین" />
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

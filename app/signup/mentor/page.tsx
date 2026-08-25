"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpMentor } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import LinkedInButton from "@/components/LinkedInButton";
import Spinner from "@/components/Spinner";

/* Helping and earning, in that order — the two reasons somebody does this.
   The money line claims only what a specialist really controls, which is the
   price; where the payment itself stands is the booking page's job to say,
   and it does. */
const WHY = [
  "به کسی کمک می‌کنی که همان راهی را می‌رود که خودت رفته‌ای.",
  "قیمت جلسه‌های تخصصی و کار پروژه‌ای را خودت تعیین می‌کنی.",
  "زمان‌ها را خودت می‌گذاری؛ هر درخواستی را می‌توانی بپذیری یا رد کنی.",
  "گفتگوی ۲۲ دقیقه‌ای رایگان است — کوتاه و مشخص.",
];

/* The three stages are the ones that already exist — signing up, filling the
   profile in, waiting for the admin. The form itself is not split across
   them: it asks for three things, and breaking three fields into three
   screens would add clicks without removing any work. What the bar is for is
   telling someone on the first screen that there are two more, and that the
   last one is not theirs to do. */
const STAGES = ["ثبت‌نام", "کامل کردن پروفایل", "بررسی و انتشار"];
const CURRENT_STAGE = 0;

function StageBar() {
  return (
    <ol className="mt-8 flex items-start">
      {STAGES.map((label, i) => {
        const done = i < CURRENT_STAGE;
        const here = i === CURRENT_STAGE;
        return (
          <li
            key={label}
            className={`flex items-start ${i < STAGES.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  here || done
                    ? "bg-brand text-brand-on"
                    : "border border-card-border bg-card text-muted"
                }`}
              >
                {(i + 1).toLocaleString("fa-IR")}
              </span>
              <span
                className={`text-center text-xs leading-5 ${
                  here ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {/* Half the circle's height down, so the line meets the circles
                rather than floating between them and their labels. */}
            {i < STAGES.length - 1 && (
              <div className="mx-3 mt-4 h-px flex-1 bg-card-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function MentorSignupPage() {
  const [state, action, pending] = useActionState(signUpMentor, undefined);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">ثبت‌نام به‌عنوان کارشناس</h1>

      <StageBar />

      {/* Two columns rather than one narrow one: the form is the work, and the
          reasons to do it sit beside it instead of pushing it down the page.
          They stack on a phone, form first — someone who already decided
          should not have to scroll past the pitch to sign up. */}
      <div className="mt-10 grid gap-8 md:grid-cols-5 md:gap-10">
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
            <LinkedInButton role="mentor" label="ثبت‌نام با لینکدین" />

            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <div className="h-px flex-1 bg-card-border" />
              یا با ایمیل
              <div className="h-px flex-1 bg-card-border" />
            </div>

            <form action={action} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-1 block text-sm font-medium"
                >
                  نام و نام خانوادگی
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
                  ایمیل
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium"
                >
                  رمز عبور
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-danger">{state.error}</p>
              )}

              <button
                disabled={pending}
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
              >
                {pending && <Spinner />}
                {pending ? "در حال ثبت‌نام..." : "ثبت‌نام"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            حساب داری؟{" "}
            <Link href="/login" className="font-medium text-brand-deep">
              وارد شو
            </Link>
          </p>
        </div>

        <aside className="md:col-span-2">
          <div className="rounded-2xl border border-card-border bg-card px-5 py-5">
            <h2 className="text-sm font-bold">چرا کارشناس ۲۲ درجه بشوی؟</h2>
            <ul className="mt-4 flex flex-col gap-3">
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
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpMentor } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import Spinner from "@/components/Spinner";
import { JOB_TITLES } from "@/lib/job-titles";
import { COUNTRIES } from "@/lib/countries";

const MAX_PHOTO_MB = 3;

/* Signing up, filling the profile in, and the admin's look at it. The form is
   step one of the three, which is why the bar sits above it. */
const STAGES = ["ثبت‌نام", "کامل کردن پروفایل", "بررسی و انتشار"];
const CURRENT_STAGE = 0;

const FIELD =
  "w-full rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20";
const LABEL = "mb-1.5 block text-sm font-medium";

function StageBar() {
  return (
    <ol className="mt-8 flex items-start">
      {STAGES.map((label, i) => {
        const here = i === CURRENT_STAGE;
        return (
          <li
            key={label}
            className={`flex items-center ${i < STAGES.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex w-24 shrink-0 flex-col items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  here ? "border-brand-deep" : "border-card-border"
                }`}
              >
                {here && (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-deep" />
                )}
              </span>
              <span
                className={`text-center text-xs leading-5 ${
                  here ? "font-medium text-brand-deep" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="-mt-6 h-px flex-1 bg-card-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function MentorSignupPage() {
  const [state, action, pending] = useActionState(signUpMentor, undefined);
  const [preview, setPreview] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoError, setPhotoError] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`حجم عکس باید کمتر از ${MAX_PHOTO_MB} مگابایت باشد.`);
      setPreview("");
      setPhotoName("");
      return;
    }
    setPhotoError("");
    setPhotoName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold">ثبت‌نام به‌عنوان کارشناس</h1>

      <StageBar />

      {/* The equivalent of their "Lovely to see you!" box: what this costs in
          time, what tone to write in, and what is being agreed to. */}
      <div className="mt-8 rounded-xl border border-brand/40 bg-brand-light px-5 py-4 text-sm leading-7 text-brand-deep">
        <p className="font-bold">خوشحالیم که اینجایی!</p>
        <p className="mt-1">
          پر کردن این فرم یکی‌دو دقیقه بیشتر طول نمی‌کشد. دوست داریم بدانیم چه
          کار می‌کنی و چرا می‌خواهی کارشناس باشی. ساده و خودمانی بنویس؛ اینجا
          به متن رسمی و پرطمطراق احتیاجی نیست.
        </p>
        <p className="mt-2">
          با فرستادن این فرم،{" "}
          <Link href="/terms" className="underline">
            قوانین استفاده
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="underline">
            حریم خصوصی
          </Link>{" "}
          را می‌پذیری، پس یک نگاهی به آنها بینداز.
        </p>
      </div>

      <form
        action={action}
        onSubmit={(e) => {
          if (!preview) {
            e.preventDefault();
            setPhotoError("این فیلد الزامی است.");
          }
        }}
        className="mt-8 flex flex-col gap-5"
      >
        <div>
          <span className={LABEL}>عکس</span>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border border-card-border object-cover"
              />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded-full border border-dashed border-card-border" />
            )}
            <div className="min-w-0">
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
              />
              <label
                htmlFor="photo"
                className="inline-block cursor-pointer rounded-lg border border-card-border bg-card px-5 py-2 text-sm font-medium transition hover:border-brand hover:text-brand-deep"
              >
                آپلود عکس
              </label>
              {photoName && (
                <p className="mt-2 truncate text-xs text-muted">{photoName}</p>
              )}
            </div>
          </div>
          {photoError && (
            <p className="mt-2 text-sm text-danger">{photoError}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className={LABEL}>
              نام
            </label>
            <input id="first_name" name="first_name" required className={FIELD} />
          </div>
          <div>
            <label htmlFor="last_name" className={LABEL}>
              نام خانوادگی
            </label>
            <input id="last_name" name="last_name" required className={FIELD} />
          </div>

          <div>
            <label htmlFor="email" className={LABEL}>
              ایمیل
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="password" className={LABEL}>
              انتخاب رمز عبور
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="headline" className={LABEL}>
              سمت فعلی
            </label>
            <input
              id="headline"
              name="headline"
              required
              list="job-titles"
              autoComplete="off"
              placeholder="مثلاً «مهندس مکانیک»"
              className={FIELD}
            />
            <datalist id="job-titles">
              {JOB_TITLES.map((title) => (
                <option key={title.label} value={title.label} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="company" className={LABEL}>
              محل کار{" "}
              <span className="text-xs font-normal text-muted">(اختیاری)</span>
            </label>
            <input
              id="company"
              name="company"
              maxLength={80}
              placeholder="مثلاً «پتروپارس»"
              className={FIELD}
            />
          </div>
        </div>

        <div className="sm:w-1/2 sm:pe-2.5">
          <label htmlFor="country" className={LABEL}>
            کشور
          </label>
          <select id="country" name="country" required className={FIELD}>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <div className="mt-2 flex justify-end">
          <button
            disabled={pending}
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 font-semibold text-brand-on hover:bg-brand-hover disabled:opacity-60"
          >
            {pending && <Spinner />}
            {pending ? "در حال ثبت‌نام..." : "مرحله بعد"}
          </button>
        </div>
      </form>
    </div>
  );
}

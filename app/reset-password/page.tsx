import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "رمز تازه — ۲۲ درجه" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  // Reaching this page means the recovery link already signed them in. Without
  // a session there is nothing to change, and the link has probably expired —
  // say so rather than showing a form that cannot work.
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
        <h1 className="text-2xl font-bold">این لینک دیگر کار نمی‌کند</h1>
        <p className="mt-2 leading-7 text-muted">
          لینک‌های بازیابی رمز مدت کوتاهی معتبرند و یک بار بیشتر باز نمی‌شوند.
          یک لینک تازه بگیر.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-brand-on hover:bg-brand-hover"
        >
          فرستادن لینک تازه
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">یک رمز تازه بگذار</h1>
      <p className="mt-2 leading-7 text-muted">
        برای {user.email} — بعد از ذخیره، با همین رمز وارد شو.
      </p>
      <ResetPasswordForm />
    </div>
  );
}

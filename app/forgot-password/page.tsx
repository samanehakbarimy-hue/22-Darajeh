import Link from "next/link";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = { title: "فراموشی رمز عبور — جاب‌آموز" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">رمزت را فراموش کردی؟</h1>
      <p className="mt-2 leading-7 text-muted">
        ایمیلت را بنویس تا یک لینک برایت بفرستیم و از همان‌جا رمز تازه بگذاری.
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand-deep">
          برگشت به صفحه ورود
        </Link>
      </p>
    </div>
  );
}

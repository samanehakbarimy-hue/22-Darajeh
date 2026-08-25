import Link from "next/link";

export const metadata = {
  title: "۲۲ درجه — به‌زودی",
  robots: { index: false, follow: false },
};

/**
 * What a stranger sees while the site is still being built.
 *
 * Deliberately says nothing about what 22 Darajeh does. A holding page that
 * explains the idea defeats the point of having one.
 */
export default function SoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-5xl font-bold text-brand-deep">۲۲</span>
      <h1 className="mt-6 text-2xl font-bold">به‌زودی</h1>
      <p className="mt-3 leading-7 text-muted">
        این‌جا هنوز آماده نیست. اگر حساب داری، وارد شو.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-full bg-brand px-6 py-3 font-semibold text-brand-on hover:bg-brand-hover"
      >
        ورود
      </Link>
    </div>
  );
}

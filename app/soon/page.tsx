import Link from "next/link";

export const metadata = {
  title: "جاب‌آموز — در دست ساخت",
  robots: { index: false, follow: false },
};

/**
 * What a stranger sees while the site is closed.
 *
 * Deliberately says nothing about what the site does — no header, no footer,
 * no links out. A holding page that explains the idea, or lists the pages
 * behind it, defeats the point of having one. The root layout leaves its
 * chrome off for this route.
 */
export default function SoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-3xl font-bold text-brand-deep">جاب‌آموز</span>
      <h1 className="mt-6 text-2xl font-bold">در دست ساخت</h1>
      <p className="mt-3 leading-7 text-muted">
        این سایت هنوز آماده نیست.
      </p>
      <Link
        href="/login"
        className="mt-8 text-sm font-medium text-muted underline underline-offset-4 hover:text-brand-deep"
      >
        ورود
      </Link>
    </div>
  );
}

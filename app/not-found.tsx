import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-5xl font-bold text-brand">۴۰۴</span>
      <h1 className="mt-4 text-2xl font-bold">این صفحه پیدا نشد</h1>
      <p className="mt-3 leading-7 text-muted">
        شاید لینک اشتباه باشه یا این صفحه دیگه وجود نداشته باشه.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/specialists"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-background hover:bg-brand-dark"
        >
          پیدا کردن متخصص
        </Link>
        <Link
          href="/"
          className="rounded-full border border-card-border px-6 py-3 text-sm font-medium hover:bg-card"
        >
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
}

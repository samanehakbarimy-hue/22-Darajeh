import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <span className="text-xl font-bold text-brand">۲۲ درجه</span>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <a href="#" className="text-foreground/70 hover:text-foreground">
            جستجوی مربی
          </a>
          <Link href="/login" className="text-foreground/70 hover:text-foreground">
            ورود
          </Link>
          <Link
            href="/signup/mentor"
            className="rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark"
          >
            مربی شوید
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-4 rounded-full bg-brand-light px-4 py-1 text-sm font-medium text-brand">
          کاملاً رایگان برای شروع
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          یک تماس رایگان ۲۲ دقیقه‌ای با مربی که تجربه‌اش را دارد.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-foreground/70">
          هر مربی در ۲۲ درجه یک گفتگوی رایگان و بدون فشار ۲۲ دقیقه‌ای ارائه
          می‌دهد. موضوع را انتخاب کن، زمان را انتخاب کن، و از کسی که قبلاً
          این مسیر را رفته راهنمایی بگیر.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup/seeker"
            className="rounded-full bg-brand px-8 py-3 font-medium text-white hover:bg-brand-dark"
          >
            پیدا کردن مربی
          </Link>
          <Link
            href="/signup/mentor"
            className="rounded-full border border-foreground/20 px-8 py-3 font-medium hover:bg-foreground/5"
          >
            مربی شدن
          </Link>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سؤال‌های پرتکرار — جاب‌آموز",
  description:
    "گفتگوی ۲۲ دقیقه‌ای چطور کار می‌کنه، چرا رایگانه، و پیوستن به کارشناس‌ها چه شکلیه.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "واقعاً رایگانه؟",
    a: (
      <>
        بله. گفتگوی ۲۲ دقیقه‌ای هیچ هزینه‌ای ندارد و کارت بانکی هم نمی‌خواهد.
        کارشناس‌ها این وقت را خودشان می‌گذارند.
      </>
    ),
  },
  {
    q: "چرا ۲۲ دقیقه؟",
    a: (
      <>
        چون کوتاه‌تر از آن است که کسی نتواند وقت بگذارد، و بلندتر از آن است که
        نشود یک سؤال واقعی را جواب داد. برای کارشناس هم تعهد سنگینی نیست.
      </>
    ),
  },
  {
    q: "بعد از رزرو چه اتفاقی می‌افتد؟",
    a: (
      <>
        درخواستت برای کارشناس فرستاده می‌شود و او قبول یا رد می‌کند. تا وقتی جواب
        نداده، می‌توانی متن درخواستت را عوض کنی. بعد از تأیید، لینک جلسه در
        بخش «درخواست‌های من» برایت نمایش داده می‌شود.
      </>
    ),
  },
  {
    q: "اگر کارشناس درخواستم را رد کند چه؟",
    a: (
      <>
        آن زمان دوباره آزاد می‌شود و می‌توانی زمان دیگری یا کارشناس دیگری را
        انتخاب کنی. رد شدن یک درخواست معنی خاصی ندارد؛ معمولاً یعنی آن ساعت
        برایش جور نبوده.
      </>
    ),
  },
  {
    q: "جلسه کجا برگزار می‌شود؟",
    a: (
      <>
        روی لینکی که خود کارشناس گذاشته — معمولاً Google Meet، Zoom یا Microsoft
        Teams. جاب‌آموز خودش گفتگو برگزار نمی‌کند.
      </>
    ),
  },
  {
    q: "چطور کارشناس بشوم؟",
    a: (
      <>
        از <Link href="/signup/mentor" className="text-brand-deep hover:underline">
          همین‌جا
        </Link>{" "}
        ثبت‌نام کن، پروفایلت را کامل کن و زمان‌های آزادت را بگذار. بعد از بررسی
        ادمین، پروفایلت روی سایت منتشر می‌شود.
      </>
    ),
  },
  {
    q: "شماره تماسم را کسی می‌بیند؟",
    a: (
      <>
        نه. شماره تماس کارشناس فقط برای خودش و ادمین قابل دیدن است و هیچ‌وقت به
        کاربران نشان داده نمی‌شود. جزئیات بیشتر در{" "}
        <Link href="/privacy" className="text-brand-deep hover:underline">
          حریم خصوصی
        </Link>
        .
      </>
    ),
  },
  {
    q: "بعد از این ۲۲ دقیقه چه؟",
    a: (
      <>
        اگر هر دو خواستید ادامه بدهید، خودتان تصمیم می‌گیرید. جاب‌آموز فعلاً در
        این مرحله دخالتی ندارد.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">سؤال‌های پرتکرار</h1>

      <div className="mt-8 flex flex-col gap-3">
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl border border-card-border bg-card px-5 py-4"
          >
            <summary className="flex list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="shrink-0 text-muted transition group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-3 leading-8 text-muted">{a}</div>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        جوابت اینجا نبود؟{" "}
        <Link href="/contact" className="text-brand-deep hover:underline">
          بهمون پیام بده
        </Link>
        .
      </p>
    </div>
  );
}

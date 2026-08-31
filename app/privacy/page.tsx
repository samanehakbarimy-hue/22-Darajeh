import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حریم خصوصی — جاب‌آموز",
  description: "چه اطلاعاتی جمع می‌کنیم، چه کسی می‌بینه، و چطور حذفشون کنی.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-8 text-muted">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">حریم خصوصی</h1>
      <p className="mt-2 text-sm text-muted">
        این صفحه دقیقاً همان چیزی را می‌گوید که سایت انجام می‌دهد.
      </p>

      <Section title="چه اطلاعاتی ذخیره می‌کنیم">
        <p>
          برای همه: نام، ایمیل، و اگر عکسی بگذاری، عکس پروفایل. اگر با لینکدین
          وارد شوی، نام و عکس از همان‌جا گرفته می‌شود.
        </p>
        <p>
          برای کارشناس‌ها: سمت شغلی، کشور، معرفی، حوزه‌های تخصص، لینک لینکدین،
          شماره تماس، لینک جلسه، و زمان‌های آزادی که ثبت می‌کنی.
        </p>
        <p>
          برای درخواست جلسه: متنی که می‌نویسی، زمانی که انتخاب می‌کنی، و اینکه
          درخواست دیده، تأیید یا رد شده.
        </p>
      </Section>

      <Section title="چه کسی چه چیزی را می‌بیند">
        <p>
          پروفایل کارشناس‌های تأییدشده عمومی است: نام، عکس، سمت، کشور، معرفی و
          حوزه‌های تخصص. این‌ها روی سایت به همه نشان داده می‌شود.
        </p>
        <p>
          نام کسانی که فقط برای رزرو جلسه ثبت‌نام کرده‌اند عمومی نیست. فقط
          خودشان، ادمین، و کارشناسی که ازش درخواست جلسه داده‌اند می‌توانند ببینند.
        </p>
        <p>
          شماره تماس کارشناس هیچ‌وقت به کاربران نشان داده نمی‌شود؛ فقط خود کارشناس و
          ادمین آن را می‌بینند. لینک جلسه فقط بعد از تأیید درخواست، به همان
          شخصی که رزرو کرده نشان داده می‌شود.
        </p>
        <p>
          متن درخواستت را فقط خودت و کارشناسی که برایش فرستادی می‌بینید.
        </p>
      </Section>

      <Section title="سرویس‌هایی که استفاده می‌کنیم">
        <p>
          اطلاعات روی زیرساخت ابری ذخیره و پردازش می‌شود و ایمیل‌ها از طریق یک
          سرویس ارسال ایمیل فرستاده می‌شوند. ورود با لینکدین اختیاری است و فقط
          نام، ایمیل و عکس را در اختیار ما می‌گذارد — نه چیز دیگری.
        </p>
        <p>
          اطلاعاتت را به کسی نمی‌فروشیم و برای تبلیغات در اختیار دیگران
          نمی‌گذاریم.
        </p>
      </Section>

      {/* Google will not verify the app until the data it asks for is
          disclosed here, and a credential that can write to a calendar is
          worth saying out loud regardless. */}
      <Section title="اتصال به تقویم گوگل (اختیاری)">
        <p>
          کارشناس‌ها می‌توانند به‌دلخواه حساب گوگلشان را وصل کنند تا برای هر
          جلسه یک لینک Google Meet جداگانه ساخته شود. بدون این کار، همان لینک
          ثابت خودت استفاده می‌شود.
        </p>
        <p>
          تنها دسترسی‌ای که می‌گیریم ساختن و ویرایش رویداد در تقویم خودت است —
          نه خواندن رویدادهای دیگر، نه ایمیل، فایل‌ها یا مخاطبین. هر وقت
          بخواهی از{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="text-brand-deep hover:underline"
          >
            myaccount.google.com/permissions
          </a>{" "}
          قطعش کن.
        </p>
      </Section>
      <Section title="حذف حساب">
        <p>
          هر وقت بخواهی می‌توانی از «تنظیمات حساب» حسابت را پاک کنی. با این کار
          پروفایل، زمان‌های آزاد و درخواست‌هایت هم پاک می‌شوند و برگشتی ندارد.
        </p>
      </Section>

      <Section title="تماس با ما">
        <p>
          اگر سؤالی درباره اطلاعاتت داری یا می‌خواهی چیزی حذف شود، از صفحه{" "}
          <a href="/contact" className="text-brand-deep hover:underline">
            تماس با ما
          </a>{" "}
          بهمون بگو.
        </p>
      </Section>
    </div>
  );
}

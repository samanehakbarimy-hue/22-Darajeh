import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما — ۲۲ درجه",
  description: "سؤال، پیشنهاد، یا مشکلی در سایت؟ بهمون بگو.",
};

// One place to change the address, rather than three.
const CONTACT_EMAIL = "info@22darajeh.com";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">تماس با ما</h1>
      <p className="mt-3 leading-8 text-muted">
        سؤالی داری، پیشنهادی داری، یا جایی از سایت درست کار نمی‌کنه؟ بنویس
        برامون. جواب می‌دیم.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover"
        dir="ltr"
      >
        {CONTACT_EMAIL}
      </a>

      <div className="mt-12 border-t border-card-border pt-8">
        <h2 className="font-bold">شاید جوابت اینجا باشه</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/faq" className="text-brand hover:underline">
            سؤال‌های پرتکرار
          </Link>
          <Link href="/privacy" className="text-brand hover:underline">
            حریم خصوصی
          </Link>
          <Link href="/terms" className="text-brand hover:underline">
            قوانین استفاده
          </Link>
        </div>
      </div>
    </div>
  );
}

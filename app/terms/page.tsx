import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قوانین استفاده — ۲۲ درجه",
  description: "چه انتظاری از ۲۲ درجه داشته باش و ما چه انتظاری از تو داریم.",
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

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">قوانین استفاده</h1>
      <p className="mt-2 text-sm text-muted">
        کوتاه و بدون پیچیدگی، چون قرار نیست کسی را غافلگیر کنیم.
      </p>

      <Section title="۲۲ درجه چیست">
        <p>
          جایی برای وصل شدن آدم‌هاست: کسی که سؤال شغلی دارد، و کسی که همان کار
          را می‌کند. جلسه‌ها ۲۲ دقیقه‌ای و رایگان‌اند و بین خود دو نفر برگزار
          می‌شوند — ما در خود جلسه حضور نداریم.
        </p>
      </Section>

      <Section title="اگر متخصصی">
        <p>
          فقط زمان‌هایی را آزاد بگذار که واقعاً می‌توانی. اگر درخواستی را قبول
          کردی، سر قرار حاضر باش؛ اگر نمی‌توانی، ردش کن تا آن زمان دوباره آزاد
          شود.
        </p>
        <p>
          اطلاعاتی که در پروفایلت می‌نویسی باید درست باشد. پروفایل بعد از بررسی
          ادمین منتشر می‌شود و اگر نادرست باشد ممکن است حذف شود.
        </p>
      </Section>

      <Section title="اگر درخواست جلسه می‌دهی">
        <p>
          در معرفی‌ات بنویس واقعاً دنبال چه هستی؛ متخصص بر همان اساس تصمیم
          می‌گیرد. اگر جلسه‌ای رزرو کردی و نمی‌توانی بیایی، زودتر خبر بده.
        </p>
      </Section>

      <Section title="چیزهایی که قابل قبول نیست">
        <p>
          تبلیغات، پیام انبوه، بی‌احترامی، یا استفاده از سایت برای هر کاری جز
          راهنمایی شغلی. حسابی که این کارها را بکند بدون اطلاع قبلی بسته می‌شود.
        </p>
      </Section>

      <Section title="مسئولیت">
        <p>
          آنچه در یک جلسه گفته می‌شود نظر شخصی همان متخصص است، نه توصیه رسمی ۲۲
          درجه. تصمیم‌های شغلی‌ات با خودت است.
        </p>
      </Section>

      <Section title="تغییر این قوانین">
        <p>
          اگر چیزی عوض شود، همین‌جا به‌روز می‌شود. ادامه استفاده از سایت یعنی
          قبول نسخه تازه.
        </p>
      </Section>
    </div>
  );
}

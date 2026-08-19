import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";

const STEPS = [
  {
    title: "متخصص رو انتخاب کن",
    body: "بین متخصص‌های تأییدشده بگرد و کسی رو پیدا کن که توی حوزه سؤال تو کار می‌کنه.",
  },
  {
    title: "سؤالت رو بنویس و زمان بگیر",
    body: "یکی از زمان‌های آزادش رو بردار و بنویس دنبال چه جوابی هستی، تا آماده بیاد.",
  },
  {
    title: "۲۲ دقیقه راهنمایی بگیر",
    body: "یک تماس رایگان. اگر خواستید ادامه بدید، خودتون با هم تصمیم می‌گیرید.",
  },
];

const FIELDS = [
  "نفت و گاز",
  "توسعه نرم‌افزار",
  "طراحی UX/UI",
  "مدیریت محصول",
  "مهاجرت کاری",
  "رزومه و مصاحبه",
  "بازاریابی دیجیتال",
  "مدیریت پروژه",
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; code?: string }>;
}) {
  const { deleted, code } = await searchParams;

  // Confirmation emails sent before emailRedirectTo was set land here carrying
  // ?code=..., which only /auth/callback knows how to exchange for a session.
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const supabase = await createClient();
  const { data: specialists } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, country, bio, expertise_tags, profiles(full_name, photo_url)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-20 text-center">
        {deleted === "1" && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            حسابت با موفقیت حذف شد.
          </div>
        )}

        <span className="mb-5 rounded-full bg-brand-light px-4 py-1 text-sm font-medium text-brand">
          ۲۲ دقیقه گفتگو، رایگان
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          سؤال شغلی‌ات را از کسی بپرس که همان کار را می‌کنه.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          می‌خوای وارد یک حوزه بشی، مسیرت را عوض کنی، برای مهاجرت کاری آماده
          بشی یا بدونی یک شغل واقعاً چه شکلیه؟ ۲۲ دقیقه با متخصصی حرف بزن که
          همین حالا سرِ همان کاره.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/specialists"
            className="rounded-full bg-brand px-8 py-3 font-semibold text-background hover:bg-brand-dark"
          >
            پیدا کردن متخصص
          </Link>
          <Link
            href="/signup/mentor"
            className="rounded-full border border-card-border px-8 py-3 font-medium hover:bg-card"
          >
            متخصص شدن
          </Link>
        </div>

        {/* Fields double as the entry point to a filtered list, so they carry
            real information rather than decorating the page. */}
        <section className="mt-16 w-full max-w-3xl">
          <div className="flex flex-wrap justify-center gap-2">
            {FIELDS.map((field) => (
              <Link
                key={field}
                href={`/specialists?tag=${encodeURIComponent(field)}`}
                className="rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {field}
              </Link>
            ))}
          </div>
        </section>

        {specialists && specialists.length > 0 && (
          <section className="mt-24 w-full max-w-5xl">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="text-xl font-bold">متخصص‌های ۲۲ درجه</h2>
              <Link href="/specialists" className="text-sm text-brand hover:underline">
                دیدن همه
              </Link>
            </div>
            {/* Wrap rather than grid, so a handful of specialists sit centred
                instead of clinging to one edge of empty columns. */}
            <div className="flex flex-wrap justify-center gap-5">
              {specialists.map((specialist) => {
                const profile = specialist.profiles as unknown as {
                  full_name: string;
                  photo_url: string | null;
                } | null;
                return (
                  <div
                    key={specialist.id}
                    className="w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
                  >
                    <SpecialistCard
                      maxTags={2}
                      specialist={{
                        id: specialist.id,
                        headline: specialist.headline,
                        country: specialist.country,
                        expertise_tags: specialist.expertise_tags,
                        name: profile?.full_name ?? "",
                        photoUrl: profile?.photo_url,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-24 w-full max-w-5xl text-right">
          <h2 className="mb-8 text-center text-xl font-bold">چطور کار می‌کنه؟</h2>
          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-card-border bg-card p-6"
              >
                <span className="text-sm font-bold text-brand">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <h3 className="mt-2 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-24 w-full max-w-3xl rounded-2xl border border-card-border bg-card px-6 py-12">
          <h2 className="text-xl font-bold">تو هم می‌تونی متخصص باشی</h2>
          <p className="mx-auto mt-3 max-w-lg leading-8 text-muted">
            اگر توی کارت تجربه داری، ۲۲ دقیقه از وقتت می‌تونه مسیر یک نفر را
            عوض کنه. زمان‌هایی که خودت انتخاب می‌کنی، به همان اندازه که دوست
            داری — و اگر بعدش خواستید همکاری‌تان را ادامه بدید، خودتان تصمیم
            می‌گیرید.
          </p>
          <Link
            href="/signup/mentor"
            className="mt-8 inline-block rounded-full bg-brand px-8 py-3 font-semibold text-background hover:bg-brand-dark"
          >
            متخصص شدن
          </Link>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";
import HeroHands from "@/components/HeroHands";

// These match expertise tags specialists actually carry, so a chip leads to a
// populated list rather than an empty one.
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

const BENEFITS = [
  {
    title: "خصوصی و امن",
    body: "شماره تماس و اطلاعاتت پیش خودمان می‌ماند و با کسی قسمت نمی‌شود.",
    // Padlock.
    icon: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z",
  },
  {
    title: "۲۲ دقیقه رایگان",
    body: "این وقت را کارشناس‌ها خودشان می‌گذارند.",
    // Clock.
    icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  },
  {
    title: "کارشناس‌های تأییدشده",
    body: "هر پروفایل پیش از انتشار بررسی می‌شود.",
    // Shield with a check.
    icon: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4",
  },
  {
    title: "حرفه‌ای و واقعی",
    body: "با کسی حرف می‌زنی که همین حالا سرِ همان کار است.",
    // Two people.
    icon: "M16 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-2a4 4 0 0 0-3-3.9",
  },
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
    .limit(4);

  return (
    <main className="relative flex flex-1 flex-col px-6 pb-24 pt-10 sm:px-10">
      <HeroHands />
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {deleted === "1" && (
          <div className="mb-8 rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            حسابت با موفقیت حذف شد.
          </div>
        )}

        {/* HERO. Centred, with search as the primary action — the thing
            someone actually came to do. An illustration sat here before and
            was decoration standing in for function. */}
        <section className="mx-auto max-w-3xl pt-8 text-center sm:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-1.5 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            فرصت‌ها از زاویه‌ای تازه
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.25] tracking-tight sm:text-5xl">
            سؤال شغلی‌ات را از کسی بپرس که همان کار را می‌کنه.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted">
            می‌خوای وارد یک حوزه بشی، مسیرت را عوض کنی، برای مهاجرت کاری آماده
            بشی یا بدونی یک شغل واقعاً چه شکلیه؟ با کارشناسی حرف بزن که همین حالا
            سرِ همان کاره.
          </p>

          {/* A plain GET form, so search works without JavaScript. */}
          <form
            action="/specialists"
            className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-full border border-card-border bg-card p-2 focus-within:border-brand"
          >
            <label htmlFor="q" className="sr-only">
              جستجوی کارشناس
            </label>
            <input
              id="q"
              name="q"
              type="search"
              // Names are searchable too, but with this few specialists
              // suggesting them promises more than the list can answer.
              placeholder="دنبال چه حوزه‌ای می‌گردی؟"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              پیدا کردن
            </button>
          </form>

          <p className="mt-4 text-sm text-muted">
            ۲۲ دقیقه گفتگوی رایگان —{" "}
            <Link href="/specialists" className="text-brand-deep hover:underline">
              یا همه کارشناس‌ها را ببین
            </Link>
          </p>
        </section>

        {/* CATEGORIES */}
        <section className="mt-12">
          <div className="flex flex-wrap justify-center gap-2.5">
            {FIELDS.map((field) => (
              <Link
                key={field}
                href={`/specialists?tag=${encodeURIComponent(field)}`}
                className="rounded-full border border-card-border bg-card px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand-deep"
              >
                {field}
              </Link>
            ))}
          </div>
        </section>

        {/* SPECIALISTS */}
        {specialists && specialists.length > 0 && (
          <section className="mt-20">
            <div className="mb-7 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold">کارشناس‌های ۲۲ درجه</h2>
                <p className="mt-2 text-sm text-muted">
                  کسی را انتخاب کن که توی حوزه سؤال تو کار می‌کنه.
                </p>
              </div>
              <Link
                href="/specialists"
                className="shrink-0 text-sm text-brand-deep hover:underline"
              >
                دیدن همه ←
              </Link>
            </div>

            {/* Wrap rather than grid: with four specialists this fills the
                row, and with one it centres instead of leaving three empty
                columns beside it. */}
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

        {/* TRUST STRIP */}
        <section className="mt-20 rounded-3xl border border-card-border bg-card px-6 py-8 sm:px-10">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3.5">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-6 w-6 shrink-0 text-brand-deep"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={benefit.icon} />
                </svg>
                <div>
                  <h3 className="font-bold">{benefit.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {benefit.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

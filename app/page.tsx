import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";
import HeroHands from "@/components/HeroHands";
import TypingRoles from "@/components/TypingRoles";

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
      "id, headline, company, country, profiles!mentor_profiles_id_fkey(full_name, photo_url)",
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
            someone actually came to do.

            The headline sits above the hands and is the first thing on the
            page. The gap under it is not spare room: it is the band the hands
            reach across, which is why the paragraph starts so far down. */}
        <section className="mx-auto max-w-3xl pt-8 text-center sm:pt-14">
          <h1 className="text-4xl font-bold leading-[1.25] tracking-tight sm:text-5xl">
            هر سؤال شغلی داری، از کسی بپرس که واقعاً اون کار رو انجام می‌ده.
          </h1>

          {/* Tighter on a phone, where this wraps to two lines and the second
              one would otherwise sit exactly on the height the fingertips meet
              at. A few pixels, but they are the few that decide whether a
              sentence is above the hands or between them. */}
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
            قبل از یک تصمیم شغلی مهم، با کسی حرف بزن که خودش داخل همون حرفه کار
            می‌کنه.
          </p>

          {/* The band the hands reach across, and the reason the next thing
              starts so far down. Nothing belongs in here: the whole point of
              the picture is two hands not quite touching, and anything set
              between them fills the gap they exist to hold open. */}
          <div className="mt-[var(--hero-hands-clearance)]">
            <TypingRoles />
          </div>

          {/* A plain GET form, so search works without JavaScript. */}
          <form
            action="/specialists"
            className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full border border-card-border bg-card p-2 focus-within:border-brand-deep"
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
              placeholder="درباره چه شغلی سؤال داری؟"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              کارشناس پیدا کن
            </button>
          </form>

          <p className="mt-4 text-sm text-muted">۲۲ دقیقه گفت‌وگوی رایگان</p>
        </section>


        {/* SPECIALISTS */}
        {specialists && specialists.length > 0 && (
          <section className="mt-28 sm:mt-32">
            <div className="mb-7 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold">کارشناس‌های جاب‌آموز</h2>
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
                    // 192 to match the photo on the specialist's own page,
                    // which is h-48. These photos are LinkedIn's 100x100
                    // avatar and nothing larger can be had -- every bigger
                    // size on their CDN answers 403, because the signature
                    // covers the size in the path. So the lever is here:
                    // the less it is stretched, the less of that shows.
                    className="w-[calc(50%-10px)] max-w-[192px] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                  >
                    <SpecialistCard
                      specialist={{
                        id: specialist.id,
                        headline: specialist.headline,
                        company: specialist.company,
                        country: specialist.country,
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

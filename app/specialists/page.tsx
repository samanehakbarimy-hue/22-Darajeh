import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SpecialistRow, {
  type SpecialistRowData,
} from "@/components/SpecialistRow";
import SpecialistFilters, {
  type FilterGroup,
} from "@/components/SpecialistFilters";
import { seniorityBadge } from "@/lib/seniority";
import { JOB_FIELDS, fieldOfTitle, type JobField } from "@/lib/job-titles";
import { servicePrice, type MentorService } from "@/lib/services";
import { getUsdToToman } from "@/lib/exchange-rate";
import { dateFormats } from "@/lib/persian";

type Row = {
  id: string;
  headline: string | null;
  company: string | null;
  country: string | null;
  bio: string | null;
  expertise_tags: string[] | null;
  skills: string[] | null;
  seniority: string | null;
  profiles: unknown;
};

function profileOf(row: Row) {
  return row.profiles as {
    full_name: string | null;
    photo_url: string | null;
  } | null;
}

/**
 * Where a specialist is, as the only thing this page filters on today.
 *
 * Read off the country they chose on their own profile — the same English
 * names lib/countries.ts offers — and nothing else. Not nationality, not the
 * language they answer in, not a list of names. Somebody Iranian living in
 * Berlin is خارج از کشور, because the question a seeker is really asking is
 * who is on the ground where they want to be.
 *
 * A profile with no country set answers neither, so it appears only when
 * nothing is ticked. Guessing would be worse than saying nothing.
 */
const IRAN = "Iran";

function locationOf(row: Row): "iran" | "abroad" | null {
  if (!row.country) return null;
  return row.country === IRAN ? "iran" : "abroad";
}

/** Query parameters arrive as one value or several; the rest of the page wants a list. */
function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    loc?: string | string[];
    field?: string | string[];
  }>;
}) {
  const { q, loc, field } = await searchParams;
  const locations = asList(loc).filter((v) => v === "iran" || v === "abroad");
  const fieldKeys = new Set<string>(JOB_FIELDS.map((f) => f.key));
  const fields = asList(field).filter((v) => fieldKeys.has(v)) as JobField[];
  const supabase = await createClient();

  // One query for the whole approved set. The filters then run in memory: the
  // name lives on the joined profiles row, which PostgREST cannot filter
  // across, so a database search would quietly skip the field people are most
  // likely to type. Worth revisiting past a few hundred specialists.
  const { data } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, company, country, bio, expertise_tags, skills, seniority, profiles!mentor_profiles_id_fkey(full_name, photo_url)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const approved = (data ?? []) as Row[];

  const needle = q?.trim().toLowerCase() ?? "";
  function matchesSearch(row: Row): boolean {
    if (!needle) return true;
    return [
      profileOf(row)?.full_name,
      row.headline,
      row.company,
      row.bio,
      row.country,
      ...(row.expertise_tags ?? []),
      ...(row.skills ?? []),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle));
  }

  const searched = approved.filter(matchesSearch);

  // Counted against what the search left, not against everybody: the number
  // beside a checkbox should say what ticking it would actually give you.
  //
  // Every field is listed, including the ones nobody is in yet: the list is
  // the site saying which fields it is for.
  //
  // Without a count beside it, deliberately. A number here is a headcount by
  // another route — «۰» beside ten fields and «۱» beside one says how new this
  // is more plainly than the total ever did.
  const groups: FilterGroup[] = [
    {
      key: "field",
      title: "حوزه کاری",
      options: JOB_FIELDS.map(({ key, label }) => ({
        value: key as string,
        label,
      })),
    },
    {
      key: "loc",
      title: "موقعیت کارشناس",
      options: [
        { value: "iran", label: "ایران" },
        { value: "abroad", label: "خارج از کشور" },
      ],
    },
  ];

  const specialists = searched.filter((row) => {
    if (fields.length > 0) {
      const belongs = fieldOfTitle(row.headline);
      if (belongs === null || !fields.includes(belongs)) return false;
    }
    if (locations.length === 0) return true;
    const where = locationOf(row);
    return where !== null && locations.includes(where);
  });

  const isFiltered =
    Boolean(needle) || locations.length > 0 || fields.length > 0;

  /**
   * How near a specialist came to what was asked for.
   *
   * Only ever used when the search matched nobody, and only to order the few
   * profiles offered underneath instead of an empty page. Every criterion is
   * scored separately, so somebody who is in the right field but the wrong
   * country still counts as close — which is exactly the person worth showing
   * when the two together found no one.
   *
   * A word only counts if it is written somewhere on the profile. Nothing here
   * guesses at meaning: this is "you asked for four things and this person is
   * three of them", not a claim to understand the question.
   */
  function nearness(row: Row): number {
    const haystack = [
      profileOf(row)?.full_name,
      row.headline,
      row.company,
      row.bio,
      row.country,
      ...(row.expertise_tags ?? []),
      ...(row.skills ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of needle.split(/\s+/).filter((w) => w.length > 1)) {
      if (haystack.includes(word)) score += 2;
    }
    const belongs = fieldOfTitle(row.headline);
    if (belongs !== null && fields.includes(belongs)) score += 3;
    const where = locationOf(row);
    if (where !== null && locations.includes(where)) score += 1;
    return score;
  }

  // Sorted, not filtered: a score of zero still beats an empty page, and the
  // sort is stable, so when nothing is nearer than anything else this is
  // simply the newest few. Three, because this is a consolation and not the
  // page's answer.
  const suggestions =
    isFiltered && specialists.length === 0
      ? [...approved].sort((a, b) => nearness(b) - nearness(a)).slice(0, 3)
      : [];

  // Both sets, so the cards below the empty state are as complete as the ones
  // above it would have been.
  const ids = [
    ...new Set([...specialists, ...suggestions].map((row) => row.id)),
  ];
  const now = new Date().toISOString();

  // Everything the cards need, fetched for the whole page rather than per
  // card. Reviews and active services are publicly readable, and so are the
  // slots of an approved mentor, so these are three queries whatever the
  // result count is.
  const [reviewsResult, servicesResult, slotsResult, usdRate] =
    await Promise.all([
      ids.length
        ? supabase.from("reviews").select("mentor_id, rating").in("mentor_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("mentor_services")
            .select(
              "id, mentor_id, kind, session_key, title, description, minutes, min_hours, price_toman, price_usd, is_active, is_negotiable",
            )
            .in("mentor_id", ids)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("availability_slots")
            .select("mentor_id, start_time")
            .in("mentor_id", ids)
            .eq("is_booked", false)
            .gte("start_time", now)
            .order("start_time", { ascending: true })
        : Promise.resolve({ data: [] }),
      getUsdToToman(),
    ]);

  const ratings = new Map<string, { total: number; count: number }>();
  for (const review of (reviewsResult.data ?? []) as {
    mentor_id: string;
    rating: number;
  }[]) {
    const seen = ratings.get(review.mentor_id) ?? { total: 0, count: 0 };
    seen.total += review.rating;
    seen.count += 1;
    ratings.set(review.mentor_id, seen);
  }

  // The cheapest thing somebody could book, so the card can say "from". A
  // negotiable project rate has no number to compare, and is left out rather
  // than counted as free.
  const cheapest = new Map<string, { toman: number; service: MentorService }>();
  for (const service of (servicesResult.data ?? []) as (MentorService & {
    mentor_id: string;
  })[]) {
    if (service.is_negotiable) continue;
    const price = servicePrice(service, usdRate);
    if (!price) continue;
    const toman =
      usdRate && service.price_usd
        ? service.price_usd * usdRate
        : (service.price_toman ?? 0);
    if (toman <= 0) continue;
    const best = cheapest.get(service.mentor_id);
    if (!best || toman < best.toman) {
      cheapest.set(service.mentor_id, { toman, service });
    }
  }

  // Ordered by time already, so the first row for a mentor is their soonest.
  const nextSlot = new Map<string, string>();
  for (const slot of (slotsResult.data ?? []) as {
    mentor_id: string;
    start_time: string;
  }[]) {
    if (!nextSlot.has(slot.mentor_id)) nextSlot.set(slot.mentor_id, slot.start_time);
  }

  // Sessions actually held. One call each, in parallel, because the count
  // lives behind a definer function — bookings are not readable across users
  // and deliberately so. Bounded by what this page shows; revisit alongside
  // the in-memory filtering above.
  const heldCounts = await Promise.all(
    ids.map(async (id) => {
      const { data: held } = await supabase.rpc("held_session_count", {
        mentor: id,
      });
      return [id, typeof held === "number" ? held : 0] as const;
    }),
  );
  const held = new Map(heldCounts);

  function toCard(row: Row): SpecialistRowData {
    const profile = profileOf(row);
    const rating = ratings.get(row.id);
    const best = cheapest.get(row.id);
    const slot = nextSlot.get(row.id);

    return {
      id: row.id,
      name: profile?.full_name ?? "",
      photoUrl: profile?.photo_url,
      headline: row.headline,
      company: row.company,
      country: row.country,
      bio: row.bio,
      // Tools first — they are the specific ones — then the broader fields,
      // with anything named twice kept once.
      tags: [...new Set([...(row.skills ?? []), ...(row.expertise_tags ?? [])])],
      seniority: seniorityBadge(row.seniority),
      heldSessions: held.get(row.id) ?? 0,
      rating: rating
        ? { average: rating.total / rating.count, count: rating.count }
        : null,
      startingPrice: best ? (servicePrice(best.service, usdRate)?.toman ?? null) : null,
      nextSlotLabel: slot ? dateFormats.day.format(new Date(slot)) : null,
    };
  }

  return (
    // Wide and centred: this is a results page, not a column of prose.
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold">پیدا کردن کارشناس</h1>
        <p className="mt-2 max-w-2xl leading-7 text-muted">
          حوزه سؤالت را انتخاب کن و ۲۲ دقیقه رایگان با کسی حرف بزن که همین حالا
          توی همان حوزه کار می‌کنه.
        </p>
      </header>

      <form
        action="/specialists"
        className="mt-6 flex items-center gap-2 rounded-full border border-card-border bg-card p-2 focus-within:border-brand-deep"
      >
        {/* The ticked filters ride along, so searching does not silently
            undo them. */}
        {locations.map((value) => (
          <input key={value} type="hidden" name="loc" value={value} />
        ))}
        {fields.map((value) => (
          <input key={value} type="hidden" name="field" value={value} />
        ))}
        <label htmlFor="q" className="sr-only">
          جستجوی کارشناس
        </label>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="ms-3 h-4 w-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="جستجو بر اساس نام، سمت، شرکت یا مهارت"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on transition hover:bg-brand-hover"
        >
          پیدا کردن
        </button>
      </form>

      {/* Filters sit on the left and results on the right, which on an RTL
          page means the results come first in the source and are moved over
          at desktop width. On a phone the order in the source is the order on
          the screen, and the filter button belongs above what it filters. */}
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-8">
        <div className="lg:order-2">
          <SpecialistFilters
            groups={groups}
            selected={{ loc: locations, field: fields }}
            query={q?.trim() ?? ""}
          />
        </div>

        <div className="lg:order-1">
          {/* No count. How many specialists are here is the site's business,
              not the visitor's — and at this stage saying it out loud only
              tells somebody how early they are. The way back out of a search
              still belongs here, so the row stays when there is one. */}
          {isFiltered && (
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
              <p className="text-sm text-muted">نتیجه جستجو</p>
              <Link
                href="/specialists"
                className="text-sm text-brand-deep underline underline-offset-4 hover:no-underline"
              >
                پاک کردن جستجو
              </Link>
            </div>
          )}

          {specialists.length > 0 ? (
            <div className="flex flex-col gap-4">
              {specialists.map((row) => (
                <SpecialistRow key={row.id} specialist={toCard(row)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-card-border bg-card p-10 text-center">
              <h2 className="text-lg font-bold">
                {isFiltered
                  ? "کارشناسی با این جستجو پیدا نشد"
                  : "هنوز کارشناسی تأیید نشده"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {isFiltered
                  ? "جستجو یا فیلترها را عوض کن و دوباره ببین."
                  : "به‌زودی اینجا پر می‌شه!"}
              </p>
              {isFiltered && (
                <Link
                  href="/specialists"
                  className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on transition hover:bg-brand-hover"
                >
                  دیدن همه کارشناس‌ها
                </Link>
              )}
            </div>
          )}

          {/* Nobody leaves with nothing. The nearest few profiles go under the
              box rather than inside it, so they read as an offer rather than
              as results — they did not match, and the heading says so. */}
          {suggestions.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold">کارشناس‌های دیگر</h2>
              <p className="mt-1 text-sm text-muted">
                شاید یکی از این‌ها به سؤالت نزدیک باشه.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {suggestions.map((row) => (
                  <SpecialistRow key={row.id} specialist={toCard(row)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

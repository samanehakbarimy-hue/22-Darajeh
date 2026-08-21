import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";

type Row = {
  id: string;
  headline: string | null;
  country: string | null;
  bio: string | null;
  expertise_tags: string[] | null;
  profiles: unknown;
};

function nameOf(row: Row) {
  const profile = row.profiles as {
    full_name: string | null;
    photo_url: string | null;
  } | null;
  return profile;
}

function CardGrid({ rows }: { rows: Row[] }) {
  return (
    // Wrap rather than grid, so a handful of specialists sit centred instead
    // of clinging to one edge of empty columns.
    <div className="mt-8 flex flex-wrap justify-center gap-5">
      {rows.map((row) => {
        const profile = nameOf(row);
        return (
          <div
            key={row.id}
            className="w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          >
            <SpecialistCard
              specialist={{
                id: row.id,
                headline: row.headline,
                country: row.country,
                expertise_tags: row.expertise_tags,
                name: profile?.full_name ?? "",
                photoUrl: profile?.photo_url,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;
  const supabase = await createClient();

  // One query for the whole approved set. Both filters then run in memory:
  // the name lives on the joined profiles row, which PostgREST cannot filter
  // across, so a database search would quietly skip the field people are most
  // likely to type. Worth revisiting past a few hundred specialists.
  const { data } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, country, bio, expertise_tags, profiles(full_name, photo_url)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const approved = (data ?? []) as Row[];

  const availableTags = [
    ...new Set(approved.flatMap((row) => row.expertise_tags ?? [])),
  ].sort();

  const needle = q?.trim().toLowerCase() ?? "";
  const specialists = approved.filter((row) => {
    if (tag && !(row.expertise_tags ?? []).includes(tag)) return false;
    if (!needle) return true;
    return [
      nameOf(row)?.full_name,
      row.headline,
      row.bio,
      row.country,
      ...(row.expertise_tags ?? []),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle));
  });

  const isFiltered = Boolean(needle || tag);
  const foundNothing = specialists.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">پیدا کردن متخصص</h1>
      <p className="mt-2 text-muted">
        حوزه‌ای که سؤالت درباره‌شه رو انتخاب کن و ۲۲ دقیقه رایگان با کسی حرف بزن
        که همین حالا توی همان حوزه کار می‌کنه.
      </p>

      <form
        action="/specialists"
        className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-card-border bg-card p-2 focus-within:border-brand"
      >
        <label htmlFor="q" className="sr-only">
          جستجوی متخصص
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          // Names and companies are searchable too, but with this few
          // specialists suggesting them would promise more than the list can
          // answer — and there is no company field at all.
          placeholder="دنبال چه حوزه‌ای می‌گردی؟"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
        >
          پیدا کردن
        </button>
      </form>

      {availableTags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/specialists"
            className={`rounded-full border px-4 py-2 text-sm transition ${
              tag
                ? "border-card-border text-muted hover:border-brand hover:text-brand"
                : "border-brand bg-brand-light text-brand"
            }`}
          >
            همه
          </Link>
          {availableTags.map((available) => (
            <Link
              key={available}
              href={`/specialists?tag=${encodeURIComponent(available)}`}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                tag === available
                  ? "border-brand bg-brand-light text-brand"
                  : "border-card-border text-muted hover:border-brand hover:text-brand"
              }`}
            >
              {available}
            </Link>
          ))}
        </div>
      )}

      {/* A search that finds nothing is the common case while the list is
          short, so it gets a real answer: what to drop, and the specialists
          there are — rather than a dead end. */}
      {foundNothing && isFiltered && (
        <div className="mt-10 rounded-2xl border border-card-border bg-card p-8">
          <h2 className="text-xl font-bold">متخصصی با این جستجو پیدا نشد</h2>
          <p className="mt-3 text-sm text-muted">یکی از این‌ها را بردار:</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {needle && (
              <Link
                href={
                  tag
                    ? `/specialists?tag=${encodeURIComponent(tag)}`
                    : "/specialists"
                }
                className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
              >
                جستجو: «{q}»<span aria-hidden>×</span>
              </Link>
            )}
            {tag && (
              <Link
                href={
                  needle
                    ? `/specialists?q=${encodeURIComponent(q ?? "")}`
                    : "/specialists"
                }
                className="inline-flex items-center gap-2 rounded-full border border-card-border px-4 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
              >
                حوزه: «{tag}»<span aria-hidden>×</span>
              </Link>
            )}
          </div>

          <p className="mt-4 text-sm text-muted">
            یا با کلمه‌های کلی‌تر بگرد و املای کلمه را یک بار دیگر ببین.
          </p>

          <Link
            href="/specialists"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
          >
            پاک کردن جستجو
          </Link>
        </div>
      )}

      {foundNothing && !isFiltered && (
        <p className="mt-10 text-muted">
          هنوز متخصصی تأیید نشده. به‌زودی اینجا پر می‌شه!
        </p>
      )}

      {!foundNothing && <CardGrid rows={specialists} />}

      {/* Nobody should leave empty-handed: if the search matched no one, show
          who is actually here instead. */}
      {foundNothing && approved.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold">متخصص‌های ۲۲ درجه</h2>
          <p className="mt-1 text-sm text-muted">
            شاید یکی از این‌ها به سؤالت نزدیک باشه.
          </p>
          <CardGrid rows={approved} />
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("mentor_profiles")
    .select(
      "id, headline, country, bio, expertise_tags, profiles(full_name, photo_url)",
    )
    .eq("status", "approved");

  if (tag) {
    query = query.contains("expertise_tags", [tag]);
  }

  const { data: allMatching } = await query.order("created_at", {
    ascending: false,
  });

  // Free-text search runs in memory: the name lives on the joined profiles
  // row, which PostgREST cannot filter across, and at this size matching
  // every field here is simpler and more correct than an OR of ilikes.
  // Worth revisiting past a few hundred specialists.
  const needle = q?.trim().toLowerCase() ?? "";
  const specialists = !needle
    ? allMatching
    : (allMatching ?? []).filter((row) => {
        const profile = row.profiles as unknown as {
          full_name: string | null;
        } | null;
        return [
          profile?.full_name,
          row.headline,
          row.bio,
          row.country,
          ...(row.expertise_tags ?? []),
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle));
      });

  // Offer the fields people can actually filter by, drawn from what the
  // approved specialists have listed rather than a hardcoded list.
  const { data: allApproved } = await supabase
    .from("mentor_profiles")
    .select("expertise_tags")
    .eq("status", "approved");

  const availableTags = [
    ...new Set((allApproved ?? []).flatMap((row) => row.expertise_tags ?? [])),
  ].sort();

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
          placeholder="اسم، شرکت، یا حوزه کاری"
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

      {(!specialists || specialists.length === 0) && (
        <p className="mt-10 text-muted">
          {needle
            ? `برای «${q}» متخصصی پیدا نشد.`
            : tag
              ? `فعلاً متخصصی در حوزه «${tag}» نیست.`
              : "هنوز متخصصی تأیید نشده. به‌زودی اینجا پر می‌شه!"}
        </p>
      )}

      {/* Wrap rather than grid, so a handful of specialists sit centred
          instead of clinging to one edge of empty columns. */}
      <div className="mt-10 flex flex-wrap justify-center gap-5">
        {specialists?.map((specialist) => {
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
    </div>
  );
}

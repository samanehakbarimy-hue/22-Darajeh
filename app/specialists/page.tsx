import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
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

  const { data: specialists } = await query.order("created_at", {
    ascending: false,
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
        یکی از متخصص‌های ۲۲ درجه رو انتخاب کن و یک تماس رایگان ۲۲ دقیقه‌ای رزرو
        کن.
      </p>

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
          {tag
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

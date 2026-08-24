import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { dateFormats } from "@/lib/persian";
import ServiceBooking from "@/components/ServiceBooking";
import type { MentorService } from "@/lib/services";
import { seniorityBadge } from "@/lib/seniority";

export default async function SpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: specialist } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, country, bio, expertise_tags, linkedin_url, seniority, status, profiles(full_name, photo_url, created_at)",
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!specialist) {
    notFound();
  }

  const now = new Date().toISOString();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time")
    .eq("mentor_id", id)
    .eq("is_booked", false)
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(1);

  const nextSlot = slots?.[0]?.start_time ?? null;

  const profile = specialist.profiles as unknown as {
    full_name: string;
    photo_url: string | null;
    created_at: string;
  } | null;
  const name = profile?.full_name ?? "";
  const tags = specialist.expertise_tags ?? [];

  // Only the active ones, and an unapplied migration must not take the
  // whole profile down — the free call is the important part of this page.
  const { data: serviceRows } = await supabase
    .from("mentor_services")
    .select(
      "id, kind, session_key, title, description, minutes, min_hours, price_toman, is_active, is_negotiable",
    )
    .eq("mentor_id", id)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  // Fetched here, not in the client component: it is a network call, and
  // Next caches it for six hours across every render.

  // The one claim on this page the specialist cannot write themselves.
  const { data: heldSessions } = await supabase.rpc("held_session_count", {
    mentor: id,
  });

  const timeFormatter = dateFormats.full;

  return (
    /*
     * One column, following how MentorCruise and the rest of this category
     * actually lay a profile out.
     *
     * Two columns of unequal height cannot avoid ragged whitespace, and ours
     * shifted every time the service tabs changed length — the sessions list
     * is taller than the project row, so the gap appeared and disappeared as
     * you clicked. One column has no second column to fall short of.
     *
     * No banner either. The gradient strip existed to give the page a top
     * edge, but it pushed the avatar down into it and left a band of empty
     * colour above the name.
     */
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/specialists"
        className="inline-block py-1 text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به فهرست متخصص‌ها
      </Link>

      <div className="mt-4 rounded-2xl border border-card-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <Avatar photoUrl={profile?.photo_url} name={name} size={96} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            {specialist.headline && (
              <p className="mt-1 leading-7 text-muted">{specialist.headline}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              {seniorityBadge(specialist.seniority) && (
                <span>{seniorityBadge(specialist.seniority)}</span>
              )}
              {specialist.country && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {specialist.country}
                </span>
              )}
              {/* Hidden at zero: "۰ گفتگو" draws the eye to the one number a
                  new specialist can do nothing about. */}
              {typeof heldSessions === "number" && heldSessions > 0 && (
                <span className="text-success">
                  {heldSessions.toLocaleString("fa-IR")} گفتگوی انجام‌شده
                </span>
              )}
              {specialist.linkedin_url && (
                <a
                  href={specialist.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-1 hover:text-brand"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.6 8.75 22 11 22 14v7h-4v-6.2c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9Z" />
                  </svg>
                  لینکدین
                </a>
              )}
            </div>

            {/* Chips, not a titled box of their own. One tag does not deserve
                a card, and the reference profiles all keep skills beside the
                name rather than below the fold. */}
            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-light px-3 py-1 text-xs text-brand"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ServiceBooking
          specialistId={specialist.id}
          hasSlots={Boolean(slots && slots.length > 0)}
          // Formatted here rather than in the client component: the server
          // pins Tehran, and a device in another zone would print its own.
          services={(serviceRows ?? []) as MentorService[]}
          nearestSlotLabel={
            nextSlot ? timeFormatter.format(new Date(nextSlot)) : null
          }
        />
      </div>

      {specialist.bio && (
        <div className="mt-6 rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">درباره من</h2>
          <p className="mt-3 whitespace-pre-line leading-8 text-muted">
            {specialist.bio}
          </p>
        </div>
      )}
    </div>
  );
}

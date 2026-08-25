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
      "id, headline, company, country, bio, expertise_tags, skills, linkedin_url, seniority, status, profiles(full_name, photo_url, created_at)",
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

  // Sessions this specialist has actually held. Slots for approved mentors are
  // publicly readable, so this is real rather than a number we invented.
  const { count: heldCount } = await supabase
    .from("availability_slots")
    .select("id", { count: "exact", head: true })
    .eq("mentor_id", id)
    .eq("is_booked", true)
    .lt("start_time", now);

  const profile = specialist.profiles as unknown as {
    full_name: string;
    photo_url: string | null;
    created_at: string;
  } | null;
  const name = profile?.full_name ?? "";
  const tags = specialist.expertise_tags ?? [];
  const skills = specialist.skills ?? [];
  const held = heldCount ?? 0;

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
    // Wider than the reading pages. This one is two columns of cards, not a
    // column of prose, so 1024px left a third of a normal screen empty on each
    // side — the reference profiles run nearly edge to edge.
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <Link
        href="/specialists"
        className="inline-block py-1 text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به فهرست کارشناس‌ها
      </Link>

      {/* Two columns from the top, not from below the header. The header was
          full width with the name pinned to the start, so more than half of it
          was empty by construction — and the one thing anyone came here to do
          sat below the fold. */}
      <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">

      <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
        {/* The tinted band carries the whole identity and nothing else:
            portrait, name, role. It used to be a bare strip with the content
            hauled up into it by a negative margin, which left its lower edge
            running straight through the role line. */}
        <div className="bg-gradient-to-l from-brand/12 via-brand/5 to-transparent px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Avatar photoUrl={profile?.photo_url} name={name} size={104} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{name}</h1>
              {/* Role and employer on one line, the way every profile in this
                  category writes it. The half after "در" is usually what makes
                  the line worth reading. */}
              {(specialist.headline || specialist.company) && (
                <p className="mt-1 text-foreground/75">
                  {specialist.headline}
                  {specialist.headline && specialist.company && " در "}
                  {specialist.company && (
                    <span className="text-foreground">{specialist.company}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two rows, not one. These are two kinds of fact — who the person is,
            and what they work in — and running them together meant the line
            broke wherever it happened to run out of room, stranding a single
            tag on a line of its own. Split, each row is short enough to hold,
            and where one does wrap it wraps among its own kind. */}
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {seniorityBadge(specialist.seniority) && (
              <span className="rounded-full border border-card-border px-3 py-1 text-xs text-muted">
                {seniorityBadge(specialist.seniority)}
              </span>
            )}

            {specialist.country && (
              <span className="inline-flex items-center gap-1 rounded-full border border-card-border px-3 py-1 text-xs text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {specialist.country}
              </span>
            )}

            {/* Hidden at zero. "۰ گفتگو" is worse than saying nothing: it draws
                attention to the one number a new کارشناس cannot do anything
                about yet. */}
            {typeof heldSessions === "number" && heldSessions > 0 && (
              <span className="rounded-full bg-success-light px-3 py-1 text-xs text-success">
                {heldSessions.toLocaleString("fa-IR")} گفتگوی انجام‌شده
              </span>
            )}

          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-light px-3 py-1 text-xs text-brand-deep"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          </div>

          {specialist.linkedin_url && (
            <a
              href={specialist.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand-deep"
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
      </div>

      <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">درباره من</h2>
          <p className="mt-3 whitespace-pre-line leading-8 text-muted">
            {specialist.bio}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-card-border pt-6 text-sm empty:hidden empty:border-0 empty:pt-0">
            {held > 0 && (
              <div>
                <div className="font-bold">
                  {held.toLocaleString("fa-IR")} جلسه
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  تا حالا برگزار کرده
                </div>
              </div>
            )}
          </div>
        </div>

      {skills.length > 0 && (
        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">مهارت‌ها و ابزارها</h2>
          {/* Under the bio, not above it: the introduction is what someone
              reads, and these are what they check it against. "نفت و گاز"
              says almost nothing on its own; PV Elite and ASME VIII say
              whether this is the person who can answer the question. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <span
                key={skill}
                className="rounded-full border border-card-border px-3 py-1.5 text-sm text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

        </div>

        {/* Placed explicitly rather than by source order: beside the header on
            a wide screen, and between the name and the bio once the columns
            stack, so the one thing anyone can act on is not three cards down a
            phone. */}
        <aside className="h-fit lg:sticky lg:top-6">
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
        </aside>
      </div>

    </div>
  );
}

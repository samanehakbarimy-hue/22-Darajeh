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
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link
        href="/specialists"
        className="inline-block py-1 text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به فهرست متخصص‌ها
      </Link>

      {/* Two columns from the top, not from below the header. The header was
          full width with the name pinned to the start, so more than half of it
          was empty by construction — and the one thing anyone came here to do
          sat below the fold. */}
      <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">

      <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
        {/* A banner gives the page a top edge to sit against; without one the
            name floated in empty space. */}
        <div className="h-28 bg-gradient-to-l from-brand/25 via-brand/10 to-transparent sm:h-36" />

        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="shrink-0 rounded-full ring-4 ring-card">
                <Avatar photoUrl={profile?.photo_url} name={name} size={104} />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">{name}</h1>
                {specialist.headline && (
                  <p className="mt-0.5 text-muted">{specialist.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {seniorityBadge(specialist.seniority) && (
                    <span className="inline-block rounded-full border border-card-border px-3 py-1 text-xs text-muted">
                      {seniorityBadge(specialist.seniority)}
                    </span>
                  )}
                  {/* Hidden at zero. "۰ گفتگو" is worse than saying nothing:
                      it draws attention to the one number a new specialist
                      cannot do anything about yet. */}
                  {typeof heldSessions === "number" && heldSessions > 0 && (
                    <span className="inline-block rounded-full bg-success-light px-3 py-1 text-xs text-success">
                      {heldSessions.toLocaleString("fa-IR")} گفتگوی انجام‌شده
                    </span>
                  )}
                </div>

                {specialist.country && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
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
                  </p>
                )}
              </div>
            </div>

            {specialist.linkedin_url && (
              <a
                href={specialist.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
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
      </div>

      {tags.length > 0 && (
        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">حوزه‌های تخصص</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

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

        </div>

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

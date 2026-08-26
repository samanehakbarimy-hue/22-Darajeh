import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateFormats } from "@/lib/persian";
import ServiceBooking from "@/components/ServiceBooking";
import type { MentorService } from "@/lib/services";
import { seniorityBadge } from "@/lib/seniority";
import SaveSpecialist from "@/components/SaveSpecialist";
import { getCurrentUser } from "@/lib/auth";

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
      "id, headline, company, country, bio, expertise_tags, skills, linkedin_url, seniority, status, admin_summary, profiles!mentor_profiles_id_fkey(full_name, photo_url, created_at)",
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

  // The one claim on this page written by somebody other than the specialist.
  const { data: reviewRows } = await supabase.rpc("mentor_reviews", {
    mentor: id,
  });

  type Review = {
    id: string;
    rating: number;
    body: string;
    created_at: string;
    seeker_name: string | null;
  };

  const reviews = (reviewRows ?? []) as Review[];
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  // Whether this visitor has kept this specialist. Private to them: the
  // policy on saved_specialists only ever matches their own rows.
  const viewer = await getCurrentUser();
  const { data: savedRow } = viewer
    ? await supabase
        .from("saved_specialists")
        .select("mentor_id")
        .eq("seeker_id", viewer.id)
        .eq("mentor_id", id)
        .maybeSingle()
    : { data: null };

  const timeFormatter = dateFormats.full;
  const dayFormatter = dateFormats.fullDate;

  return (
    // Wide, because this page is a profile beside a decision panel rather than
    // a column of prose.
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ۲۲ درجه
        </Link>
        <span aria-hidden>‹</span>
        <Link href="/specialists" className="hover:text-foreground">
          پیدا کردن کارشناس
        </Link>
        <span aria-hidden>‹</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="mt-8 grid grid-cols-1 items-start gap-10 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_430px]">
        <div className="flex flex-col gap-10">
          {/* The portrait is square and large. A profile is a person, and a
              104px circle beside a heading read as a row in a list. */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt={name}
                className="h-48 w-48 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-6xl font-bold text-brand-deep">
                {name.slice(0, 1)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {typeof heldSessions === "number" && heldSessions > 0 && (
                <span className="inline-block rounded-full bg-success-light px-3 py-1 text-xs text-success">
                  {heldSessions.toLocaleString("fa-IR")} گفت‌وگوی انجام‌شده
                </span>
              )}

              <h1 className="mt-2 text-4xl font-bold">{name}</h1>

              {(specialist.headline || specialist.company) && (
                <p className="mt-2 text-lg text-brand-deep">
                  {specialist.headline}
                  {specialist.headline && specialist.company && " در "}
                  {specialist.company}
                </p>
              )}

              <SaveSpecialist
                specialistId={specialist.id}
                saved={Boolean(savedRow)}
                signedIn={Boolean(viewer)}
                linkedinUrl={specialist.linkedin_url}
              />

              {/* Where they are and how long they have been at it: two
                  short facts that belong beside the name, not in a column
                  of their own. */}
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                {specialist.country && <span>{specialist.country}</span>}
                {specialist.country && seniorityBadge(specialist.seniority) && (
                  <span aria-hidden>·</span>
                )}
                {seniorityBadge(specialist.seniority) && (
                  <span>{seniorityBadge(specialist.seniority)}</span>
                )}
              </p>
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <h2 className="font-bold">مهارت‌ها و ابزارها</h2>
              {/* Coloured now that the field chips have gone from this page:
                  these are the words somebody scans for, and grey outlines
                  read as disabled. */}
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand-deep"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {specialist.admin_summary && (
            <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">معرفی ۲۲ درجه</h2>
              <p className="mt-4 whitespace-pre-line leading-8 text-muted">
                {specialist.admin_summary}
              </p>
              {reviews.length > 0 && (
                <p className="mt-4 border-t border-card-border pt-4 text-xs text-muted">
                  بر پایه‌ی {reviews.length.toLocaleString("fa-IR")} نظر ثبت‌شده
                  از کسانی که وقت گرفتند.
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-card-border bg-card shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold">درباره من</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted">
              {specialist.bio}
            </p>

            {held > 0 && (
              <p className="mt-6 border-t border-card-border pt-5 text-sm text-muted">
                تا حالا{" "}
                <span className="font-bold text-foreground">
                  {held.toLocaleString("fa-IR")} جلسه
                </span>{" "}
                برگزار کرده.
              </p>
            )}
          </div>
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-xl font-bold">نظر کسانی که وقت گرفتند</h2>
                {averageRating !== null && (
                  <p className="text-sm text-muted">
                    <span className="font-bold text-foreground">
                      {averageRating.toLocaleString("fa-IR", {
                        maximumFractionDigits: 1,
                      })}
                    </span>{" "}
                    از ۵ — {reviews.length.toLocaleString("fa-IR")} نظر
                  </p>
                )}
              </div>

              <ul className="mt-6 flex flex-col gap-6">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="border-b border-card-border pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium">
                        {review.seeker_name ?? "یک متقاضی"}
                      </span>
                      <span
                        className="text-sm text-brand-deep"
                        aria-label={`${review.rating} از ۵`}
                      >
                        {"★".repeat(review.rating)}
                        <span className="text-muted">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </span>
                      <span className="text-xs text-muted">
                        {dayFormatter.format(new Date(review.created_at))}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line leading-8 text-muted">
                      {review.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* The decision panel, pinned beside the profile on a wide screen and
            sitting under the name once the columns stack. */}
        <aside className="h-fit md:sticky md:top-6">
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

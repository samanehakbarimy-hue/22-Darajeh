import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import RequestMessage from "../request-message";
import CancelBooking from "@/components/CancelBooking";
import { dateFormats, sessionTiming } from "@/lib/persian";

// Each status carries a mark as well as a colour. Simulated against
// deuteranopia the green and red chips land at a 1.10 luminance ratio — all
// but identical — and the filled/outlined difference is no clearer at 1.07.
// Whether a request was accepted or rejected is the thing people scan for,
// so it cannot rest on hue alone.
const STATUS = {
  pending: {
    mark: "…",
    label: "در انتظار جواب",
    className: "border border-card-border text-muted",
  },
  confirmed: {
    mark: "✓",
    label: "تأیید شده",
    className: "bg-success-light text-success",
  },
  declined: {
    mark: "✕",
    label: "رد شده",
    className: "border border-red-400/40 text-red-400",
  },
  cancelled: {
    mark: "✕",
    label: "لغو شده",
    className: "border border-card-border text-muted",
  },
} as const;

export default async function MyRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/requests");
  }

  // Everything ever sent, newest first — a request that was declined or has
  // already happened is still part of the record.
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, mentor_id, status, message, seen_at, edited_at, created_at, meeting_link, cancelled_by, cancel_reason, availability_slots(start_time, end_time), mentor_profiles(headline, profiles(full_name, photo_url))",
    )
    .eq("seeker_id", user.id)
    .order("created_at", { ascending: false });

  const rows = bookings ?? [];

  const mentorIds = rows
    .filter((b) => b.status === "confirmed")
    .map((b) => b.mentor_id);
  const { data: links } = mentorIds.length
    ? await supabase
        .from("mentor_meeting_links")
        .select("id, meeting_link")
        .in("id", mentorIds)
    : { data: [] };
  const linkById = new Map(
    (links ?? []).map((l) => [l.id, l.meeting_link] as const),
  );

  const timeFormatter = dateFormats.full;
  const sentFormatter = dateFormats.shortDay;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">درخواست‌های من</h1>
      <p className="mt-2 text-muted">
        هر درخواستی که فرستادی، برای چه کسی و چه زمانی، و جوابی که گرفتی.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-card-border bg-card p-10 text-center">
          <p className="text-muted">هنوز درخواستی نفرستادی.</p>
          <Link
            href="/specialists"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
          >
            پیدا کردن متخصص
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((b) => {
            const mentor = b.mentor_profiles as unknown as {
              headline: string | null;
              profiles: { full_name: string; photo_url: string | null } | null;
            } | null;
            const slot = b.availability_slots as unknown as {
              start_time: string;
              end_time: string | null;
            } | null;
            const name = mentor?.profiles?.full_name ?? "";
            const status =
              STATUS[b.status as keyof typeof STATUS] ?? STATUS.pending;
            // A link generated for this booking beats the specialist's
            // permanent one: it is theirs alone, and nobody else is in it.
            const meetingLink =
              (b.meeting_link as string | null) ??
              linkById.get(b.mentor_id) ??
              null;

            return (
              <li
                key={b.id}
                className="rounded-2xl border border-card-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/specialists/${b.mentor_id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar
                      photoUrl={mentor?.profiles?.photo_url}
                      name={name}
                      size={44}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{name}</p>
                      {mentor?.headline && (
                        <p className="truncate text-xs text-muted">
                          {mentor.headline}
                        </p>
                      )}
                    </div>
                  </Link>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${status.className}`}
                  >
                    <span aria-hidden>{status.mark}</span> {status.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {slot && (
                    <span className="text-brand">
                      {timeFormatter.format(new Date(slot.start_time))}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    فرستاده شده در{" "}
                    {sentFormatter.format(new Date(b.created_at))}
                    {b.status === "pending" &&
                      (b.seen_at ? " — دیده شده" : " — هنوز دیده نشده")}
                  </span>
                </div>

                <RequestMessage
                  bookingId={b.id}
                  message={b.message}
                  editable={b.status === "pending"}
                  edited={!!b.edited_at}
                />

                {b.status === "cancelled" && (
                  <p className="mt-4 border-t border-card-border pt-4 text-sm leading-7 text-muted">
                    {b.cancelled_by === user.id
                      ? "خودت لغوش کردی."
                      : "متخصص لغوش کرد."}
                    {b.cancel_reason ? ` دلیل: ${b.cancel_reason}` : ""}
                  </p>
                )}

                {b.status === "pending" && (
                  <CancelBooking bookingId={b.id} kind="request" />
                )}

                {b.status === "confirmed" &&
                  slot &&
                  sessionTiming(slot.start_time, slot.end_time) === "past" && (
                    <p className="mt-4 border-t border-card-border pt-4 text-sm text-muted">
                      این جلسه برگزار شد.
                    </p>
                  )}

                {b.status === "confirmed" &&
                  (!slot ||
                    sessionTiming(slot.start_time, slot.end_time) !==
                      "past") && (
                  <div className="mt-4 border-t border-card-border pt-4">
                    {meetingLink ? (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
                      >
                        ورود به جلسه
                      </a>
                    ) : (
                      <p className="text-sm leading-7 text-muted">
                        متخصص درخواستت را قبول کرده، ولی هنوز لینک جلسه ثبت
                        نکرده. به‌محض اینکه اضافه کند همین‌جا می‌بینی‌اش.
                      </p>
                    )}

                    {slot &&
                      sessionTiming(slot.start_time, slot.end_time) !==
                        "past" && (
                        <CancelBooking bookingId={b.id} kind="session" />
                      )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

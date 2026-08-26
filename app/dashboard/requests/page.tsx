import Link from "next/link";
import { redirect } from "next/navigation";
import LeaveReview from "@/components/LeaveReview";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import RequestMessage from "../request-message";
import CancelBooking from "@/components/CancelBooking";
import { dateFormats, sessionTiming } from "@/lib/persian";
import { signAttachment } from "@/lib/briefs";
import { getCurrentUser } from "@/lib/auth";

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
    className: "border border-danger/40 text-danger",
  },
  cancelled: {
    mark: "✕",
    label: "لغو شده",
    className: "border border-card-border text-muted",
  },
} as const;

export default async function MyRequestsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/requests");
  }

  // Everything ever sent, newest first — a request that was declined or has
  // already happened is still part of the record.
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, mentor_id, status, message, seen_at, edited_at, created_at, meeting_link, cancelled_by, cancel_reason, availability_slots(start_time, end_time), mentor_profiles(headline, profiles!mentor_profiles_id_fkey(full_name, photo_url))",
    )
    .eq("seeker_id", user.id)
    .order("created_at", { ascending: false });

  const rows = bookings ?? [];

  // Reviews are publicly readable, so this needs nothing special — it is only
  // here to keep the invitation from being offered on a session already
  // reviewed.
  const { data: myReviews } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("seeker_id", user.id);

  const reviewed = new Set(
    (myReviews ?? []).map((r) => r.booking_id as string),
  );

  // Project briefs are a separate conversation from session requests, so they
  // are listed separately rather than sorted in among them.
  const { data: briefRows } = await supabase
    .from("project_briefs")
    .select(
      "id, brief, status, quoted_rate_toman, estimated_hours, reply_note, created_at, attachment_path, attachment_name, mentor_profiles(profiles!mentor_profiles_id_fkey(full_name))",
    )
    .eq("seeker_id", user.id)
    .order("created_at", { ascending: false });

  const briefs = await Promise.all(
    (briefRows ?? []).map(async (b) => ({
    id: b.id as string,
    brief: b.brief as string,
    status: b.status as string,
    rate: b.quoted_rate_toman as number | null,
    hours: b.estimated_hours as number | null,
    note: b.reply_note as string | null,
    createdAt: b.created_at as string,
    mentor:
      (
        b.mentor_profiles as unknown as {
          profiles: { full_name: string } | null;
        } | null
      )?.profiles?.full_name ?? "کارشناس",
      fileName: (b.attachment_name as string | null) ?? null,
      fileUrl: await signAttachment(
        supabase,
        b.attachment_path as string | null,
      ),
    })),
  );

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

      {briefs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">کارهای پروژه‌ای</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {briefs.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-card-border bg-card p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-bold">{b.mentor}</p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                      b.status === "accepted"
                        ? "bg-success-light text-success"
                        : b.status === "pending"
                          ? "border border-card-border text-muted"
                          : "border border-danger/40 text-danger"
                    }`}
                  >
                    {b.status === "accepted"
                      ? "✓ قبول کرد"
                      : b.status === "pending"
                        ? "… در انتظار جواب"
                        : b.status === "withdrawn"
                          ? "پس گرفتی"
                          : "✕ قبول نکرد"}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                  {b.brief}
                </p>

                {b.fileUrl && (
                  <a
                    href={b.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-full border border-card-border px-4 py-2 text-xs hover:border-brand hover:text-brand-deep"
                  >
                    📎 {b.fileName}
                  </a>
                )}

                {b.status === "accepted" && (
                  <div className="mt-4 border-t border-card-border pt-4 text-sm leading-7">
                    <p>
                      نرخ پیشنهادی:{" "}
                      <span className="font-medium">
                        {(b.rate ?? 0).toLocaleString("fa-IR")} تومان
                      </span>{" "}
                      برای هر ساعت — تخمین{" "}
                      <span className="font-medium">
                        {(b.hours ?? 0).toLocaleString("fa-IR")}
                      </span>{" "}
                      ساعت
                    </p>
                    {b.note && (
                      <p className="mt-2 text-muted">{b.note}</p>
                    )}
                    <p className="mt-3 text-xs leading-6 text-muted">
                      پرداخت آنلاین هنوز فعال نیست. برای شروع کار، یک گفتگوی
                      رایگان ۲۲ دقیقه‌ای رزرو کن و جزئیات را با هم نهایی کنید.
                    </p>
                  </div>
                )}

                {b.status === "declined" && b.note && (
                  <p className="mt-4 border-t border-card-border pt-4 text-sm leading-7 text-muted">
                    {b.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 && briefs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-card-border bg-card p-10 text-center">
          <p className="text-muted">هنوز درخواستی نفرستادی.</p>
          <Link
            href="/specialists"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
          >
            پیدا کردن کارشناس
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
                    <span className="text-brand-deep">
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
                      : "کارشناس لغوش کرد."}
                    {b.cancel_reason ? ` دلیل: ${b.cancel_reason}` : ""}
                  </p>
                )}

                {b.status === "pending" && (
                  <CancelBooking bookingId={b.id} kind="request" />
                )}

                {b.status === "confirmed" &&
                  slot &&
                  sessionTiming(slot.start_time, slot.end_time) === "past" && (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <p className="text-sm text-muted">این جلسه برگزار شد.</p>
                      {/* The only claim on a profile its owner cannot write,
                          asked for at the one moment the person has something
                          to say. */}
                      {!reviewed.has(b.id) && <LeaveReview bookingId={b.id} />}
                    </div>
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
                        className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
                      >
                        ورود به جلسه
                      </a>
                    ) : (
                      <p className="text-sm leading-7 text-muted">
                        کارشناس درخواستت را قبول کرده، ولی هنوز لینک جلسه ثبت
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

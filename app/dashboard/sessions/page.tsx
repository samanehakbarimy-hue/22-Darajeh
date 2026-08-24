import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptBooking, declineBooking } from "@/lib/actions/booking-response";
import SubmitButton from "@/components/SubmitButton";
import ConfirmedSessionLink from "./confirmed-session-link";
import CancelBooking from "@/components/CancelBooking";
import { dateFormats, sessionTiming } from "@/lib/persian";
import BriefReply from "@/components/BriefReply";
import { signAttachment } from "@/lib/briefs";

export default async function MySessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/sessions");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    redirect("/dashboard");
  }

  // Opening this page is reading the requests on it.
  await supabase.rpc("mark_bookings_seen");

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, message, status, edited_at, meeting_link, cancelled_by, cancel_reason, availability_slots(start_time, end_time), profiles!bookings_seeker_id_fkey(full_name, photo_url)",
    )
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  // A confirmed session with no meeting link leaves the seeker with nowhere
  // to go, and the specialist is the only person who can fix that — so this
  // page, where they accept requests, is where it has to be said.
  const { data: link } = await supabase
    .from("mentor_meeting_links")
    .select("meeting_link")
    .eq("id", user.id)
    .maybeSingle();
  const hasMeetingLink = Boolean(link?.meeting_link);

  // Whether they can mint a link per booking, or only have the pasted one.
  const { data: googleAccount } = await supabase
    .from("mentor_google_connected")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  const googleConnected = Boolean(googleAccount);

  const { data: briefRows } = await supabase
    .from("project_briefs")
    .select(
      "id, brief, created_at, attachment_path, attachment_name, profiles!project_briefs_seeker_id_fkey(full_name)",
    )
    .eq("mentor_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const briefs = await Promise.all(
    (briefRows ?? []).map(async (b) => ({
      id: b.id as string,
      brief: b.brief as string,
      createdAt: b.created_at as string,
      seeker:
        (b.profiles as unknown as { full_name: string } | null)?.full_name ??
        "متقاضی",
      fileName: (b.attachment_name as string | null) ?? null,
      fileUrl: await signAttachment(
        supabase,
        b.attachment_path as string | null,
      ),
    })),
  );

  const rows = (data ?? []).map((b) => ({
    id: b.id,
    message: b.message,
    status: b.status as string,
    editedAt: b.edited_at as string | null,
    meetingLink: (b.meeting_link as string | null) ?? null,
    cancelledBy: (b.cancelled_by as string | null) ?? null,
    cancelReason: (b.cancel_reason as string | null) ?? null,
    slot: b.availability_slots as unknown as {
      start_time: string;
      end_time: string | null;
    } | null,
    seeker: b.profiles as unknown as {
      full_name: string;
      photo_url: string | null;
    } | null,
  }));

  // Nothing marks a session finished, so the clock decides. A slot whose time
  // has gone by is not something to act on any more, and showing it beside
  // tomorrow's — same badge, same live join button — was the whole problem.
  const timingOf = (b: (typeof rows)[number]) =>
    b.slot ? sessionTiming(b.slot.start_time, b.slot.end_time) : "upcoming";

  const allPending = rows.filter((b) => b.status === "pending");
  // These can no longer be answered in time — the database now refuses to
  // accept them — so offering the accept button would be a lie.
  const pending = allPending.filter((b) => timingOf(b) !== "past");
  const expired = allPending.filter((b) => timingOf(b) === "past");

  const allConfirmed = rows.filter((b) => b.status === "confirmed");
  // Soonest first: what is about to happen is what they opened this to check.
  const confirmed = allConfirmed
    .filter((b) => timingOf(b) !== "past")
    .sort((a, z) =>
      (a.slot?.start_time ?? "").localeCompare(z.slot?.start_time ?? ""),
    );
  const held = allConfirmed
    .filter((b) => timingOf(b) === "past")
    .sort((a, z) =>
      (z.slot?.start_time ?? "").localeCompare(a.slot?.start_time ?? ""),
    );

  const closed = rows.filter((b) =>
    ["declined", "cancelled"].includes(b.status),
  );

  // A session is stranded only if it has neither its own link nor the pasted
  // fallback — and only while it can still be attended. Chasing a link for a
  // session that already went by helps nobody.
  const stranded = hasMeetingLink
    ? []
    : confirmed.filter((b) => !b.meetingLink);

  const timeFormatter = dateFormats.full;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">جلسات من</h1>
      <p className="mt-2 text-muted">
        درخواست‌هایی که برات فرستاده شده و جلسه‌هایی که قبول کردی.
      </p>

      {/* Only shout when a session genuinely has nowhere to go. A booking
          with its own generated link is fine even if no permanent link was
          ever pasted — warning about it then is crying wolf. */}
      {(stranded.length > 0 || !hasMeetingLink) && (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            stranded.length > 0
              ? "border-brand/40 bg-brand-light"
              : "border-card-border bg-card"
          }`}
        >
          <p
            className={`font-bold ${
              stranded.length > 0 ? "text-brand" : "text-foreground"
            }`}
          >
            {stranded.length > 0
              ? "لینک جلسه‌ات را اضافه کن"
              : "لینک ثابت نداری"}
          </p>
          <p className="mt-1.5 text-sm leading-7 text-muted">
            {stranded.length > 0
              ? "یک جلسه قبول‌شده داری که هیچ لینکی ندارد و کسی نمی‌تواند به آن بیاید."
              : "جلسه‌های فعلی‌ات لینک دارند. اگر یک لینک ثابت هم بگذاری، هر وقت ساختن لینک خودکار به مشکل خورد، همان استفاده می‌شود."}
          </p>
          {/* Solid brand red is for the case where a session really has
              nowhere to go. When every session already has a link this is a
              suggestion, and dressing a suggestion as an alarm teaches people
              to ignore the alarm. */}
          <Link
            href="/dashboard/mentor/profile"
            className={`mt-4 inline-block rounded-full px-5 py-2.5 text-sm ${
              stranded.length > 0
                ? "bg-brand font-semibold text-background hover:bg-brand-hover"
                : "border border-card-border font-medium text-muted hover:border-brand hover:text-brand"
            }`}
          >
            افزودن لینک جلسه
          </Link>
        </div>
      )}

      {rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-card-border bg-card p-10 text-center">
          <p className="text-muted">هنوز کسی ازت درخواست جلسه نکرده.</p>
          <Link
            href="/dashboard/mentor/availability"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
          >
            زمان‌های آزادت را بیشتر کن
          </Link>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">
            در انتظار جواب تو
            <span className="mr-2 rounded-full bg-brand px-2.5 py-0.5 align-middle text-xs text-background">
              {pending.length.toLocaleString("fa-IR")}
            </span>
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pending.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-brand/40 bg-card p-6"
              >
                <p className="font-bold">{b.seeker?.full_name}</p>
                {b.slot && (
                  <p className="mt-1 text-sm text-brand">
                    {timeFormatter.format(new Date(b.slot.start_time))}
                  </p>
                )}
                <p className="mt-4 whitespace-pre-line leading-7 text-muted">
                  {b.message}
                  {b.editedAt && (
                    <span className="mr-2 text-xs text-muted/70">
                      (ویرایش شده)
                    </span>
                  )}
                </p>
                <div className="mt-5 flex gap-3 border-t border-card-border pt-5">
                  <form action={acceptBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <SubmitButton
                      pendingLabel="در حال تأیید..."
                      className="px-6 py-2.5 text-sm"
                    >
                      قبول می‌کنم
                    </SubmitButton>
                  </form>
                  <form action={declineBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <SubmitButton
                      variant="outline"
                      pendingLabel="در حال رد..."
                      className="px-6 py-2.5 text-sm font-medium"
                    >
                      رد می‌کنم
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {briefs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">
            درخواست‌های پروژه‌ای
            <span className="mr-2 rounded-full bg-brand px-2.5 py-0.5 align-middle text-xs text-background">
              {briefs.length.toLocaleString("fa-IR")}
            </span>
          </h2>
          <p className="mt-1.5 text-sm leading-7 text-muted">
            کاری که کسی برایت نوشته. اگر قبول کنی، نرخ و تخمین ساعتت را همان‌جا
            می‌نویسی و او همان را می‌بیند.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {briefs.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-brand/40 bg-card p-6"
              >
                <p className="font-bold">{b.seeker}</p>
                <p className="mt-1 text-xs text-muted">
                  {dateFormats.full.format(new Date(b.createdAt))}
                </p>
                <p className="mt-4 whitespace-pre-line leading-7 text-muted">
                  {b.brief}
                </p>
                {b.fileUrl && (
                  <a
                    href={b.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-full border border-card-border px-4 py-2 text-sm hover:border-brand hover:text-brand"
                  >
                    📎 {b.fileName}
                  </a>
                )}

                <BriefReply briefId={b.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirmed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">جلسه‌های پیش رو</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {confirmed.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{b.seeker?.full_name}</p>
                  <span className="shrink-0 text-xs text-success">
                    <span aria-hidden>✓</span> تأیید شده
                  </span>
                </div>
                {b.slot && (
                  <p className="mt-1 text-sm text-muted">
                    {timeFormatter.format(new Date(b.slot.start_time))}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                  {b.message}
                </p>

                <ConfirmedSessionLink
                  bookingId={b.id}
                  bookingLink={b.meetingLink}
                  fallbackLink={link?.meeting_link ?? null}
                  googleConnected={googleConnected}
                />

                <CancelBooking bookingId={b.id} kind="session" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {expired.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-muted">فرصتشان گذشت</h2>
          <p className="mt-1.5 text-sm leading-7 text-muted">
            به این‌ها جواب داده نشد و زمانشان رسید و رد شد. دیگر نمی‌شود
            قبولشان کرد؛ فقط می‌توانی از لیست پاکشان کنی.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {expired.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-card-border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-muted">
                      {b.seeker?.full_name}
                    </p>
                    {b.slot && (
                      <p className="mt-1 text-sm text-muted/70">
                        {timeFormatter.format(new Date(b.slot.start_time))}
                      </p>
                    )}
                  </div>
                  <form action={declineBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <SubmitButton
                      variant="outline"
                      pendingLabel="در حال بستن..."
                      className="px-5 py-2 text-sm font-medium"
                    >
                      بستن
                    </SubmitButton>
                  </form>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                  {b.message}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {held.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-muted">برگزار شده</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {held.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border px-4 py-3 text-sm"
              >
                <span className="text-muted">{b.seeker?.full_name}</span>
                {b.slot && (
                  <span className="text-xs text-muted/70">
                    {timeFormatter.format(new Date(b.slot.start_time))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {closed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-muted">بسته‌شده</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {closed.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-card-border px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{b.seeker?.full_name}</span>
                  <span className="text-xs text-muted/70">
                    {b.status === "declined"
                      ? "رد شده"
                      : b.cancelledBy === user.id
                        ? "تو لغوش کردی"
                        : "متقاضی لغو کرد"}
                  </span>
                </div>
                {b.cancelReason && (
                  <p className="mt-1.5 text-xs leading-6 text-muted/70">
                    دلیل: {b.cancelReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import RequestMessage from "./request-message";
import CancelBooking from "@/components/CancelBooking";
import { dateFormats, sessionTiming } from "@/lib/persian";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const { booked } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const roleLabel =
    profile?.role === "mentor"
      ? "متخصص"
      : profile?.role === "admin"
        ? "ادمین"
        : "متقاضی";

  const timeFormatter = dateFormats.full;

  let mentorStatus: string | null = null;
  let hasFutureSlots = false;
  let hasMeetingRoute = false;
  let mentorBookings: {
    id: string;
    message: string;
    status: string;
    slot: { start_time: string; end_time: string | null } | null;
    seeker: { full_name: string } | null;
  }[] = [];

  if (profile?.role === "mentor") {
    const { data: mentorProfile } = await supabase
      .from("mentor_profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    mentorStatus = mentorProfile?.status ?? null;

    // Everything the checklist reports on. Small counts, not rows.
    const [slots, google, link] = await Promise.all([
      supabase
        .from("availability_slots")
        .select("id", { count: "exact", head: true })
        .eq("mentor_id", user.id)
        .gt("start_time", new Date().toISOString()),
      supabase
        .from("mentor_google_connected")
        .select("id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("mentor_meeting_links")
        .select("meeting_link")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    hasFutureSlots = (slots.count ?? 0) > 0;
    hasMeetingRoute = Boolean(google.data || link.data?.meeting_link);

    // Opening the dashboard is reading the requests, so the people who sent
    // them can see they landed — and can no longer quietly reword them.
    await supabase.rpc("mark_bookings_seen");

    const { data } = await supabase
      .from("bookings")
      .select(
        "id, message, status, edited_at, availability_slots(start_time, end_time), profiles!bookings_seeker_id_fkey(full_name)",
      )
      .eq("mentor_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false });

    mentorBookings = (data ?? []).map((b) => ({
      id: b.id,
      message: b.message,
      status: b.status,
      slot: b.availability_slots as unknown as {
        start_time: string;
        end_time: string | null;
      } | null,
      seeker: b.profiles as unknown as { full_name: string } | null,
    }));
  }

  let seekerBookings: {
    id: string;
    slot: { start_time: string; end_time: string | null } | null;
    mentor: { full_name: string } | null;
    status: string;
    message: string;
    seenAt: string | null;
    editedAt: string | null;
    meetingLink: string | null;
    cancelledByMe: boolean;
    cancelReason: string | null;
  }[] = [];

  // Not gated on role: a mentor or an admin can book a specialist too, and
  // hiding their own requests from them is how they get lost.
  {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, mentor_id, status, message, seen_at, edited_at, meeting_link, cancelled_by, cancel_reason, availability_slots(start_time, end_time), mentor_profiles(profiles(full_name))",
      )
      .eq("seeker_id", user.id)
      .in("status", ["pending", "confirmed", "cancelled"])
      .order("created_at", { ascending: false });

    // The meeting link is the one contact detail a seeker gets — the mentor's
    // phone number stays private to them and the admin. RLS returns these rows
    // only for mentors this person has actually booked.
    const mentorIds = (data ?? []).map((b) => b.mentor_id);
    const { data: links } = mentorIds.length
      ? await supabase
          .from("mentor_meeting_links")
          .select("id, meeting_link")
          .in("id", mentorIds)
      : { data: [] };

    const linkById = new Map(
      (links ?? []).map((l) => [l.id, l.meeting_link] as const),
    );

    seekerBookings = (data ?? [])
      .filter((b) => {
        const slot = b.availability_slots as unknown as {
          start_time: string;
          end_time: string | null;
        } | null;
        return (
          !slot || sessionTiming(slot.start_time, slot.end_time) !== "past"
        );
      })
      .map((b) => ({
      id: b.id,
      slot: b.availability_slots as unknown as {
        start_time: string;
        end_time: string | null;
      } | null,
      mentor:
        (
          b.mentor_profiles as unknown as {
            profiles: { full_name: string } | null;
          } | null
        )?.profiles ?? null,
      status: b.status,
      message: b.message,
      seenAt: b.seen_at,
      editedAt: b.edited_at,
      // A link made for this booking beats the profile-wide one.
      meetingLink:
        (b.meeting_link as string | null) ?? linkById.get(b.mentor_id) ?? null,
      cancelledByMe: b.cancelled_by === user.id,
      cancelReason: (b.cancel_reason as string | null) ?? null,
      }));
  }

  // Every status a mentor_profiles row can hold needs a label here.
  // changes_requested was added later and fell through to "you have not
  // filled your profile", which told a specialist the opposite of the
  // truth and hid the fact that a note was waiting for them.
  const statusLabel =
    mentorStatus === "approved"
      ? "تأیید شده ✅"
      : mentorStatus === "rejected"
        ? "رد شده"
        : mentorStatus === "changes_requested"
          ? "نیاز به اصلاح — توضیحش در پروفایل"
          : mentorStatus === "pending"
            ? "در انتظار تأیید ادمین"
            : "هنوز پروفایل متخصص‌ت رو تکمیل نکردی";

  // Both counts are of things still to come. Counting sessions that already
  // happened made the number climb forever and told the specialist nothing
  // about what they had to do next.
  const stillAhead = (b: (typeof mentorBookings)[number]) =>
    !b.slot || sessionTiming(b.slot.start_time, b.slot.end_time) !== "past";

  const pendingRequests = mentorBookings.filter(
    (b) => b.status === "pending" && stillAhead(b),
  );
  const upcomingSessions = mentorBookings.filter(
    (b) => b.status === "confirmed" && stillAhead(b),
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      {booked === "1" && (
        <div className="mb-6 rounded-xl border border-brand bg-brand-light px-4 py-3 text-sm text-brand">
          درخواستت فرستاده شد. منتظر تأیید متخصص باش.
        </div>
      )}

      {/* A returning user is not arriving for the first time, so this names
          the page rather than greeting them. */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-card-border pb-6">
        <div>
          <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand-light px-3 py-1 text-brand">
              {roleLabel}
            </span>
            {profile?.role === "mentor" && (
              <span className="rounded-full border border-card-border px-3 py-1 text-muted">
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile?.role === "mentor" && (
            <>
              <Link
                href="/dashboard/mentor/profile"
                className="rounded-full border border-card-border px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
              >
                {mentorStatus ? "پروفایل من" : "تکمیل پروفایل"}
              </Link>
              <Link
                href="/dashboard/mentor/availability"
                className="rounded-full border border-card-border px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
              >
                زمان‌های آزاد
              </Link>
              <Link
                href="/dashboard/mentor/services"
                className="rounded-full border border-card-border px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
              >
                خدمات و قیمت‌ها
              </Link>
            </>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-hover"
            >
              پنل مدیریت
            </Link>
          )}
        </div>
      </div>

      {/* A specialist waiting for approval has no idea whether to sit still
          or keep going. This says which, and shows the work that can be done
          meanwhile — so the wait is useful instead of dead. */}
      {profile?.role === "mentor" && mentorStatus !== "approved" && (
        <section className="mt-6 rounded-2xl border border-card-border bg-card p-5">
          <h2 className="font-bold">قدم بعدی</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {!mentorStatus
              ? "اول پروفایلت را کامل کن. تا وقتی نفرستی، چیزی برای بررسی وجود ندارد."
              : mentorStatus === "changes_requested"
                ? "ادمین چیزی خواسته که اصلاح کنی — توضیحش بالای صفحه پروفایلت نوشته شده. بعد از ذخیره، دوباره خودکار برای بررسی می‌رود."
                : mentorStatus === "rejected"
                  ? "پروفایلت تأیید نشد. اگر فکر می‌کنی اشتباهی شده، از صفحه تماس با ما بنویس."
                  : "پروفایلت فرستاده شد و در نوبت بررسی است. تا آن موقع می‌تونی بقیه کارها را جلو ببری تا بعد از تأیید آماده باشی."}
          </p>

          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {[
              {
                done: Boolean(mentorStatus),
                label: "پروفایلت را کامل کن",
                href: "/dashboard/mentor/profile",
              },
              {
                done: hasMeetingRoute,
                label: "حساب گوگل را وصل کن یا یک لینک جلسه بگذار",
                href: "/dashboard/mentor/profile",
              },
              {
                done: hasFutureSlots,
                label: "زمان‌های آزادت را اضافه کن",
                href: "/dashboard/mentor/availability",
              },
              {
                done: mentorStatus === "approved",
                label: "تأیید ادمین",
                href: null,
              },
            ].map((step) => (
              <li key={step.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    step.done
                      ? "bg-success-light text-success"
                      : "border border-card-border text-muted"
                  }`}
                >
                  {step.done ? "✓" : "•"}
                </span>
                {step.href && !step.done ? (
                  <Link href={step.href} className="text-brand hover:underline">
                    {step.label}
                  </Link>
                ) : (
                  <span className={step.done ? "text-muted" : ""}>
                    {step.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile?.role === "mentor" && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold">جلسات من</h2>
            <Link
              href="/dashboard/sessions"
              className="text-sm text-brand hover:underline"
            >
              دیدن همه
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/sessions"
              className="rounded-2xl border border-card-border bg-card px-5 py-4 transition hover:border-brand"
            >
              <div className="text-2xl font-bold">
                {pendingRequests.length.toLocaleString("fa-IR")}
              </div>
              <div className="mt-0.5 text-xs text-muted">در انتظار جواب تو</div>
            </Link>
            <Link
              href="/dashboard/sessions"
              className="rounded-2xl border border-card-border bg-card px-5 py-4 transition hover:border-brand"
            >
              <div className="text-2xl font-bold">
                {upcomingSessions.length.toLocaleString("fa-IR")}
              </div>
              <div className="mt-0.5 text-xs text-muted">جلسه پیش رو</div>
            </Link>
          </div>
        </section>
      )}

      {/* Shown whenever there is something to show, whatever the role. */}
      {(profile?.role === "seeker" || seekerBookings.length > 0) && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold">درخواست‌های من</h2>
            {seekerBookings.length > 0 && (
              <Link
                href="/dashboard/requests"
                className="text-sm text-brand hover:underline"
              >
                دیدن همه
              </Link>
            )}
          </div>

          {seekerBookings.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-card-border bg-card p-8 text-center">
              <p className="text-muted">هنوز جلسه‌ای رزرو نکردی.</p>
              <Link
                href="/specialists"
                className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
              >
                پیدا کردن متخصص
              </Link>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {seekerBookings.map((b) => (
                <li
                  key={b.id}
                  className="rounded-2xl border border-card-border bg-card p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{b.mentor?.full_name}</p>
                      {b.slot && (
                        <p className="mt-1 text-sm text-brand">
                          {timeFormatter.format(new Date(b.slot.start_time))}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                        b.status === "cancelled"
                          ? "border border-red-400/40 text-red-400"
                          : b.status === "confirmed"
                            ? "bg-brand-light text-brand"
                            : "border border-card-border text-muted"
                      }`}
                    >
                      {b.status === "cancelled"
                        ? "لغو شده"
                        : b.status === "confirmed"
                          ? "تأیید شده"
                          : b.seenAt
                            ? "دیده شده"
                            : "فرستاده شد"}
                    </span>
                  </div>

                  {/* The request as sent, so it is never lost — and rewordable
                      until the specialist opens it. */}
                  <RequestMessage
                    bookingId={b.id}
                    message={b.message}
                    editable={b.status === "pending"}
                    edited={!!b.editedAt}
                  />

                  {/* Nothing to join until the specialist has said yes. */}
                  {b.status === "cancelled" ? (
                    <div className="mt-4 border-t border-card-border pt-4 text-sm leading-7 text-muted">
                      <p>
                        {b.cancelledByMe
                          ? "این جلسه را خودت لغو کردی."
                          : "متخصص این جلسه را لغو کرد."}
                      </p>
                      {b.cancelReason && (
                        <p className="mt-1 text-muted/80">
                          دلیل: {b.cancelReason}
                        </p>
                      )}
                      {!b.cancelledByMe && (
                        <Link
                          href="/specialists"
                          className="mt-3 inline-block rounded-full border border-card-border px-5 py-2 text-sm hover:border-brand hover:text-brand"
                        >
                          وقت دیگری پیدا کن
                        </Link>
                      )}
                    </div>
                  ) : b.status === "pending" ? (
                    <>
                      <p className="mt-4 border-t border-card-border pt-4 text-sm text-muted">
                        {b.seenAt
                          ? "متخصص درخواستت رو دیده. منتظر جوابش باش."
                          : "هنوز دیده نشده. تا وقتی باز نشده می‌تونی پیامت رو عوض کنی."}
                      </p>
                      <CancelBooking bookingId={b.id} kind="request" />
                    </>
                  ) : b.meetingLink ? (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
                      >
                        ورود به جلسه
                      </a>
                      <CancelBooking bookingId={b.id} kind="session" />
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <p className="text-sm text-muted">
                        این متخصص هنوز لینک جلسه ثبت نکرده. به‌زودی اینجا نمایش
                        داده می‌شه.
                      </p>
                      <CancelBooking bookingId={b.id} kind="session" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Account actions are housekeeping, so they sit quietly at the end. */}
      <div className="mt-12 flex items-center gap-4 border-t border-card-border pt-6 text-sm">
        <Link
          href="/dashboard/account"
          className="text-muted hover:text-foreground"
        >
          تنظیمات حساب
        </Link>
        <form action={logout}>
          <button type="submit" className="text-muted hover:text-foreground">
            خروج از حساب
          </button>
        </form>
      </div>
    </div>
  );
}

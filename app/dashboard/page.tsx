import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import RequestMessage from "./request-message";

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

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let mentorStatus: string | null = null;
  let mentorBookings: {
    id: string;
    message: string;
    status: string;
    slot: { start_time: string } | null;
    seeker: { full_name: string } | null;
  }[] = [];

  if (profile?.role === "mentor") {
    const { data: mentorProfile } = await supabase
      .from("mentor_profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    mentorStatus = mentorProfile?.status ?? null;

    // Opening the dashboard is reading the requests, so the people who sent
    // them can see they landed — and can no longer quietly reword them.
    await supabase.rpc("mark_bookings_seen");

    const { data } = await supabase
      .from("bookings")
      .select(
        "id, message, status, edited_at, availability_slots(start_time), profiles!bookings_seeker_id_fkey(full_name)",
      )
      .eq("mentor_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false });

    mentorBookings = (data ?? []).map((b) => ({
      id: b.id,
      message: b.message,
      status: b.status,
      slot: b.availability_slots as unknown as { start_time: string } | null,
      seeker: b.profiles as unknown as { full_name: string } | null,
    }));
  }

  let seekerBookings: {
    id: string;
    slot: { start_time: string } | null;
    mentor: { full_name: string } | null;
    status: string;
    message: string;
    seenAt: string | null;
    editedAt: string | null;
    meetingLink: string | null;
  }[] = [];

  // Not gated on role: a mentor or an admin can book a specialist too, and
  // hiding their own requests from them is how they get lost.
  {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, mentor_id, status, message, seen_at, edited_at, availability_slots(start_time), mentor_profiles(profiles(full_name))",
      )
      .eq("seeker_id", user.id)
      .in("status", ["pending", "confirmed"])
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

    seekerBookings = (data ?? []).map((b) => ({
      id: b.id,
      slot: b.availability_slots as unknown as { start_time: string } | null,
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
      meetingLink: linkById.get(b.mentor_id) ?? null,
    }));
  }

  const statusLabel =
    mentorStatus === "approved"
      ? "تأیید شده ✅"
      : mentorStatus === "rejected"
        ? "رد شده"
        : mentorStatus === "pending"
          ? "در انتظار تأیید ادمین"
          : "هنوز پروفایل متخصص‌ت رو تکمیل نکردی";

  const pendingRequests = mentorBookings.filter((b) => b.status === "pending");
  const upcomingSessions = mentorBookings.filter((b) => b.status === "confirmed");

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
            </>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-dark"
            >
              پنل مدیریت
            </Link>
          )}
        </div>
      </div>

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
              <div className="mt-0.5 text-xs text-muted">جلسه قبول‌شده</div>
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
                className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-dark"
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
                        b.status === "confirmed"
                          ? "bg-brand-light text-brand"
                          : "border border-card-border text-muted"
                      }`}
                    >
                      {b.status === "confirmed"
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
                  {b.status === "pending" ? (
                    <p className="mt-4 border-t border-card-border pt-4 text-sm text-muted">
                      {b.seenAt
                        ? "متخصص درخواستت رو دیده. منتظر جوابش باش."
                        : "هنوز دیده نشده. تا وقتی باز نشده می‌تونی پیامت رو عوض کنی."}
                    </p>
                  ) : b.meetingLink ? (
                    <div className="mt-4 border-t border-card-border pt-4">
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-dark"
                      >
                        ورود به جلسه
                      </a>
                    </div>
                  ) : (
                    <p className="mt-4 border-t border-card-border pt-4 text-sm text-muted">
                      این متخصص هنوز لینک جلسه ثبت نکرده. به‌زودی اینجا نمایش
                      داده می‌شه.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Account actions are housekeeping, so they sit quietly at the end. */}
      <div className="mt-12 flex items-center gap-4 border-t border-card-border pt-6 text-sm">
        <Link href="/dashboard/account" className="text-muted hover:text-foreground">
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

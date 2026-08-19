import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { acceptBooking, declineBooking } from "@/lib/actions/booking-response";

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

    const { data } = await supabase
      .from("bookings")
      .select(
        "id, message, status, availability_slots(start_time), profiles!bookings_seeker_id_fkey(full_name)",
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
    meetingLink: string | null;
  }[] = [];

  if (profile?.role === "seeker") {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, mentor_id, status, availability_slots(start_time), mentor_profiles(profiles(full_name))",
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 py-16 text-center">
      {booked === "1" && (
        <div className="mb-6 w-full rounded-xl border border-brand bg-brand-light px-4 py-3 text-sm text-brand">
          درخواستت فرستاده شد. منتظر تأیید متخصص باش.
        </div>
      )}

      <h1 className="text-2xl font-bold">
        خوش اومدی{profile?.full_name ? `، ${profile.full_name}` : ""}!
      </h1>
      <p className="mt-2 text-muted">
        حساب تو به‌عنوان «{roleLabel}» ثبت شده.
      </p>

      {profile?.role === "mentor" && (
        <div className="mt-6 flex w-full flex-col items-center gap-3">
          <p className="text-sm text-muted">{statusLabel}</p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/mentor/profile"
              className="rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark"
            >
              {mentorStatus ? "ویرایش پروفایل" : "تکمیل پروفایل متخصص"}
            </Link>
            <Link
              href="/dashboard/mentor/availability"
              className="rounded-full border border-card-border px-6 py-3 font-medium hover:bg-card"
            >
              زمان‌های آزاد
            </Link>
          </div>

          {mentorBookings.length > 0 && (
            <div className="mt-8 w-full text-right">
              <h2 className="text-lg font-bold">جلسات رزرو شده</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {mentorBookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-xl border border-card-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{b.seeker?.full_name}</p>
                      {b.status === "confirmed" && (
                        <span className="shrink-0 text-xs text-brand">
                          تأیید شده
                        </span>
                      )}
                    </div>
                    {b.slot && (
                      <p className="mt-1 text-sm text-muted">
                        {timeFormatter.format(new Date(b.slot.start_time))}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted">{b.message}</p>

                    {b.status === "pending" && (
                      <div className="mt-4 flex gap-3 border-t border-card-border pt-4">
                        <form action={acceptBooking}>
                          <input type="hidden" name="booking_id" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-background hover:bg-brand-dark"
                          >
                            قبول می‌کنم
                          </button>
                        </form>
                        <form action={declineBooking}>
                          <input type="hidden" name="booking_id" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-card-border px-5 py-2 text-sm text-muted hover:text-foreground"
                          >
                            رد می‌کنم
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {profile?.role === "seeker" && seekerBookings.length > 0 && (
        <div className="mt-8 w-full text-right">
          <h2 className="text-lg font-bold">جلسات رزرو شده من</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {seekerBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-card-border bg-card p-4"
              >
                <p className="font-bold">{b.mentor?.full_name}</p>
                {b.slot && (
                  <p className="mt-1 text-sm text-muted">
                    {timeFormatter.format(new Date(b.slot.start_time))}
                  </p>
                )}

                {/* Nothing to join until the specialist has said yes. */}
                {b.status === "pending" ? (
                  <p className="mt-3 border-t border-card-border pt-3 text-sm text-amber-400/90">
                    در انتظار تأیید متخصص. به‌محض جواب دادن، همین‌جا می‌بینی.
                  </p>
                ) : b.meetingLink ? (
                  <div className="mt-3 border-t border-card-border pt-3">
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-dark"
                    >
                      ورود به جلسه
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 border-t border-card-border pt-3 text-sm text-muted">
                    این متخصص هنوز لینک جلسه ثبت نکرده. به‌زودی اینجا نمایش
                    داده می‌شه.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile?.role === "admin" && (
        <Link
          href="/admin"
          className="mt-6 rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark"
        >
          پنل ادمین
        </Link>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard/account"
          className="rounded-full border border-card-border px-6 py-3 font-medium hover:bg-card"
        >
          تنظیمات حساب
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-card-border px-6 py-3 font-medium hover:bg-card"
          >
            خروج از حساب
          </button>
        </form>
      </div>
    </div>
  );
}

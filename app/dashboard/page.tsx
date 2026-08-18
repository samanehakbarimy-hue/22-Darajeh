import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

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
        : "منتی";

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
        "id, message, availability_slots(start_time), profiles!bookings_seeker_id_fkey(full_name)",
      )
      .eq("mentor_id", user.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    mentorBookings = (data ?? []).map((b) => ({
      id: b.id,
      message: b.message,
      slot: b.availability_slots as unknown as { start_time: string } | null,
      seeker: b.profiles as unknown as { full_name: string } | null,
    }));
  }

  let seekerBookings: {
    id: string;
    slot: { start_time: string } | null;
    mentor: { full_name: string } | null;
  }[] = [];

  if (profile?.role === "seeker") {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, availability_slots(start_time), mentor_profiles(profiles(full_name))",
      )
      .eq("seeker_id", user.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    seekerBookings = (data ?? []).map((b) => ({
      id: b.id,
      slot: b.availability_slots as unknown as { start_time: string } | null,
      mentor:
        (
          b.mentor_profiles as unknown as {
            profiles: { full_name: string } | null;
          } | null
        )?.profiles ?? null,
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
          جلسه‌ات با موفقیت رزرو شد! 🎉
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
                    <p className="font-bold">{b.seeker?.full_name}</p>
                    {b.slot && (
                      <p className="mt-1 text-sm text-muted">
                        {timeFormatter.format(new Date(b.slot.start_time))}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted">{b.message}</p>
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

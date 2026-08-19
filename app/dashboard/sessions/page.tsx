import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptBooking, declineBooking } from "@/lib/actions/booking-response";
import SubmitButton from "@/components/SubmitButton";

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
      "id, message, status, edited_at, availability_slots(start_time), profiles!bookings_seeker_id_fkey(full_name, photo_url)",
    )
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((b) => ({
    id: b.id,
    message: b.message,
    status: b.status as string,
    editedAt: b.edited_at as string | null,
    slot: b.availability_slots as unknown as { start_time: string } | null,
    seeker: b.profiles as unknown as {
      full_name: string;
      photo_url: string | null;
    } | null,
  }));

  const pending = rows.filter((b) => b.status === "pending");
  const confirmed = rows.filter((b) => b.status === "confirmed");
  const closed = rows.filter((b) =>
    ["declined", "cancelled"].includes(b.status),
  );

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">جلسات من</h1>
      <p className="mt-2 text-muted">
        درخواست‌هایی که برات فرستاده شده و جلسه‌هایی که قبول کردی.
      </p>

      {rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-card-border bg-card p-10 text-center">
          <p className="text-muted">هنوز کسی ازت درخواست جلسه نکرده.</p>
          <Link
            href="/dashboard/mentor/availability"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-background hover:bg-brand-dark"
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

      {confirmed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">جلسه‌های قبول‌شده</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {confirmed.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{b.seeker?.full_name}</p>
                  <span className="shrink-0 text-xs text-brand">تأیید شده</span>
                </div>
                {b.slot && (
                  <p className="mt-1 text-sm text-muted">
                    {timeFormatter.format(new Date(b.slot.start_time))}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                  {b.message}
                </p>
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
                className="flex items-center justify-between gap-3 rounded-xl border border-card-border px-4 py-3 text-sm"
              >
                <span className="text-muted">{b.seeker?.full_name}</span>
                <span className="text-xs text-muted/70">
                  {b.status === "declined" ? "رد شده" : "لغو شده"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

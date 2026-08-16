import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "./booking-form";

export default async function BookSpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/specialists/${id}/book`);
  }

  const { data: specialist } = await supabase
    .from("mentor_profiles")
    .select("id, status, profiles(full_name)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!specialist) {
    notFound();
  }

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time")
    .eq("mentor_id", id)
    .eq("is_booked", false)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(10);

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const name =
    (specialist.profiles as unknown as { full_name: string } | null)?.full_name ?? "";

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <Link
        href={`/specialists/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به پروفایل {name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        رزرو تماس آشنایی رایگان با {name}
      </h1>
      <p className="mt-2 text-muted">
        این یک تماس رایگان ۲۲ دقیقه‌ای است. قبل از رزرو، یک معرفی کوتاه بنویس
        تا {name} بدونه چطور می‌تونه کمکت کنه.
      </p>

      <div className="mt-8">
        <BookingForm
          mentorId={id}
          slots={
            slots?.map((slot) => ({
              id: slot.id,
              label: timeFormatter.format(new Date(slot.start_time)),
            })) ?? []
          }
        />
      </div>
    </div>
  );
}

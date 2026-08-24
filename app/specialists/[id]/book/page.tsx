import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import BookingForm from "./booking-form";
import { getCurrentUser } from "@/lib/auth";

export default async function BookSpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/specialists/${id}/book`);
  }

  const { data: specialist } = await supabase
    .from("mentor_profiles")
    .select("id, status, headline, country, profiles(full_name, photo_url)")
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
    .order("start_time", { ascending: true });

  const profile = specialist.profiles as unknown as {
    full_name: string;
    photo_url: string | null;
  } | null;
  const name = profile?.full_name ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/specialists/${id}`}
        className="inline-block py-1 text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به پروفایل {name}
      </Link>

      {/* Who you are booking, so the page is about a person rather than a form. */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5">
        <Avatar photoUrl={profile?.photo_url} name={name} size={64} />
        <div className="min-w-0">
          <h1 className="text-lg font-bold">{name}</h1>
          {specialist.headline && (
            <p className="mt-0.5 truncate text-sm text-muted">
              {specialist.headline}
            </p>
          )}
          <p className="mt-1 text-xs text-brand">
            تماس راهنمایی ۲۲ دقیقه‌ای — رایگان
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-muted">
        یک معرفی کوتاه بنویس تا {name} بدونه چطور می‌تونه کمکت کنه، بعد زمانی که
        برات مناسبه رو انتخاب کن. درخواستت براش فرستاده می‌شه و بعد از تأییدش،
        جلسه قطعی می‌شه.
      </p>

      <div className="mt-8">
        <BookingForm
          mentorId={id}
          slots={
            slots?.map((slot) => ({
              id: slot.id,
              startTime: slot.start_time,
            })) ?? []
          }
        />
      </div>
    </div>
  );
}

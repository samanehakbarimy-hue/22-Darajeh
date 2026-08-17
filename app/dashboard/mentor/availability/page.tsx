import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAvailabilitySlot } from "@/lib/actions/availability";
import AddSlotForm from "./add-slot-form";

export default async function MentorAvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    redirect("/dashboard");
  }

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time, is_booked")
    .eq("mentor_id", user.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">زمان‌های آزاد من</h1>
      <p className="mt-2 text-muted">
        زمان‌هایی که اینجا اضافه می‌کنی، برای منتی‌ها به‌عنوان زمان قابل رزرو
        برای تماس رایگان ۲۲ دقیقه‌ای نمایش داده می‌شه.
      </p>

      <div className="mt-8 rounded-2xl border border-card-border bg-card p-5">
        <AddSlotForm />
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {(!slots || slots.length === 0) && (
          <p className="text-muted">هنوز زمانی اضافه نکردی.</p>
        )}
        {slots?.map((slot) => (
          <li
            key={slot.id}
            className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3"
          >
            <span>{timeFormatter.format(new Date(slot.start_time))}</span>
            {slot.is_booked ? (
              <span className="text-sm text-brand">رزرو شده</span>
            ) : (
              <form action={deleteAvailabilitySlot}>
                <input type="hidden" name="slot_id" value={slot.id} />
                <button
                  type="submit"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  حذف
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

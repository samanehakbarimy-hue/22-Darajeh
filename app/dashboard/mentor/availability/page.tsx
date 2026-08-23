import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAvailabilitySlots } from "@/lib/actions/availability";
import AddSlotForm from "./add-slot-form";
import { dateFormats } from "@/lib/persian";

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

  // Show the Persian calendar to mentors in Iran, and to anyone who has not
  // said where they live, since the site's audience is Persian-speaking.
  const { data: mentorProfile } = await supabase
    .from("mentor_profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();

  const country = (mentorProfile?.country ?? "").trim().toLowerCase();
  const useJalali = country === "" || country === "iran" || country === "ایران";

  const timeFormatter = dateFormats.full;
  const weekdayFormatter = dateFormats.weekday;
  const clockFormatter = dateFormats.clock;

  // One weekly choice creates a slot per week, which listed individually
  // buries the page in near-identical rows. Group them back into the series
  // the mentor actually chose, and only spell out the dates when a series
  // has been partly booked or trimmed.
  type Slot = { id: string; start_time: string; is_booked: boolean };
  const series = new Map<string, Slot[]>();
  for (const slot of (slots ?? []) as Slot[]) {
    const d = new Date(slot.start_time);
    const key = `${d.getDay()}-${d.getHours()}-${d.getMinutes()}`;
    series.set(key, [...(series.get(key) ?? []), slot]);
  }
  const groups = [...series.values()].sort(
    (a, b) =>
      new Date(a[0].start_time).getTime() - new Date(b[0].start_time).getTime(),
  );

  // Every day that already has a slot, so the calendar can mark them — a
  // weekly series runs months ahead, and a mentor should see that without
  // reading the list underneath.
  const takenDates = [
    ...new Set(
      (slots ?? []).map((slot) => {
        const d = new Date(slot.start_time);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }),
    ),
  ];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">زمان‌های آزاد من</h1>
      <p className="mt-2 text-muted">
        زمان‌های آزادت برای مشاوره و کمک به دیگران را اینجا اضافه کن.
      </p>

      <div className="mt-8">
        <AddSlotForm useJalali={useJalali} takenDates={takenDates} />
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {(!slots || slots.length === 0) && (
          <p className="text-muted">هنوز زمانی اضافه نکردی.</p>
        )}
        {groups.map((group) => {
          const first = new Date(group[0].start_time);
          const booked = group.filter((s) => s.is_booked);
          const free = group.filter((s) => !s.is_booked);

          // A single occurrence is just a date; a series is a standing weekly
          // commitment and reads better as one.
          const heading =
            group.length === 1
              ? timeFormatter.format(first)
              : `${weekdayFormatter.format(first)}‌ها ساعت ${clockFormatter.format(first)}`;

          return (
            <li
              key={group[0].id}
              className="rounded-xl border border-card-border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span>{heading}</span>
                {free.length > 0 ? (
                  <form action={deleteAvailabilitySlots}>
                    <input
                      type="hidden"
                      name="slot_ids"
                      value={free.map((s) => s.id).join(",")}
                    />
                    <button
                      type="submit"
                      className="shrink-0 text-sm text-red-400 hover:text-red-300"
                    >
                      حذف
                    </button>
                  </form>
                ) : (
                  <span className="shrink-0 text-sm text-brand">رزرو شده</span>
                )}
              </div>

              {booked.length > 0 && (
                <p className="mt-1 text-xs text-brand">
                  {`${booked.length.toLocaleString("fa-IR")} جلسه رزرو شده`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

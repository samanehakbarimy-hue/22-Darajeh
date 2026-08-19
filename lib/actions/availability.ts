"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityState =
  | { error?: string; added?: number; skipped?: number }
  | undefined;

const SESSION_MINUTES = 22;
// "هر هفته" in the form means the next three months.
// Six months of weekly repeats; the form asks for exactly this.
const MAX_REPEAT_WEEKS = 26;

/**
 * Adds every time picked for one day in a single go, optionally repeating the
 * same times weekly. Adding slots one at a time meant a form submission per
 * slot, which nobody will do for a month of availability.
 */
export async function addAvailabilitySlots(
  _prevState: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "لطفاً دوباره وارد شو." };
  }

  const date = String(formData.get("date") ?? "");
  const times = String(formData.get("times") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!date || times.length === 0) {
    return { error: "یک روز و حداقل یک ساعت انتخاب کن." };
  }

  const repeatWeeks = Math.min(
    Math.max(Number(formData.get("repeat_weeks") ?? 1) || 1, 1),
    MAX_REPEAT_WEEKS,
  );

  const rows: { mentor_id: string; start_time: string; end_time: string }[] = [];
  let skipped = 0;

  for (let week = 0; week < repeatWeeks; week++) {
    for (const time of times) {
      const startTime = new Date(`${date}T${time}:00`);
      if (Number.isNaN(startTime.getTime())) {
        return { error: "تاریخ یا ساعت نامعتبر است." };
      }
      startTime.setDate(startTime.getDate() + week * 7);

      // A repeat that reaches into the past is skipped rather than failing the
      // whole batch, so one stale time can't discard the rest.
      if (startTime.getTime() < Date.now()) {
        skipped += 1;
        continue;
      }

      rows.push({
        mentor_id: user.id,
        start_time: startTime.toISOString(),
        end_time: new Date(
          startTime.getTime() + SESSION_MINUTES * 60 * 1000,
        ).toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    return { error: "همه زمان‌های انتخابی در گذشته‌اند." };
  }

  // Skip times this mentor already offers instead of erroring on a clash.
  const { data: existing } = await supabase
    .from("availability_slots")
    .select("start_time")
    .eq("mentor_id", user.id)
    .in(
      "start_time",
      rows.map((r) => r.start_time),
    );

  const taken = new Set((existing ?? []).map((e) => e.start_time));
  const fresh = rows.filter((r) => !taken.has(r.start_time));
  skipped += rows.length - fresh.length;

  if (fresh.length === 0) {
    return { error: "این زمان‌ها از قبل ثبت شده‌اند." };
  }

  const { error } = await supabase.from("availability_slots").insert(fresh);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/mentor/availability");
  return { added: fresh.length, skipped: skipped || undefined };
}

/**
 * Removes a whole weekly series at once. A mentor who offered Wednesdays at
 * nine and changed their mind means all of them, not twelve separate deletions.
 * Booked slots are never included, so cancelling is always deliberate.
 */
export async function deleteAvailabilitySlots(formData: FormData) {
  const ids = String(formData.get("slot_ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return;

  const supabase = await createClient();
  await supabase
    .from("availability_slots")
    .delete()
    .in("id", ids)
    .eq("is_booked", false);

  revalidatePath("/dashboard/mentor/availability");
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  if (!slotId) return;

  const supabase = await createClient();
  await supabase.from("availability_slots").delete().eq("id", slotId);

  revalidatePath("/dashboard/mentor/availability");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityState = { error?: string; added?: number } | undefined;

const SESSION_MINUTES = 22;

/**
 * Adds every time picked for one day in a single go. Adding slots one at a
 * time meant a form submission per slot, which nobody will do for a week's
 * worth of availability.
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

  const rows: { mentor_id: string; start_time: string; end_time: string }[] = [];

  for (const time of times) {
    const startTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startTime.getTime())) {
      return { error: "تاریخ یا ساعت نامعتبر است." };
    }
    if (startTime.getTime() < Date.now()) {
      return { error: "زمان انتخابی باید در آینده باشد." };
    }
    rows.push({
      mentor_id: user.id,
      start_time: startTime.toISOString(),
      end_time: new Date(
        startTime.getTime() + SESSION_MINUTES * 60 * 1000,
      ).toISOString(),
    });
  }

  const { error } = await supabase.from("availability_slots").insert(rows);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/mentor/availability");
  return { added: rows.length };
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  if (!slotId) return;

  const supabase = await createClient();
  await supabase.from("availability_slots").delete().eq("id", slotId);

  revalidatePath("/dashboard/mentor/availability");
}

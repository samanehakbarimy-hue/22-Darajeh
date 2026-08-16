"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityState = { error?: string } | undefined;

const SESSION_MINUTES = 22;

export async function addAvailabilitySlot(
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
  const time = String(formData.get("time") ?? "");

  if (!date || !time) {
    return { error: "تاریخ و ساعت را وارد کن." };
  }

  const startTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startTime.getTime())) {
    return { error: "تاریخ یا ساعت نامعتبر است." };
  }
  if (startTime.getTime() < Date.now()) {
    return { error: "زمان انتخابی باید در آینده باشد." };
  }

  const endTime = new Date(startTime.getTime() + SESSION_MINUTES * 60 * 1000);

  const { error } = await supabase.from("availability_slots").insert({
    mentor_id: user.id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/mentor/availability");
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  if (!slotId) return;

  const supabase = await createClient();
  await supabase.from("availability_slots").delete().eq("id", slotId);

  revalidatePath("/dashboard/mentor/availability");
}

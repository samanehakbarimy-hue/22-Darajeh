"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EditMessageState = { error?: string; saved?: boolean } | undefined;

/**
 * Rewords a request that has not been read yet. The database function checks
 * ownership, that it is still pending and still unseen, so a stale page cannot
 * edit something the specialist has already opened.
 */
export async function editBookingMessage(
  _prev: EditMessageState,
  formData: FormData,
): Promise<EditMessageState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!bookingId) return { error: "درخواست پیدا نشد." };
  if (!message) return { error: "متن پیام نمی‌تونه خالی باشه." };
  if (message.split(/\s+/).filter(Boolean).length > 120) {
    return { error: "پیامت باید حداکثر ۱۲۰ کلمه باشه." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_booking_message", {
    booking_id: bookingId,
    new_message: message,
  });

  if (error) {
    return { error: "این درخواست دیگه قابل ویرایش نیست." };
  }

  revalidatePath("/dashboard");
  return { saved: true };
}

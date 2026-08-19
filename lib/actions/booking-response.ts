"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Answers a booking request. The database function checks the caller is the
 * specialist being asked and that the request is still pending, so neither
 * can be forged from the browser.
 */
async function respond(formData: FormData, accept: boolean) {
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) return;

  const supabase = await createClient();
  await supabase.rpc("respond_to_booking", {
    booking_id: bookingId,
    accept,
  });

  revalidatePath("/dashboard");
}

export async function acceptBooking(formData: FormData) {
  await respond(formData, true);
}

export async function declineBooking(formData: FormData) {
  await respond(formData, false);
}

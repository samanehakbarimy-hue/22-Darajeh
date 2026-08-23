"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyCancelled } from "@/lib/email/notifications";

export type CancelState = { error?: string } | undefined;

/**
 * Calls off a session. Either side may do it, up until the session ends.
 *
 * The database function decides whether the caller is party to this booking
 * and whether there is still anything to call off, so neither can be forged
 * from the browser. The reason travels with it because the other person is
 * about to find a session missing from their dashboard and deserves to know
 * who cancelled it and why — there is no email, so this is the only channel.
 */
export async function cancelBooking(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) return { error: "این جلسه پیدا نشد." };

  const reason = String(formData.get("reason") ?? "")
    .trim()
    .slice(0, 500);

  const supabase = await createClient();

  // Read before cancelling: afterwards this is still readable, but knowing
  // which side the canceller is on is what decides who gets written to, and
  // there is no reason to ask twice.
  const [{ data: booking }, { data: auth }] = await Promise.all([
    supabase.from("bookings").select("mentor_id").eq("id", bookingId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const { error } = await supabase.rpc("cancel_booking", {
    booking_id: bookingId,
    reason: reason || null,
  });

  // Only the other side hears about it, and only once it actually happened.
  if (!error && booking?.mentor_id && auth?.user) {
    await notifyCancelled(
      bookingId,
      auth.user.id,
      booking.mentor_id as string,
      reason || null,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/requests");

  if (error) {
    return {
      error: "لغو انجام نشد. شاید زمان این جلسه گذشته باشد. صفحه را تازه کن.",
    };
  }
  return undefined;
}

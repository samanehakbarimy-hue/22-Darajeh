"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createMeetLink, isGoogleConfigured } from "@/lib/google/meet";
import { dateFormats } from "@/lib/persian";

/**
 * Answers a booking request. The database function checks the caller is the
 * specialist being asked and that the request is still pending, so neither
 * can be forged from the browser.
 */
async function respond(formData: FormData, accept: boolean) {
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_booking", {
    booking_id: bookingId,
    accept,
  });

  if (!error && accept) {
    await attachMeetLink(bookingId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/requests");
}

/**
 * Creates a Meet link for a booking that was just accepted.
 *
 * Best effort by design: the booking is already confirmed by the time this
 * runs, and a failure here must not undo that. When it cannot produce a link
 * the seeker falls back to the specialist's pasted one, which is why that
 * field is required.
 *
 * Runs in the specialist's own session, so RLS lets it read their refresh
 * token without any elevated key.
 */
async function attachMeetLink(bookingId: string) {
  if (!isGoogleConfigured()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: account } = await supabase
    .from("mentor_google_accounts")
    .select("refresh_token")
    .eq("id", user.id)
    .maybeSingle();

  const refreshToken = account?.refresh_token as string | undefined;
  if (!refreshToken) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, message, availability_slots(start_time, end_time), profiles!bookings_seeker_id_fkey(full_name)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  const slot = booking?.availability_slots as unknown as {
    start_time: string;
    end_time: string;
  } | null;
  if (!slot) return;

  const seeker = booking?.profiles as unknown as {
    full_name: string | null;
  } | null;
  const seekerName = seeker?.full_name ?? "متقاضی";

  const link = await createMeetLink({
    refreshToken,
    summary: `۲۲ درجه — گفتگو با ${seekerName}`,
    // The question they asked, so the specialist opens the calendar entry and
    // already knows what the call is about.
    description: [
      `تماس ۲۲ دقیقه‌ای از طریق ۲۲ درجه.`,
      booking?.message ? `\nسؤال: ${booking.message}` : "",
      `\nزمان: ${dateFormats.full.format(new Date(slot.start_time))} (به وقت تهران)`,
    ].join(""),
    startsAt: slot.start_time,
    endsAt: slot.end_time,
  });

  if (!link) return;

  await supabase
    .from("bookings")
    .update({ meeting_link: link })
    .eq("id", bookingId)
    .eq("mentor_id", user.id);
}

export async function acceptBooking(formData: FormData) {
  await respond(formData, true);
}

export async function declineBooking(formData: FormData) {
  await respond(formData, false);
}

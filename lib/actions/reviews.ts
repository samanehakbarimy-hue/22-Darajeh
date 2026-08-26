"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; success?: boolean } | undefined;

/**
 * A seeker says how a session went.
 *
 * Almost nothing is trusted from the form. The specialist is read off the
 * booking rather than posted alongside it, and whether the session happened at
 * all is the database's decision — the insert policy on reviews requires a
 * confirmed booking of theirs whose time has passed. This function only has to
 * be polite about what comes back.
 */
export async function leaveReview(
  _prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  const body = String(formData.get("body") ?? "").trim();

  if (!bookingId) {
    return { error: "این جلسه پیدا نشد." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "امتیازت را انتخاب کن." };
  }
  if (body.length < 10) {
    return { error: "چند خط بنویس؛ یک کلمه به کسی کمک نمی‌کند." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "لطفاً دوباره وارد شو." };
  }

  // Off the booking, not out of the form: a hidden field is whatever the
  // browser decided to send.
  const { data: booking } = await supabase
    .from("bookings")
    .select("mentor_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return { error: "این جلسه پیدا نشد." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    mentor_id: booking.mentor_id,
    seeker_id: user.id,
    rating,
    body: body.slice(0, 1500),
  });

  if (error) {
    return {
      error:
        "نظرت ثبت نشد. اگر برای همین جلسه قبلاً نظر گذاشته‌ای، دوباره نمی‌شود.",
    };
  }

  revalidatePath("/dashboard/requests");
  revalidatePath(`/specialists/${booking.mentor_id}`);

  return { success: true };
}

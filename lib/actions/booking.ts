"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyNewRequest } from "@/lib/email/notifications";

export type BookingState = { error?: string } | undefined;

export async function createBooking(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slotId = String(formData.get("slot_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!slotId) {
    return { error: "یک زمان رو انتخاب کن." };
  }

  // No minimum: how much someone writes to introduce themselves is their call.
  if (!message) {
    return { error: "لطفاً یک معرفی بنویس." };
  }
  if (message.length > 2000) {
    return { error: "پیامت خیلی بلنده. کوتاه‌ترش کن." };
  }
  if (message.split(/\s+/).filter(Boolean).length > 120) {
    return { error: "متن معرفی باید حداکثر ۱۲۰ کلمه باشه." };
  }

  // Whose slot it is comes from the slot, never from the form. The database
  // refuses a mismatch either way, but sending one at all would be a bug.
  const { data: slot } = await supabase
    .from("availability_slots")
    .select("mentor_id")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot) {
    return { error: "این زمان دیگر در دسترس نیست." };
  }

  const { data: created, error } = await supabase
    .from("bookings")
    .insert({
      mentor_id: slot.mentor_id,
      slot_id: slotId,
      seeker_id: user.id,
      message,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { error: "این زمان همین الان توسط شخص دیگه‌ای رزرو شد." };
    }
    // Raised by the trigger in 0039. The cap lives in the database, so this
    // branch is the message rather than the rule.
    //
    // Matched on the SQLSTATE as well as the text. PostgREST puts a RAISE
    // message in `message`, but the only insert this action makes sets no
    // status, so 23514 on it can come from nothing else — and if the wording
    // ever moves, the code still catches it. Getting this wrong would show a
    // Persian speaker the raw string "pending_request_cap".
    if (
      error.code === "23514" ||
      error.message.includes("pending_request_cap")
    ) {
      return {
        error:
          "سه درخواست بی‌پاسخ داری. تا وقتی یکی از آن‌ها جواب بگیرد یا زمانش بگذرد، درخواست تازه نمی‌شود فرستاد.",
      };
    }
    return { error: error.message };
  }

  // The request is saved either way; telling the specialist is best effort.
  // This has to run before the redirect below, which throws by design.
  if (created?.id) {
    await notifyNewRequest(created.id);
  }

  redirect("/dashboard?booked=1");
}

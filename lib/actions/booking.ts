"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const mentorId = String(formData.get("mentor_id") ?? "");
  const slotId = String(formData.get("slot_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!slotId) {
    return { error: "یک زمان رو انتخاب کن." };
  }

  const wordCount = message.split(/\s+/).filter(Boolean).length;
  if (wordCount < 10) {
    return { error: "لطفاً یک معرفی کوتاه (حداقل چند جمله) بنویس." };
  }
  if (wordCount > 120) {
    return { error: "معرفی رو کمی کوتاه‌تر کن (حداکثر حدود ۱۰۰ کلمه)." };
  }

  const { error } = await supabase.from("bookings").insert({
    mentor_id: mentorId,
    slot_id: slotId,
    seeker_id: user.id,
    message,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "این زمان همین الان توسط شخص دیگه‌ای رزرو شد." };
    }
    return { error: error.message };
  }

  redirect("/dashboard?booked=1");
}

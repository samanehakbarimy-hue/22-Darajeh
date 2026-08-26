"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InquiryState = { error?: string } | undefined;

/**
 * A question to a specialist, from somebody already signed in.
 *
 * The rules are the database's: only as yourself, only to an approved
 * specialist, and only one still-unanswered question per specialist at a time.
 * That last one is a unique index rather than a check here, because the check
 * here can be skipped by calling the API directly.
 */
export async function sendInquiry(
  _prevState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const mentorId = String(formData.get("mentor_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!mentorId) {
    return { error: "این کارشناس پیدا نشد." };
  }
  if (body.length < 10) {
    return { error: "چند خط بنویس تا معلوم شود دنبال چه هستی." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/specialists/${mentorId}/message`);
  }

  const { error } = await supabase.from("inquiries").insert({
    mentor_id: mentorId,
    seeker_id: user.id,
    body: body.slice(0, 2000),
  });

  if (error) {
    // The one open inquiry per specialist is an index, so a second one comes
    // back as a duplicate rather than as anything a person would recognise.
    return {
      error: error.code === "23505"
        ? "یک پیام بی‌جواب برای همین کارشناس داری. تا جواب ندهد، پیام تازه نمی‌شود فرستاد."
        : "پیامت فرستاده نشد. یک بار دیگر امتحان کن.",
    };
  }

  revalidatePath("/dashboard/sessions");
  redirect(`/specialists/${mentorId}/message?sent=1`);
}

/** The specialist closes a question, which lets the next one through. */
export async function markInquiryAnswered(formData: FormData) {
  const id = String(formData.get("inquiry_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ answered_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/sessions");
}

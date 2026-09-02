"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyInquiryReply, notifyNewInquiry } from "@/lib/email/notifications";

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

  // Read back to find the row just written: the insert returns nothing, and
  // the notice needs an id. Failing to send it must not fail the message.
  const { data: mine } = await supabase
    .from("inquiries")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("seeker_id", user.id)
    .is("replied_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (mine?.[0]?.id) await notifyNewInquiry(mine[0].id as string);

  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/sessions");
  redirect(`/specialists/${mentorId}/message?sent=1`);
}

export type ReplyState = { error?: string; sent?: boolean } | undefined;

/**
 * The specialist answers, once.
 *
 * This replaces «جواب دادم», which wrote a timestamp, hid the card and sent
 * nothing — the seeker had been promised a notice that no code existed to
 * send. A real reply is stored, stays readable to both of them, and is what
 * now frees the seeker to ask again: answered_at is what
 * inquiries_one_open_per_pair keys on, and it is set here rather than by a
 * button that claims something happened.
 *
 * One reply, not a thread. Anything that needs more than this is what the free
 * 22-minute call is for.
 */
export async function replyToInquiry(
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const id = String(formData.get("inquiry_id") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();

  if (!id) return { error: "این پیام پیدا نشد." };
  if (reply.length < 10) {
    return { error: "چند خط بنویس تا جوابت به دردش بخورد." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "لطفاً دوباره وارد شو." };

  const now = new Date().toISOString();

  // mentor_id is named here as well as in the policy. RLS filtering an update
  // to zero rows is reported by PostgREST as success, so without this a reply
  // written to somebody else's message would say «فرستاده شد» and go nowhere.
  const { data, error } = await supabase
    .from("inquiries")
    .update({ reply: reply.slice(0, 2000), replied_at: now, answered_at: now })
    .eq("id", id)
    .eq("mentor_id", user.id)
    .is("replied_at", null)
    .select("id");

  if (error) return { error: "جوابت ثبت نشد. یک بار دیگر امتحان کن." };
  if (!data?.length) {
    return { error: "این پیام دیگر باز نیست." };
  }

  await notifyInquiryReply(id);

  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/sessions");
  return { sent: true };
}

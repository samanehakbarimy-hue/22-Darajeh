"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type BriefState = { error?: string } | undefined;

/** Digits in any script, plus separators, reduced to a number. */
function toNumber(raw: string): number | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "")
    .trim();
  if (!latin) return null;
  const n = Number(latin);
  return Number.isFinite(n) ? n : null;
}

/**
 * A seeker describes a piece of work and sends it to one specialist.
 *
 * The specialist writes no catalogue for this: project work is shaped by the
 * job, so the person who has the job describes it and the specialist answers
 * with terms. Every rule that matters — that they are approved, that they
 * offer project work at all, that only one brief is open between the two —
 * lives in the insert policy, not here.
 */
export async function sendBrief(
  _prev: BriefState,
  formData: FormData,
): Promise<BriefState> {
  const mentorId = String(formData.get("mentor_id") ?? "");
  const brief = String(formData.get("brief") ?? "").trim();

  if (!mentorId) return { error: "این متخصص پیدا نشد." };
  if (brief.length < 20) {
    return { error: "کمی بیشتر توضیح بده — دست‌کم بیست حرف." };
  }
  if (brief.length > 4000) {
    return { error: "توضیحت خیلی بلند است. کوتاه‌ترش کن." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/specialists/${mentorId}/project`);

  const { error } = await supabase
    .from("project_briefs")
    .insert({ mentor_id: mentorId, seeker_id: user.id, brief });

  if (error) {
    // The partial unique index is the only one a person can hit by accident.
    if (error.code === "23505") {
      return { error: "یک درخواست باز برای همین متخصص داری. اول جوابش را بگیر." };
    }
    return { error: "فرستادن درخواست انجام نشد. یک بار دیگر امتحان کن." };
  }

  revalidatePath("/dashboard/requests");
  redirect("/dashboard/requests?brief=1");
}

/**
 * The specialist's answer: terms, or no.
 *
 * The database function checks the brief is theirs and still open, and refuses
 * an acceptance that carries no rate — so "yes" always means something
 * specific rather than an agreement to sort the price out later.
 */
export async function respondToBrief(
  _prev: BriefState,
  formData: FormData,
): Promise<BriefState> {
  const briefId = String(formData.get("brief_id") ?? "");
  const accept = formData.get("accept") === "1";
  if (!briefId) return { error: "این درخواست پیدا نشد." };

  const rate = accept ? toNumber(String(formData.get("rate") ?? "")) : null;
  const hours = accept ? toNumber(String(formData.get("hours") ?? "")) : null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);

  if (accept) {
    if (rate === null || rate < 0) {
      return { error: "نرخ ساعتی این کار را بنویس." };
    }
    if (hours === null || hours < 1 || hours > 2000) {
      return { error: "تخمین ساعت را بین ۱ تا ۲۰۰۰ بنویس." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_brief", {
    brief_id: briefId,
    accept,
    rate_toman: rate,
    hours,
    note: note || null,
  });

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/requests");

  if (error) return { error: "جواب ثبت نشد. صفحه را تازه کن." };
  return undefined;
}

/** Taking back a brief nobody has answered yet. */
export async function withdrawBrief(
  _prev: BriefState,
  formData: FormData,
): Promise<BriefState> {
  const briefId = String(formData.get("brief_id") ?? "");
  if (!briefId) return { error: "این درخواست پیدا نشد." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_brief", { brief_id: briefId });

  revalidatePath("/dashboard/requests");
  if (error) return { error: "پس گرفتن انجام نشد. شاید جواب داده شده باشد." };
  return undefined;
}

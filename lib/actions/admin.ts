"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function setMentorStatus(
  mentorId: string,
  status: "approved" | "rejected" | "changes_requested" | "pending",
  reviewNote: string | null = null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mentor_profiles")
    .update({ status, review_note: reviewNote })
    .eq("id", mentorId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function approveMentor(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;

  // Checked here rather than only in the page, because a hidden button is
  // not a rule. Approving without a link publishes someone who can be
  // booked and then cannot be met.
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("mentor_meeting_links")
    .select("meeting_link")
    .eq("id", id)
    .maybeSingle();

  // Connected to Google counts: their bookings get links automatically.
  //
  // Through a function, not the mentor_google_connected view. That view runs
  // as the caller over a table whose only policy is "auth.uid() = id", so an
  // admin reading it matched nothing and every Google-connected specialist
  // looked link-less — this button sent them away asking for a link they did
  // not need.
  const { data: hasGoogle } = await supabase.rpc("mentor_has_google", {
    mentor: id,
  });

  if (!link?.meeting_link && !hasGoogle) {
    await setMentorStatus(
      id,
      "changes_requested",
      "برای تأیید پروفایل، لینک جلسه آنلاین را در صفحه پروفایل اضافه کن. بدون آن کسی که وقتت را رزرو می‌کند جایی برای آمدن ندارد.",
    );
    return;
  }

  await setMentorStatus(id, "approved");
}

/**
 * Hands the profile back with a reason instead of turning the person away.
 * The note is shown to them verbatim, so it is written for them to read.
 */
export async function requestMentorChanges(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  const note = String(formData.get("review_note") ?? "").trim();
  if (!id || !note) return;
  await setMentorStatus(id, "changes_requested", note.slice(0, 500));
}

/**
 * Puts a specialist back in the review queue.
 *
 * Rejecting is one click, sits beside approving, and asks for no
 * confirmation — and until this existed it was permanent: the specialist
 * could not resubmit and no screen could undo it, so a misclick ended
 * someone's account and only hand-written SQL could bring it back.
 */
export async function reopenMentorReview(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;
  await setMentorStatus(id, "pending", null);
}

export async function rejectMentor(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;
  await setMentorStatus(id, "rejected");
}

/**
 * The house view of a specialist, in the site's voice.
 *
 * Written by an admin and nobody else — a trigger on the column enforces that,
 * so this action does not have to be the only thing standing there.
 */
export async function saveAdminSummary(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;

  const summary = String(formData.get("admin_summary") ?? "")
    .trim()
    .slice(0, 1200);

  const supabase = await createClient();
  const { error } = await supabase
    .from("mentor_profiles")
    .update({ admin_summary: summary || null })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/specialists/${id}`);
}

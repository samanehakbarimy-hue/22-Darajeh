"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function setMentorStatus(
  mentorId: string,
  status: "approved" | "rejected" | "changes_requested",
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

export async function rejectMentor(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;
  await setMentorStatus(id, "rejected");
}

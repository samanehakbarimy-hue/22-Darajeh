"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function setMentorStatus(mentorId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mentor_profiles")
    .update({ status })
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

export async function rejectMentor(formData: FormData) {
  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;
  await setMentorStatus(id, "rejected");
}

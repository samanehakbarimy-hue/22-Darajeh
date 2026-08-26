"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Keep a specialist, or stop keeping them.
 *
 * One button doing both, because that is what the button says: it shows the
 * current state, and pressing it changes that state. Nothing to get out of
 * step with, and nothing that can be saved twice.
 */
export async function toggleSaved(formData: FormData) {
  const mentorId = String(formData.get("mentor_id") ?? "");
  if (!mentorId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Delete first and look at what came back, rather than reading and then
  // deciding. A read that returned nothing when the row was in fact there —
  // any hiccup between the two calls — left this inserting over a row that
  // already existed, which the primary key refuses, so the button appeared to
  // do nothing at all.
  const { data: removed } = await supabase
    .from("saved_specialists")
    .delete()
    .eq("seeker_id", user.id)
    .eq("mentor_id", mentorId)
    .select("mentor_id");

  if (!removed || removed.length === 0) {
    await supabase
      .from("saved_specialists")
      .insert({ seeker_id: user.id, mentor_id: mentorId });
  }

  revalidatePath(`/specialists/${mentorId}`);
  revalidatePath("/specialists");
}

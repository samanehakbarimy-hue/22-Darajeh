"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OutcomeState = { error?: string } | undefined;

/**
 * Records whether a session actually took place.
 *
 * Until this existed, nothing did. A booking the specialist had accepted was
 * counted as held the moment its slot ended, so two people who never met still
 * produced «۱ گفت‌وگوی انجام‌شده» on a public page. The count is the main thing
 * a stranger has to go on, which makes overstating it the worst number on the
 * site to get wrong.
 *
 * Either person in the session can answer, and the database checks that they
 * are one of the two, that it was accepted, and that the time has passed. It
 * stays unanswered until somebody says — and unanswered is never counted as
 * held.
 */
export async function setSessionOutcome(
  _prev: OutcomeState,
  formData: FormData,
): Promise<OutcomeState> {
  const booking = String(formData.get("booking_id") ?? "");
  const result = String(formData.get("outcome") ?? "");

  if (!booking) return { error: "این جلسه پیدا نشد." };
  if (result !== "held" && result !== "missed") {
    return { error: "جواب معتبر نیست." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_booking_outcome", {
    booking,
    result,
  });

  if (error) return { error: "ثبت نشد. صفحه را تازه کن." };

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/requests");
  return undefined;
}

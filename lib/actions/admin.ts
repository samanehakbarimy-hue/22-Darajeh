"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { processAvatar } from "@/lib/images";

/**
 * Refuses anyone who is not an admin, before anything below is attempted.
 *
 * The database already refuses them: every write here is against a policy of
 * `id = auth.uid() OR is_admin()`, and the access-rules suite proves it. But
 * an UPDATE that row-level security filters out is not an error — PostgREST
 * reports success over nothing — so without this the actions could not tell a
 * blocked attempt from a real one, and neither could anybody reading the
 * logs. Two ways in already shipped once and sat unnoticed; this is the layer
 * that makes the next one loud.
 *
 * Not a substitute for the policies. If these two ever disagree, the database
 * wins and should.
 */
async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("این کار فقط از ادمین برمی‌آید.");
  }
}

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
  await requireAdmin();

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
  await requireAdmin();

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
  await requireAdmin();

  const id = String(formData.get("mentor_id") ?? "");
  if (!id) return;
  await setMentorStatus(id, "pending", null);
}

export async function rejectMentor(formData: FormData) {
  await requireAdmin();

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
  await requireAdmin();

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

export type PhotoState = { error?: string; saved?: boolean } | undefined;

/**
 * Replaces a specialist's photo on their behalf.
 *
 * Most specialists arrive with LinkedIn's 100x100 thumbnail, which is the only
 * size that scope offers, and at 192px it is visibly soft. Until now the only
 * person who could improve it was the specialist, which meant asking them and
 * waiting.
 *
 * Two things have to give way for this, and both are narrow. The bytes go into
 * their folder in the avatars bucket, which an admin may now write to; the row
 * is written through admin_set_photo(), which touches one column and refuses
 * anybody who is not an admin. Neither the profiles policy nor anything else
 * about that row was opened up.
 *
 * It deliberately does not send them back for review. That trigger fires when
 * somebody edits their own photo, which is the case worth re-checking; an
 * admin fixing a picture is not, and unpublishing a specialist as a
 * side-effect of tidying their page would be a strange way to help.
 */
export async function setSpecialistPhoto(
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  await requireAdmin();

  const id = String(formData.get("mentor_id") ?? "");
  const photo = formData.get("photo");

  if (!id) return { error: "کارشناس پیدا نشد." };
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "یک فایل عکس انتخاب کن." };
  }

  // Same treatment a specialist's own upload gets: rotated by its EXIF flag,
  // shrunk to 800px and re-encoded, so an admin cannot accidentally put a 4MB
  // phone photo on the browse page.
  const processed = await processAvatar(photo);
  if (!processed.ok) return { error: processed.error };

  const supabase = await createClient();
  const path = `${id}/avatar.${processed.extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, processed.data, {
      upsert: true,
      contentType: processed.contentType,
    });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Cache-bust, or the old photo sits in every browser that has seen it —
  // including this admin's, which makes a change that worked look like one
  // that did not.
  const { error } = await supabase.rpc("admin_set_photo", {
    target: id,
    url: `${publicUrl}?t=${Date.now()}`,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/specialists/${id}`);
  revalidatePath("/specialists");
  revalidatePath("/");
  return { saved: true };
}

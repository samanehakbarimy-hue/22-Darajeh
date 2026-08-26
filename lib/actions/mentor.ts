"use server";

import { createClient } from "@/lib/supabase/server";
import { processAvatar } from "@/lib/images";
import { notifyProfileForReview } from "@/lib/email/notifications";

export type MentorProfileState =
  | { error?: string; success?: boolean; backToReview?: boolean }
  | undefined;

export async function saveMentorProfile(
  _prevState: MentorProfileState,
  formData: FormData,
): Promise<MentorProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "لطفاً دوباره وارد شو." };
  }

  const { data: before } = await supabase
    .from("mentor_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();
  const statusBefore = before?.status ?? null;

  const headline = String(formData.get("headline") ?? "").trim();
  const company = String(formData.get("company") ?? "")
    .trim()
    .slice(0, 80);
  const country = String(formData.get("country") ?? "").trim();
  // Blank is a real answer: the column is nullable and its check
  // constraint would reject an empty string.
  const seniorityRaw = String(formData.get("seniority") ?? "").trim();
  const seniority = seniorityRaw === "" ? null : seniorityRaw;
  const bio = String(formData.get("bio") ?? "").trim();
  const tagsRaw = String(formData.get("expertise_tags") ?? "").trim();
  const skillsRaw = String(formData.get("skills") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim();
  const meetingLink = String(formData.get("meeting_link") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!bio || !tagsRaw) {
    return { error: "بیو و حوزه‌های تخصص الزامی هستند." };
  }

  // An admin checks this claim before approving, so it cannot be optional.
  if (!seniority) {
    return { error: "میزان تجربه را انتخاب کن." };
  }

  // An accepted booking must lead somewhere, but there are two ways to get
  // there. A specialist who has connected Google gets a link generated for
  // every booking, so demanding they also paste one is asking them to do by
  // hand the thing the system already does — and most will not know how.
  const { data: googleAccount } = await supabase
    .from("mentor_google_accounts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!meetingLink && !googleAccount) {
    return {
      error:
        "یا حساب گوگلت را وصل کن تا لینک‌ها خودکار ساخته شوند، یا یک لینک ثابت اینجا بگذار.",
    };
  }
  // Only if one was actually given. The check above already decided whether a
  // link is needed at all; a specialist with Google connected is told plainly
  // they can leave this empty, and validating "" would throw and hand them
  // "your link is invalid" for a field they were invited to skip.
  if (meetingLink) {
    try {
      const parsed = new URL(meetingLink);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { error: "لینک جلسه باید با https:// شروع شود." };
      }
    } catch {
      return { error: "لینک جلسه معتبر نیست. کامل و با https:// بنویس." };
    }
  }

  const expertiseTags = tagsRaw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const photo = formData.get("photo");
  const hasNewPhoto = photo instanceof File && photo.size > 0;

  // Required, but "required" here means the profile ends up with a face — not
  // that a file is re-uploaded every time somebody edits their bio. Checked on
  // the server too, because the button is not the rule.
  if (!hasNewPhoto) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("photo_url")
      .eq("id", user.id)
      .single();

    if (!existing?.photo_url) {
      return { error: "عکس لازم است. بدون عکس، پروفایل منتشر نمی‌شود." };
    }
  }

  if (hasNewPhoto) {
    if (photo.size > 3 * 1024 * 1024) {
      return { error: "حجم عکس باید کمتر از ۳ مگابایت باشد." };
    }
    // Shrunk and re-encoded before it is stored, so the browse page is not
    // asking every visitor to download a full-size phone photo per specialist.
    const processed = await processAvatar(photo);
    if (!processed.ok) {
      return { error: processed.error };
    }

    const path = `${user.id}/avatar.${processed.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, processed.data, {
        upsert: true,
        contentType: processed.contentType,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ photo_url: `${publicUrl}?t=${Date.now()}` })
      .eq("id", user.id);
  }

  const { error } = await supabase.from("mentor_profiles").upsert({
    id: user.id,
    headline,
    company: company || null,
    country,
    seniority,
    bio,
    expertise_tags: expertiseTags,
    // Optional: a field is required, the tools are not. Someone whose work has
    // no named tools should not be blocked from having a profile.
    skills: skillsRaw
      .split(/[,،]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
    linkedin_url: linkedinUrl || null,
  });

  if (error) {
    return { error: error.message };
  }

  // The phone is for our records only — mentor and admin. The meeting link
  // has to reach whoever books, so it lives in its own table with its own
  // audience.
  const { error: contactError } = await supabase.from("mentor_contacts").upsert({
    id: user.id,
    phone,
    updated_at: new Date().toISOString(),
  });

  if (contactError) {
    return { error: contactError.message };
  }

  const { error: linkError } = await supabase
    .from("mentor_meeting_links")
    .upsert({
      id: user.id,
      meeting_link: meetingLink || null,
      updated_at: new Date().toISOString(),
    });

  if (linkError) {
    return { error: linkError.message };
  }

  // A corrected profile goes back in the queue: out of changes_requested
  // and into pending, the one status move a specialist is allowed to make.
  // It is a no-op in every other state — but never again a silent one:
  // swallowing this error left someone waiting in a queue they had dropped
  // out of, reading a screen that said the profile was saved.
  const { error: resubmitError } = await supabase.rpc(
    "resubmit_profile_for_review",
  );

  if (resubmitError) {
    return { error: resubmitError.message };
  }

  // A public edit takes an approved specialist off the list until somebody
  // looks again — a database trigger does it, not this action. They have to be
  // told, or they simply vanish from the site with a note saying "saved".
  const { data: saved } = await supabase
    .from("mentor_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  // Only on the way in. Saving again while already pending is not news.
  if (saved?.status === "pending" && statusBefore !== "pending") {
    await notifyProfileForReview(user.id);
  }

  return { success: true, backToReview: saved?.status === "pending" };
}

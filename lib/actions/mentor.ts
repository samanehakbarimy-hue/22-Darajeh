"use server";

import { createClient } from "@/lib/supabase/server";

export type MentorProfileState = { error?: string; success?: boolean } | undefined;

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

  const headline = String(formData.get("headline") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  // Blank is a real answer: the column is nullable and its check
  // constraint would reject an empty string.
  const seniorityRaw = String(formData.get("seniority") ?? "").trim();
  const seniority = seniorityRaw === "" ? null : seniorityRaw;
  const bio = String(formData.get("bio") ?? "").trim();
  const tagsRaw = String(formData.get("expertise_tags") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim();
  const meetingLink = String(formData.get("meeting_link") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!bio || !tagsRaw) {
    return { error: "بیو و حوزه‌های تخصص الزامی هستند." };
  }

  const expertiseTags = tagsRaw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 3 * 1024 * 1024) {
      return { error: "حجم عکس باید کمتر از ۳ مگابایت باشد." };
    }
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, photo, { upsert: true, contentType: photo.type });

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
    country,
    seniority,
    bio,
    expertise_tags: expertiseTags,
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

  return { success: true };
}

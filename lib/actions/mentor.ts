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

  const bio = String(formData.get("bio") ?? "").trim();
  const tagsRaw = String(formData.get("expertise_tags") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim();
  const meetingLink = String(formData.get("meeting_link") ?? "").trim();

  if (!bio || !tagsRaw) {
    return { error: "بیو و حوزه‌های تخصص الزامی هستند." };
  }

  const expertiseTags = tagsRaw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { error } = await supabase.from("mentor_profiles").upsert({
    id: user.id,
    bio,
    expertise_tags: expertiseTags,
    linkedin_url: linkedinUrl || null,
    meeting_link: meetingLink || null,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

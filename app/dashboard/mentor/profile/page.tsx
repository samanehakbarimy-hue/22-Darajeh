import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MentorProfileForm from "./mentor-profile-form";

export default async function MentorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, photo_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    redirect("/dashboard");
  }

  const { data: mentorProfile } = await supabase
    .from("mentor_profiles")
    .select("headline, bio, expertise_tags, linkedin_url, meeting_link")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">پروفایل متخصص</h1>
      <p className="mt-2 text-sm text-muted">
        این اطلاعات بعد از تأیید ادمین، به‌صورت عمومی نمایش داده می‌شه.
      </p>
      <MentorProfileForm
        initialPhotoUrl={profile?.photo_url ?? ""}
        initialHeadline={mentorProfile?.headline ?? ""}
        initialBio={mentorProfile?.bio ?? ""}
        initialTags={(mentorProfile?.expertise_tags ?? []).join("، ")}
        initialLinkedin={mentorProfile?.linkedin_url ?? ""}
        initialMeetingLink={mentorProfile?.meeting_link ?? ""}
      />
    </div>
  );
}

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
    .select(
      "headline, country, bio, expertise_tags, linkedin_url, seniority, status, review_note",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: contact } = await supabase
    .from("mentor_contacts")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: link } = await supabase
    .from("mentor_meeting_links")
    .select("meeting_link")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">پروفایل متخصص</h1>
      <p className="mt-2 text-sm text-muted">
        این اطلاعات بعد از تأیید ادمین، به‌صورت عمومی نمایش داده می‌شه.
      </p>

      {/* Sent back for a correction. The reason is shown in full, because
          "your profile was not accepted" with no reason is the thing that
          makes someone give up instead of fixing it. */}
      {mentorProfile?.status === "changes_requested" && (
        <div className="mt-6 rounded-2xl border border-brand/40 bg-brand-light p-5">
          <p className="font-bold text-brand">پروفایلت نیاز به اصلاح دارد</p>
          {mentorProfile.review_note && (
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground">
              {mentorProfile.review_note}
            </p>
          )}
          <p className="mt-3 text-xs leading-6 text-muted">
            اصلاحش کن و ذخیره بزن — دوباره خودکار برای بررسی فرستاده می‌شود.
          </p>
        </div>
      )}
      <MentorProfileForm
        initialPhotoUrl={profile?.photo_url ?? ""}
        initialHeadline={mentorProfile?.headline ?? ""}
        initialCountry={mentorProfile?.country ?? ""}
        initialBio={mentorProfile?.bio ?? ""}
        initialTags={(mentorProfile?.expertise_tags ?? []).join("، ")}
        initialLinkedin={mentorProfile?.linkedin_url ?? ""}
        initialMeetingLink={link?.meeting_link ?? ""}
        initialPhone={contact?.phone ?? ""}
        initialSeniority={mentorProfile?.seniority ?? ""}
      />
    </div>
  );
}

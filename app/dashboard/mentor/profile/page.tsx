import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MentorProfileForm from "./mentor-profile-form";
import { isGoogleConnectOffered } from "@/lib/google/meet";

const GOOGLE_MESSAGE: Record<string, string> = {
  connected: "حساب گوگلت وصل شد. از این به بعد برای هر جلسه‌ای که قبول کنی لینک ساخته می‌شود.",
  cancelled: "اتصال به گوگل انجام نشد. اشکالی ندارد — لینک ثابتت همچنان کار می‌کند.",
  failed: "اتصال به گوگل ناموفق بود. یک بار دیگر امتحان کن.",
};

export default async function MentorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
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

  // Only the fact of a connection, never the token: this reads the view,
  // which exposes the address and nothing beside it.
  const { data: googleAccount } = await supabase
    .from("mentor_google_connected")
    .select("google_email")
    .eq("id", user.id)
    .maybeSingle();

  // Someone already connected still sees it, so they can check or change
  // it. Everyone else is only offered it once the app is verified — see
  // isGoogleConnectOffered for why.
  const googleConnected = Boolean(googleAccount?.google_email);
  const showGoogleSection = googleConnected || isGoogleConnectOffered();

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
      {google && GOOGLE_MESSAGE[google] && (
        <p className="mt-6 rounded-2xl border border-card-border bg-card p-4 text-sm leading-7 text-muted">
          {GOOGLE_MESSAGE[google]}
        </p>
      )}

      {/* Hidden entirely until the Google credentials exist, so nobody is
          offered a button that cannot work. */}
      {showGoogleSection && (
        <div className="mt-6 rounded-2xl border border-card-border bg-card p-5">
          <h2 className="font-bold">ساخت خودکار لینک جلسه</h2>
          {googleAccount?.google_email ? (
            <>
              <p className="mt-2 text-sm leading-7 text-muted">
                وصل است به{" "}
                <span dir="ltr" className="text-foreground">
                  {googleAccount.google_email}
                </span>
                . برای هر جلسه‌ای که قبول می‌کنی یک لینک تازه ساخته می‌شود و
                توی تقویمت هم می‌آید.
              </p>
              <a
                href="/api/google/connect"
                className="mt-4 inline-block rounded-full border border-card-border px-5 py-2.5 text-sm hover:border-brand hover:text-brand"
              >
                وصل کردن حساب دیگر
              </a>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-7 text-muted">
                اگر حساب گوگلت را وصل کنی، دیگر لازم نیست لینک ثابت بگذاری —
                برای هر جلسه یک لینک جدا ساخته می‌شود و در تقویمت ثبت می‌شود.
              </p>

              {/* Google shows an "unverified app" warning for any app it has
                  not reviewed, and the word it uses is "unsafe". A specialist
                  meeting that unprepared reads it as a warning about us. Said
                  here first, in their language, it is an expected step
                  instead. Remove this once the app is verified. */}
              <p className="mt-3 rounded-xl border border-card-border bg-background p-3 text-xs leading-6 text-muted">
                گوگل هنوز اپ ما را بررسی نکرده، برای همین یک صفحه هشدار نشان
                می‌دهد و کلمه «unsafe» را می‌نویسد. این درباره امنیت سایت ما
                نیست؛ برای هر اپ تازه‌ای همین را نشان می‌دهد. روی{" "}
                <span dir="ltr" className="text-foreground">Advanced</span> و
                بعد{" "}
                <span dir="ltr" className="text-foreground">
                  Go to 22darajeh.com
                </span>{" "}
                بزن. تنها دسترسی‌ای که می‌گیریم ساختن رویداد در تقویم خودت
                است، و هر وقت خواستی می‌تونی قطعش کنی.
              </p>
              <a
                href="/api/google/connect"
                className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background hover:bg-brand-hover"
              >
                وصل کردن حساب گوگل
              </a>
            </>
          )}
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

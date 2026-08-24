import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ServicesEditor from "./services-editor";
import type { MentorService } from "@/lib/services";
import { getUsdToToman } from "@/lib/exchange-rate";
import { getCurrentUser } from "@/lib/auth";

export default async function MentorServicesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/mentor/services");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    redirect("/dashboard");
  }

  const usdRate = await getUsdToToman();

  const { data: mentorProfile } = await supabase
    .from("mentor_profiles")
    .select("seniority")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("mentor_services")
    .select("id, kind, session_key, title, description, minutes, min_hours, price_toman, is_active")
    .eq("mentor_id", user.id)
    .order("kind")
    .order("sort_order")
    .order("created_at");

  // 42P01 is "relation does not exist": migration 0019 has not been applied.
  // Saying so beats a blank page that looks like the feature is broken.
  const tableMissing = error?.code === "42P01";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">خدمات و قیمت‌ها</h1>
      <p className="mt-2 leading-8 text-muted">
        غیر از تماس رایگان ۲۲ دقیقه‌ای، می‌تونی جلسه مشاوره یا همکاری پروژه‌ای
        هم پیشنهاد بدی. قیمت‌ها را خودت تعیین می‌کنی و هر وقت خواستی عوضشان
        می‌کنی.
      </p>

      {/* The dollar figures beside every suggestion come from somewhere, and
          "somewhere" is not checkable. Naming the rate and its source lets a
          specialist compare it against what they already know the dollar is
          worth — and if the feed is down, saying so beats quietly dropping
          every dollar figure and leaving them to wonder. */}
      <p className="mt-4 rounded-xl border border-card-border bg-card px-4 py-3 text-xs leading-6 text-muted">
        {usdRate === null ? (
          <>
            نرخ دلار الان در دسترس نیست، برای همین مبلغ دلاری کنار پیشنهادها
            نوشته نمی‌شود. قیمت‌های تومانی سر جایشان‌اند.
          </>
        ) : (
          <>
            مبلغ‌های دلاری بر اساس نرخ{" "}
            <span className="font-medium text-foreground">
              {usdRate.toLocaleString("fa-IR")} تومان
            </span>{" "}
            برای هر دلار حساب شده‌اند — از بازار آزاد (tgju.org)، چند بار در
            روز به‌روز می‌شود. اگر با چیزی که می‌دانی جور نیست، به تومانش نگاه
            کن.
          </>
        )}
      </p>

      <ServicesEditor
        seniority={mentorProfile?.seniority ?? null}
        usdRate={usdRate}
        services={(data ?? []) as MentorService[]}
        tableMissing={tableMissing}
      />
    </div>
  );
}

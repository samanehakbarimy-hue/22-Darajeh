import { createClient } from "@/lib/supabase/server";
import SpecialistCard from "@/components/SpecialistCard";

export default async function SpecialistsPage() {
  const supabase = await createClient();
  const { data: specialists } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, country, bio, expertise_tags, profiles(full_name, photo_url)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">پیدا کردن متخصص</h1>
      <p className="mt-2 text-muted">
        یکی از متخصص‌های ۲۲ درجه رو انتخاب کن و یک تماس رایگان ۲۲ دقیقه‌ای رزرو
        کن.
      </p>

      {(!specialists || specialists.length === 0) && (
        <p className="mt-10 text-muted">
          هنوز متخصصی تأیید نشده. به‌زودی اینجا پر می‌شه!
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {specialists?.map((specialist) => {
          const profile = specialist.profiles as unknown as {
            full_name: string;
            photo_url: string | null;
          } | null;
          return (
            <SpecialistCard
              key={specialist.id}
              specialist={{
                id: specialist.id,
                headline: specialist.headline,
                country: specialist.country,
                expertise_tags: specialist.expertise_tags,
                name: profile?.full_name ?? "",
                photoUrl: profile?.photo_url,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

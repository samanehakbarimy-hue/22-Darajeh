import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SpecialistsPage() {
  const supabase = await createClient();
  const { data: specialists } = await supabase
    .from("mentor_profiles")
    .select("id, bio, expertise_tags, profiles(full_name)")
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

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialists?.map((specialist) => {
          const name =
            (specialist.profiles as unknown as { full_name: string } | null)
              ?.full_name ?? "";
          return (
            <Link
              key={specialist.id}
              href={`/specialists/${specialist.id}`}
              className="flex flex-col items-start rounded-2xl border border-card-border bg-card p-5 text-right transition hover:border-brand"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand">
                {name.slice(0, 1)}
              </div>
              <h3 className="font-bold">{name}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{specialist.bio}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(specialist.expertise_tags ?? []).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-light px-2 py-1 text-xs text-brand"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

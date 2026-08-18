import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data: specialists } = await supabase
    .from("mentor_profiles")
    .select("id, headline, bio, expertise_tags, profiles(full_name, photo_url)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center px-6 py-20 text-center">
        {deleted === "1" && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
            حسابت با موفقیت حذف شد.
          </div>
        )}
        <span className="mb-4 rounded-full bg-brand-light px-4 py-1 text-sm font-medium text-brand">
          کاملاً رایگان برای شروع
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          یک تماس رایگان ۲۲ دقیقه‌ای با متخصصی که تجربه‌اش را داره.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          هر متخصص در ۲۲ درجه یک گفتگوی رایگان و بدون فشار ۲۲ دقیقه‌ای ارائه
          می‌ده. موضوع را انتخاب کن، زمان را انتخاب کن، و از کسی که قبلاً این
          مسیر را رفته راهنمایی بگیر.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/specialists"
            className="rounded-full bg-brand px-8 py-3 font-semibold text-background hover:bg-brand-dark"
          >
            پیدا کردن متخصص
          </Link>
          <Link
            href="/signup/mentor"
            className="rounded-full border border-card-border px-8 py-3 font-medium hover:bg-card"
          >
            متخصص شدن
          </Link>
        </div>

        {specialists && specialists.length > 0 && (
          <section className="mt-24 w-full max-w-5xl">
            <h2 className="mb-8 text-right text-xl font-bold">متخصص‌های ۲۲ درجه</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {specialists.map((specialist) => {
                const profile = specialist.profiles as unknown as {
                  full_name: string;
                  photo_url: string | null;
                } | null;
                const name = profile?.full_name ?? "";
                return (
                  <Link
                    key={specialist.id}
                    href={`/specialists/${specialist.id}`}
                    className="flex flex-col items-start rounded-2xl border border-card-border bg-card p-5 text-right transition hover:border-brand"
                  >
                    <div className="mb-4">
                      <Avatar photoUrl={profile?.photo_url} name={name} size={56} />
                    </div>
                    <h3 className="font-bold">{name}</h3>
                    {specialist.headline && (
                      <p className="mt-0.5 text-sm text-muted">{specialist.headline}</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {specialist.bio}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(specialist.expertise_tags ?? [])
                        .slice(0, 2)
                        .map((tag: string) => (
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
          </section>
        )}
      </main>
    </div>
  );
}

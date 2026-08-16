import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: specialist } = await supabase
    .from("mentor_profiles")
    .select("id, bio, expertise_tags, linkedin_url, status, profiles(full_name)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!specialist) {
    notFound();
  }

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time")
    .eq("mentor_id", id)
    .eq("is_booked", false)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  const name =
    (specialist.profiles as unknown as { full_name: string } | null)?.full_name ?? "";

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <Link href="/specialists" className="text-sm text-muted hover:text-foreground">
        ← بازگشت به فهرست متخصص‌ها
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-3xl font-bold text-brand">
              {name.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              {specialist.linkedin_url && (
                <a
                  href={specialist.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand"
                >
                  لینکدین
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(specialist.expertise_tags ?? []).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-card px-3 py-1 text-sm text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold">درباره من</h2>
          <p className="mt-3 leading-8 text-muted">{specialist.bio}</p>
        </div>

        <aside className="h-fit rounded-2xl border border-card-border bg-card p-5">
          <div className="rounded-xl border border-card-border p-4">
            <h3 className="font-bold">تماس آشنایی</h3>
            <p className="mt-1 text-sm text-muted">
              گفتگوی کوتاه برای آشنایی و بررسی نیاز شما
            </p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">۲۲ دقیقه</span>
              <span className="font-bold text-brand">رایگان</span>
            </div>
          </div>

          <Link
            href={`/specialists/${specialist.id}/book`}
            className="mt-4 block rounded-full bg-brand px-4 py-3 text-center font-semibold text-background hover:bg-brand-dark"
          >
            رزرو جلسه رایگان
          </Link>

          <div className="mt-5 border-t border-card-border pt-4">
            <h4 className="text-sm font-bold text-muted">زمان‌های موجود</h4>
            {(!slots || slots.length === 0) && (
              <p className="mt-2 text-sm text-muted">
                فعلاً زمان خالی ثبت نشده.
              </p>
            )}
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {slots?.map((slot) => (
                <li key={slot.id} className="text-muted">
                  {timeFormatter.format(new Date(slot.start_time))}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

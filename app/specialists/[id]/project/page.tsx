import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatServicePrice } from "@/lib/services";
import BriefForm from "./brief-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "درخواست همکاری پروژه‌ای — ۲۲ درجه" };

export default async function ProjectBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/specialists/${id}/project`);
  }

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id, headline, profiles(full_name)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!mentor) notFound();

  const { data: rate } = await supabase
    .from("mentor_services")
    .select("price_toman, is_negotiable, is_active")
    .eq("mentor_id", id)
    .eq("kind", "hourly_project")
    .maybeSingle();

  // No rate published means no project work offered — the insert policy would
  // refuse anyway, so say so here rather than after they have written it out.
  if (!rate?.is_active) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
        <h1 className="text-2xl font-bold">این متخصص کار پروژه‌ای نمی‌گیرد</h1>
        <p className="mt-2 leading-7 text-muted">
          می‌تونی تماس رایگان ۲۲ دقیقه‌ای را رزرو کنی و نیازت را با او در میان
          بگذاری.
        </p>
        <Link
          href={`/specialists/${id}`}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover"
        >
          برگشت به پروفایل
        </Link>
      </div>
    );
  }

  // A specialist cannot brief themselves: the insert policy refuses
  // mentor_id = auth.uid(). Offering the form anyway would let them write the
  // whole thing out and only fail on send.
  if (user.id === id) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
        <h1 className="text-2xl font-bold">این صفحه‌ی توست</h1>
        <p className="mt-2 leading-7 text-muted">
          متقاضی‌ها از همین‌جا کارشان را برایت می‌نویسند. هر درخواستی که برسد
          در «جلسات من» نشانت داده می‌شود.
        </p>
        <Link
          href="/dashboard/sessions"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-hover"
        >
          دیدن درخواست‌ها
        </Link>
      </div>
    );
  }

  const name =
    (mentor.profiles as unknown as { full_name: string } | null)?.full_name ??
    "متخصص";

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href={`/specialists/${id}`}
        className="inline-block py-1 text-sm text-muted hover:text-foreground"
      >
        ← بازگشت به پروفایل {name}
      </Link>

      <h1 className="mt-6 text-2xl font-bold">کارت را برای {name} بنویس</h1>
      <p className="mt-2 leading-7 text-muted">
        هرچه دقیق‌تر بنویسی، جواب دقیق‌تری می‌گیری. {name} این را می‌خواند و
        می‌گوید قبول می‌کند یا نه — و اگر قبول کرد، نرخ و تخمین ساعتش را
        می‌نویسد.
      </p>

      <p className="mt-4 rounded-xl border border-card-border bg-card px-4 py-3 text-sm leading-7 text-muted">
        نرخ اعلام‌شده‌اش:{" "}
        <span className="font-medium text-foreground">
          {rate.is_negotiable
            ? "قابل مذاکره"
            : formatServicePrice({
                price_toman: rate.price_toman,
                kind: "hourly_project",
              } as never)}
        </span>{" "}
        — برای کار تو ممکن است فرق کند.
      </p>

      <BriefForm mentorId={id} />
    </div>
  );
}

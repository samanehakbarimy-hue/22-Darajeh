import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import MessageForm from "./message-form";

const HINTS = [
  "یک سؤال کوتاه بپرس، پیش از آنکه وقت بگیری.",
  "بگو دنبال چه هستی و بپرس کدام گزینه به کارت می‌آید.",
];

export default async function MessageSpecialistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const supabase = await createClient();

  const { data: specialist } = await supabase
    .from("mentor_profiles")
    .select("id, status, profiles(full_name)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!specialist) {
    notFound();
  }

  const name =
    (specialist.profiles as unknown as { full_name: string } | null)
      ?.full_name ?? "";

  const viewer = await getCurrentUser();

  // Already waiting on an answer from this specialist? The index would refuse
  // the insert anyway; this is so the page says so before they write it out.
  const { data: openInquiry } = viewer
    ? await supabase
        .from("inquiries")
        .select("id")
        .eq("seeker_id", viewer.id)
        .eq("mentor_id", id)
        .is("answered_at", null)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold">پیام به {name}</h1>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-brand/40 bg-brand-light px-5 py-4 text-sm leading-7 text-brand-deep">
          پیامت رفت. وقتی جواب داد، خبردار می‌شوی.
          <Link
            href={`/specialists/${id}`}
            className="mt-3 block font-medium underline"
          >
            بازگشت به پروفایل {name}
          </Link>
        </div>
      ) : viewer ? (
        <div className="mt-8">
          <MessageForm specialistId={id} blocked={Boolean(openInquiry)} />
        </div>
      ) : (
        // No account yet. Rather than a form that cannot send, this says what
        // is needed and keeps the destination, so they land back here.
        <div className="mt-8 rounded-2xl border border-card-border bg-card px-6 py-6 shadow-sm">
          <p className="text-sm leading-8">
            برای فرستادن پیام به یک حساب لازم است. حسابت را بساز و برگرد —
            همین‌جا می‌آیی و پیامت را می‌نویسی.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/signup/seeker?next=/specialists/${id}/message`}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-on transition hover:bg-brand-hover"
            >
              ساختن حساب
            </Link>
            <Link
              href={`/login?next=/specialists/${id}/message`}
              className="text-sm font-medium text-brand-deep hover:underline"
            >
              حساب داری؟ وارد شو
            </Link>
          </div>
        </div>
      )}

      {!sent && (
        <div className="mt-8">
          <p className="text-sm font-bold">نمی‌دانی چه بنویسی؟</p>
          <ul className="mt-3 flex flex-col gap-2">
            {HINTS.map((hint) => (
              <li key={hint} className="flex items-start gap-2.5">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-1 h-4 w-4 shrink-0 text-brand-deep"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-sm leading-7 text-muted">{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

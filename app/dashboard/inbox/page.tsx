import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { dateFormats } from "@/lib/persian";
import InquiryReply from "@/components/InquiryReply";

export const metadata = { title: "صندوق پیام — جاب‌آموز" };

/**
 * Everything that has happened between this person and somebody else.
 *
 * Built by reading the two tables that already hold it — inquiries and
 * bookings — rather than by keeping a third table of notifications beside
 * them. A mirror would have to be written on every path that touches either
 * one, and the first path that forgot would leave an inbox quietly disagreeing
 * with the database. Reading is also what makes this removable: delete the
 * route and nothing else changes.
 *
 * Both roles use one page. A seeker sees the messages they sent and the
 * sessions they booked; a specialist sees the messages they were sent and the
 * sessions booked with them. The row's own wording says which way round it is,
 * so nothing here has to ask what somebody's role is.
 *
 * Authorisation is the policies', not this page's: the SELECT policy on
 * inquiries matches only the two people in one, and bookings the same. The
 * filters below narrow what is asked for; they are not what keeps other
 * people's rows out.
 */
type Item = {
  id: string;
  at: string;
  kind: "sent" | "received" | "booking";
  title: string;
  detail: string | null;
  meta: string | null;
  reply: string | null;
  awaitingMyReply: boolean;
  href: string | null;
  /** Bookings only. A message has no status beyond whether it was answered. */
  status?: string;
};

const STATUS_LINE: Record<string, string> = {
  pending: "منتظر جواب کارشناس",
  confirmed: "تأیید شد",
  declined: "پذیرفته نشد",
  cancelled: "لغو شد",
};

export default async function InboxPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/inbox");
  }

  // Two reads, no join: a message and a booking share nothing but a timestamp
  // and the fact that both matter to whoever is looking.
  const { data: inquiryRows } = await supabase
    .from("inquiries")
    .select(
      "id, body, reply, created_at, replied_at, mentor_id, seeker_id, mentor:profiles!inquiries_mentor_id_fkey(full_name), seeker:profiles!inquiries_seeker_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  const { data: bookingRows } = await supabase
    .from("bookings")
    .select(
      "id, status, created_at, mentor_id, seeker_id, availability_slots(start_time), mentor:profiles!bookings_mentor_id_fkey(full_name), seeker:profiles!bookings_seeker_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  const nameOf = (joined: unknown) =>
    (joined as { full_name: string } | null)?.full_name ?? null;

  const items: Item[] = [];

  for (const row of inquiryRows ?? []) {
    const mine = row.seeker_id === user.id;
    const other = mine ? nameOf(row.mentor) : nameOf(row.seeker);
    items.push({
      id: `i-${row.id}`,
      // A reply is the newer event, so a message that has been answered sorts
      // by the answer rather than by the question nobody is waiting on.
      at: (row.replied_at as string | null) ?? (row.created_at as string),
      kind: mine ? "sent" : "received",
      title: mine
        ? `پیامت به ${other ?? "کارشناس"}`
        : `پیام از ${other ?? "یک متقاضی"}`,
      detail: row.body as string,
      meta: row.replied_at
        ? null
        : mine
          ? "هنوز جواب نداده"
          : "منتظر جواب توست",
      reply: (row.reply as string | null) ?? null,
      awaitingMyReply: !mine && !row.replied_at,
      href: null,
    });
  }

  const when = dateFormats.full;

  for (const row of bookingRows ?? []) {
    const mine = row.seeker_id === user.id;
    const other = mine ? nameOf(row.mentor) : nameOf(row.seeker);
    // PostgREST types a one-to-one embed as an array; the rest of this app
    // unwraps the same shape the same way.
    const slot = row.availability_slots as unknown as {
      start_time: string;
    } | null;
    const status = String(row.status);

    items.push({
      id: `b-${row.id}`,
      at: row.created_at as string,
      kind: "booking",
      title: mine
        ? `گفت‌وگوی تو با ${other ?? "کارشناس"}`
        : `${other ?? "یک متقاضی"} با تو گفت‌وگو گرفت`,
      detail: null,
      meta: slot ? `${when.format(new Date(slot.start_time))} — به وقت تهران` : null,
      reply: null,
      awaitingMyReply: false,
      href: mine ? "/dashboard/requests" : "/dashboard/sessions",
      status,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">صندوق پیام</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        پیام‌ها و گفت‌وگوها، به‌ترتیب تازگی. چیزی از اینجا پاک نمی‌شود.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-card-border bg-card p-8 text-center">
          <p className="font-bold">هنوز چیزی اینجا نیست</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            وقتی کسی برایت پیام بگذارد یا گفت‌وگویی رزرو شود، همین‌جا می‌ماند.
          </p>
          <Link
            href="/specialists"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-hover"
          >
            پیدا کردن کارشناس
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {items.map((item) => {
            const status = item.status;
            return (
              <li
                key={item.id}
                className={`rounded-2xl border bg-card p-6 ${
                  item.awaitingMyReply
                    ? "border-brand/40"
                    : "border-card-border"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-bold">{item.title}</p>
                  <span className="text-xs text-muted">
                    {when.format(new Date(item.at))}
                  </span>
                </div>

                {status && (
                  <p className="mt-1 text-sm text-muted">
                    {STATUS_LINE[status] ?? status}
                  </p>
                )}
                {item.meta && !status && (
                  <p className="mt-1 text-sm text-muted">{item.meta}</p>
                )}

                {item.detail && (
                  <p className="mt-3 whitespace-pre-line leading-8">
                    {item.detail}
                  </p>
                )}

                {item.reply && (
                  <div className="mt-4 rounded-xl border border-card-border bg-background p-4">
                    <p className="text-xs text-muted">جواب</p>
                    <p className="mt-1.5 whitespace-pre-line leading-8">
                      {item.reply}
                    </p>
                  </div>
                )}

                {item.awaitingMyReply && (
                  <InquiryReply inquiryId={item.id.slice(2)} />
                )}

                {item.href && (
                  <Link
                    href={item.href}
                    className="mt-3 inline-block text-sm text-brand-deep underline-offset-4 hover:underline"
                  >
                    دیدن جزئیات
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

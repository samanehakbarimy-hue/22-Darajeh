import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "./send";
import { emailLayout, whenLine } from "./layout";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://22darajeh.com";

type Parties = {
  seeker_name: string | null;
  seeker_email: string;
  mentor_name: string | null;
  mentor_email: string;
  starts_at: string;
  ends_at: string | null;
  message: string | null;
  meeting_link: string | null;
  status: string;
};

/**
 * Reads the two people on a booking through the definer function, which checks
 * the caller is one of them. Returns null rather than throwing: a notice that
 * cannot be addressed is a notice that does not get sent, never a booking that
 * fails to save.
 */
async function partiesFor(bookingId: string): Promise<Parties | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("booking_parties", {
      booking_id: bookingId,
    });
    if (error || !data?.length) return null;
    return data[0] as Parties;
  } catch {
    return null;
  }
}

/** Escapes anything a person typed before it goes near an HTML email. */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A specialist has a new request waiting. */
export async function notifyNewRequest(bookingId: string): Promise<void> {
  const p = await partiesFor(bookingId);
  if (!p) return;

  await sendEmail({
    to: p.mentor_email,
    subject: "یک درخواست جلسه تازه داری",
    html: emailLayout({
      heading: `${esc(p.seeker_name ?? "یک متقاضی")} ازت وقت خواسته`,
      body: `
        <div>زمان درخواستی: <strong>${whenLine(p.starts_at)}</strong></div>
        ${p.message ? `<div style="margin-top:12px;padding:12px;background:#f6f4f2;border-radius:10px">${esc(p.message)}</div>` : ""}
        <div style="margin-top:14px">تا وقتی جواب ندهی این زمان برای کس دیگری آزاد نمی‌شود.</div>`,
      action: { label: "دیدن درخواست", href: `${SITE}/dashboard/sessions` },
    }),
  });
}

/** The specialist said yes — the seeker needs the time and the link. */
export async function notifyAccepted(bookingId: string): Promise<void> {
  const p = await partiesFor(bookingId);
  if (!p) return;

  await sendEmail({
    to: p.seeker_email,
    subject: "درخواستت قبول شد",
    html: emailLayout({
      heading: `${esc(p.mentor_name ?? "کارشناس")} درخواستت را قبول کرد`,
      body: `
        <div>زمان جلسه: <strong>${whenLine(p.starts_at)}</strong> (به وقت تهران)</div>
        <div style="margin-top:12px">${
          p.meeting_link
            ? "لینک ورود به جلسه پایین همین پیام است. کمی قبل از شروع آماده باش."
            : "لینک جلسه هنوز ثبت نشده. به‌محض اینکه اضافه شود، در صفحه درخواست‌هایت می‌بینی‌اش."
        }</div>`,
      action: p.meeting_link
        ? { label: "ورود به جلسه", href: p.meeting_link }
        : { label: "دیدن درخواست‌ها", href: `${SITE}/dashboard/requests` },
    }),
  });
}

/** The specialist said no. */
export async function notifyDeclined(bookingId: string): Promise<void> {
  const p = await partiesFor(bookingId);
  if (!p) return;

  // A request left unanswered until its time passed can still be cleared off
  // the specialist's list, and that goes through the same decline path. The
  // seeker has already watched it expire and been told so; posting them a
  // rejection days afterwards is both stale and not quite true.
  const ended = new Date(p.ends_at ?? p.starts_at).getTime();
  if (ended < Date.now()) return;

  await sendEmail({
    to: p.seeker_email,
    subject: "درخواستت این بار جور نشد",
    html: emailLayout({
      heading: `${esc(p.mentor_name ?? "کارشناس")} نتوانست این وقت را قبول کند`,
      body: `
        <div>زمان درخواستی: ${whenLine(p.starts_at)}</div>
        <div style="margin-top:12px">این یعنی همان ساعت جور نبوده، نه اینکه سؤالت اشکالی داشته. وقت دیگری از همین کارشناس یا یک کارشناس دیگر انتخاب کن.</div>`,
      action: { label: "پیدا کردن وقت دیگر", href: `${SITE}/specialists` },
    }),
  });
}

/**
 * A live booking was called off. The notice goes to whichever side did not do
 * it — telling someone what they just did themselves is noise.
 */
export async function notifyCancelled(
  bookingId: string,
  cancelledBy: string,
  mentorId: string,
  reason: string | null,
): Promise<void> {
  const p = await partiesFor(bookingId);
  if (!p) return;

  const mentorCancelled = cancelledBy === mentorId;
  const to = mentorCancelled ? p.seeker_email : p.mentor_email;
  const who = mentorCancelled
    ? esc(p.mentor_name ?? "کارشناس")
    : esc(p.seeker_name ?? "متقاضی");

  await sendEmail({
    to,
    subject: "جلسه لغو شد",
    html: emailLayout({
      heading: `${who} این جلسه را لغو کرد`,
      body: `
        <div>زمان جلسه: ${whenLine(p.starts_at)}</div>
        ${reason ? `<div style="margin-top:12px">دلیلی که نوشته: ${esc(reason)}</div>` : ""}
        <div style="margin-top:12px">${
          mentorCancelled
            ? "این وقت دوباره آزاد شد. می‌تونی زمان دیگری انتخاب کنی."
            : "این زمان دوباره روی تقویمت آزاد شد."
        }</div>`,
      action: mentorCancelled
        ? { label: "پیدا کردن وقت دیگر", href: `${SITE}/specialists` }
        : { label: "دیدن جلسات", href: `${SITE}/dashboard/sessions` },
    }),
  });
}

/**
 * Something is waiting in the review queue.
 *
 * Goes to the address the contact page already publishes, so this needs no new
 * secret and leaks nothing: a specialist triggering it could have read it off
 * the site anyway. ADMIN_NOTIFY_EMAIL overrides it.
 *
 * Sent because the queue is a page nobody thinks to open. A profile edit now
 * takes an approved specialist off the site until somebody looks, and with one
 * specialist that means the browse page can quietly empty out — a fixed typo
 * should not cost a day of being invisible.
 */
export async function notifyProfileForReview(mentorId: string): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? "info@22darajeh.com";

  try {
    const supabase = await createClient();

    // Their own row, read by them — this runs inside their save.
    const { data } = await supabase
      .from("mentor_profiles")
      .select("headline, profiles!mentor_profiles_id_fkey(full_name)")
      .eq("id", mentorId)
      .maybeSingle();

    const name =
      (data?.profiles as unknown as { full_name: string } | null)?.full_name ??
      "یک کارشناس";
    const headline = data?.headline ?? "";

    await sendEmail({
      to,
      subject: "یک پروفایل منتظر بررسی است",
      html: emailLayout({
        heading: `${esc(name)} پروفایلش را برای بررسی فرستاد`,
        body: `
          ${headline ? `<div>${esc(headline)}</div>` : ""}
          <div style="margin-top:14px">تا وقتی تأیید نشود، روی فهرست کارشناس‌ها دیده نمی‌شود.</div>`,
        action: { label: "دیدن صف بررسی", href: `${SITE}/admin` },
      }),
    });
  } catch {
    // A notice that cannot be sent is never a save that fails.
  }
}

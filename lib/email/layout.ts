import { siteUrl } from "@/lib/site";

/**
 * The shell every email sits in — the ones this site sends, and the ones
 * Supabase sends on its behalf (see scripts/build-auth-templates.mts, which
 * writes those from this same function so the two can never drift apart).
 *
 * Styles are inline because a good number of mail clients drop <style> blocks,
 * and the layout is nested tables for the same reason — the modern
 * alternatives are exactly what those clients handle worst. dir="rtl" is on the
 * body so Persian runs the right way even where the client guesses otherwise.
 */

// The site's own colours, copied out of globals.css: navy header, the green
// button with its near-black label (white on that green is about 3.6:1, which
// is not enough), navy ink on white.
const HEADER = "#1c2b45";
const HEADER_FG = "#f4f1e6";
const BRAND = "#20917e";
const BRAND_ON = "#0a1c19";
const INK = "#162238";
const MUTED = "#4a566b";
const RULE = "#e1e6ee";

export function emailLayout({
  greetingName,
  greetingHtml,
  heading,
  body,
  action,
  showLinkAsText,
  note,
}: {
  /** The reader's name, already escaped. Without one the greeting stands alone. */
  greetingName?: string | null;
  /**
   * The whole greeting line, for the Supabase templates: there the name is a
   * placeholder Supabase fills in, and the line has to cope with no name.
   */
  greetingHtml?: string;
  heading: string;
  body: string;
  action?: { label: string; href: string };
  /** For links that must still work when a mail client strips the button. */
  showLinkAsText?: boolean;
  /** One quiet line under the button, e.g. what to do if this was not you. */
  note?: string;
}): string {
  const greeting =
    greetingHtml ?? (greetingName?.trim() ? `سلام ${greetingName.trim()}،` : "سلام،");

  const button = action
    ? `<tr><td style="padding:4px 32px 8px">
         <a href="${action.href}" style="display:inline-block;background:${BRAND};color:${BRAND_ON};text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;font-size:15px">${action.label}</a>
       </td></tr>`
    : "";

  const linkAsText =
    action && showLinkAsText
      ? `<tr><td style="padding:8px 32px 0;font-size:13px;line-height:1.8;color:${MUTED}">
           اگر دکمه کار نکرد، این آدرس را در مرورگر باز کن:
           <div style="margin-top:4px;font-size:12px;word-break:break-all;direction:ltr;text-align:left">${action.href}</div>
         </td></tr>`
      : "";

  const noteRow = note
    ? `<tr><td style="padding:12px 32px 0;font-size:13px;line-height:1.8;color:${MUTED}">${note}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="fa" dir="rtl">
<body dir="rtl" style="margin:0;padding:0;background:#f3f4f7;font-family:Tahoma,Arial,sans-serif;color:${INK}">
  <!-- A full-width table whose one cell centres the card. Gmail drops the
       body tag and ignores "margin: 0 auto" on a table inside a right-to-left
       block, which left the card pushed against the right edge of a wide
       window. align="center" on a cell is the one thing every client obeys. -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f3f4f7"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;text-align:right;font-family:Tahoma,Arial,sans-serif">
    <tr><td style="background:${HEADER};padding:18px 32px">
      <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle"><img src="${siteUrl()}/logo-mark.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:8px"></td>
        <td style="vertical-align:middle;padding-right:12px;font-size:20px;font-weight:bold;color:${HEADER_FG}">جاب‌آموز</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 32px 0;font-size:15px;line-height:1.9;color:${INK}">${greeting}</td></tr>
    <tr><td style="padding:10px 32px 6px;font-size:17px;font-weight:bold;color:${INK}">${heading}</td></tr>
    <tr><td style="padding:0 32px 16px;font-size:15px;line-height:1.9;color:${INK}">${body}</td></tr>
    ${button}
    ${linkAsText}
    ${noteRow}
    <tr><td style="padding:24px 32px 0;font-size:15px;line-height:1.9;color:${INK}">با احترام،<br>جاب‌آموز</td></tr>
    <tr><td style="padding:20px 32px 28px">
      <div style="border-top:1px solid ${RULE};padding-top:14px;font-size:12px;line-height:1.8;color:${MUTED}">
        این ایمیل به دلیل حساب تو در جاب‌آموز فرستاده شده است.
        <a href="${siteUrl()}" style="color:${MUTED}">jobamooz.com</a>
      </div>
    </td></tr>
  </table>
  </td></tr></table>
</body>
</html>`;
}

/**
 * A time, always written in Tehran's clock whatever the server thinks.
 *
 * Assembled piece by piece. The one-call form (dateStyle: "full") comes out
 * of the server as «۱۴۰۵ مهر ۱۵, چهارشنبه ساعت ۱۷:۰۰»: year first, day last,
 * and a Latin comma — the order a person would never write it in.
 */
export function whenLine(startsAt: string): string {
  const date = new Date(startsAt);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "Asia/Tehran",
      ...options,
    }).format(date);

  const day = `${part({ weekday: "long" })} ${part({ day: "numeric" })} ${part({ month: "long" })} ${part({ year: "numeric" })}`;
  const time = part({ hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}، ساعت ${time}`;
}

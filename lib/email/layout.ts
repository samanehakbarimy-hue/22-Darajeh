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
 *
 * It is a letter on the site's own ivory, not a card on grey. The first
 * version was a narrow white box with 15px text and a dark band across the
 * top; set beside another service's email in the same inbox it read as a
 * system notification. What changed is room and size: the page colour runs
 * edge to edge, the headline is large, the text is the size people read at,
 * and nothing is boxed.
 */

// The site's own colours, copied out of globals.css: the ivory page, navy ink,
// the green button with its near-black label (white on that green is about
// 3.6:1, which is not enough).
const PAGE = "#fffff0";
const BRAND = "#20917e";
const BRAND_ON = "#0a1c19";
const INK = "#162238";
const MUTED = "#4a566b";
const RULE = "#dfe3d6";

// Segoe UI draws Persian more evenly than Tahoma where it exists (Windows);
// Tahoma is the fallback that is nearly everywhere; phones use their own.
const FONT = "'Segoe UI',Tahoma,Arial,sans-serif";

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
    ? `<tr><td style="padding:12px 0 8px">
         <a href="${action.href}" style="display:inline-block;background:${BRAND};color:${BRAND_ON};text-decoration:none;padding:15px 36px;border-radius:999px;font-weight:bold;font-size:17px">${action.label}</a>
       </td></tr>`
    : "";

  // The address is itself a link, styled quiet. Left as bare text, mail
  // clients turn it into a bright blue underlined block that outweighs the
  // button it is only a fallback for.
  const linkAsText =
    action && showLinkAsText
      ? `<tr><td style="padding:20px 0 0;font-size:13px;line-height:1.8;color:${MUTED}">
           اگر دکمه کار نکرد، این آدرس را در مرورگر باز کن:
           <div style="margin-top:4px;font-size:12px;word-break:break-all;direction:ltr;text-align:left"><a href="${action.href}" style="color:${MUTED};text-decoration:none">${action.href}</a></div>
         </td></tr>`
      : "";

  const noteRow = note
    ? `<tr><td style="padding:16px 0 0;font-size:14px;line-height:1.9;color:${MUTED}">${note}</td></tr>`
    : "";

  // The column sits in a full-width table whose one cell centres it. Mail
  // clients drop the body tag and do not reliably honour "margin: 0 auto" on
  // a table; align="center" on a cell is the centring every client obeys.
  // (Said here and not in the markup: a comment in the HTML would be sent to
  // every reader.)
  return `<!doctype html>
<html lang="fa" dir="rtl">
<body dir="rtl" style="margin:0;padding:0;background:${PAGE};font-family:${FONT};color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${PAGE}"><tr><td align="center" style="padding:44px 20px 52px">
  <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:560px;margin:0 auto;text-align:right;font-family:${FONT}">
    <tr><td style="padding:0 0 36px">
      <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle"><img src="${siteUrl()}/logo-mark.png" width="48" height="48" alt="" style="display:block;border:0;border-radius:10px"></td>
        <td style="vertical-align:middle;padding-right:12px;font-size:24px;font-weight:bold;color:${INK}">جاب‌آموز</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 0 18px;font-size:30px;line-height:1.5;font-weight:bold;color:${INK}">${heading}</td></tr>
    <tr><td style="padding:0 0 6px;font-size:17px;line-height:2;color:${INK}">${greeting}</td></tr>
    <tr><td style="padding:0 0 14px;font-size:17px;line-height:2;color:${INK}">${body}</td></tr>
    ${button}
    ${linkAsText}
    ${noteRow}
    <tr><td style="padding:32px 0 0;font-size:17px;line-height:1.9;color:${INK}">با احترام،<br>جاب‌آموز</td></tr>
    <tr><td style="padding:28px 0 0">
      <div style="border-top:1px solid ${RULE};padding-top:16px;font-size:13px;line-height:1.8;color:${MUTED}">
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

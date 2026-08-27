/**
 * The shell every notice sits in.
 *
 * Styles are inline because a good number of mail clients drop <style> blocks,
 * and the layout is one centred table for the same reason — the modern
 * alternatives are exactly what those clients handle worst. dir="rtl" is on the
 * body so Persian runs the right way even where the client guesses otherwise.
 */
const BRAND = "#da0101";
const INK = "#141110";
const MUTED = "#6b6560";

export function emailLayout({
  heading,
  body,
  action,
}: {
  heading: string;
  body: string;
  action?: { label: string; href: string };
}): string {
  const button = action
    ? `<tr><td style="padding:8px 0 4px">
         <a href="${action.href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;font-size:15px">${action.label}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="fa" dir="rtl">
<body dir="rtl" style="margin:0;padding:24px 12px;background:#f6f4f2;font-family:Tahoma,Arial,sans-serif;color:${INK}">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <tr><td style="font-size:20px;font-weight:bold;padding-bottom:4px">جاب‌آموز</td></tr>
    <tr><td style="font-size:17px;font-weight:bold;padding:16px 0 8px">${heading}</td></tr>
    <tr><td style="font-size:15px;line-height:1.9;color:${INK};padding-bottom:16px">${body}</td></tr>
    ${button}
    <tr><td style="font-size:12px;line-height:1.8;color:${MUTED};padding-top:24px;border-top:1px solid #eee;margin-top:16px">
      این پیام از طرف جاب‌آموز فرستاده شده چون در سایت حساب داری.
    </td></tr>
  </table>
</body>
</html>`;
}

/** A time, always written in Tehran's clock whatever the server thinks. */
export function whenLine(startsAt: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(startsAt));
}

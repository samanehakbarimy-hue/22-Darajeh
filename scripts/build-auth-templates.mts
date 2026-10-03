/**
 * Writes the six emails Supabase sends for us, from the same shell the site's
 * own emails use.
 *
 *   node --experimental-strip-types --import ./scripts/register-alias.mjs scripts/build-auth-templates.mts
 *
 * Supabase keeps these templates in its dashboard and has no API for them, so
 * the files this writes into supabase/templates/ still have to be pasted in by
 * hand (Authentication -> Emails). What this buys is that they are never
 * written by hand: change lib/email/layout.ts, run this, paste again.
 *
 * Every link goes to our own /auth/confirm with a token hash, not through
 * {{ .ConfirmationURL }}. That default ends in a one-time code only the
 * browser that started the flow can redeem, so a link opened on another device
 * fails; the token-hash form works wherever it is opened. {{ .RedirectTo }}
 * carries where the person was headed, and the route unwraps it.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { emailLayout } from "@/lib/email/layout";

const link = (type: string) =>
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next={{ .RedirectTo }}`;

const TEMPLATES: {
  file: string;
  dashboardName: string;
  subject: string;
  html: string;
}[] = [
  {
    file: "confirm-signup.html",
    dashboardName: "Confirm sign up",
    subject: "تأیید ایمیل در جاب‌آموز",
    html: emailLayout({
      heading: "تأیید ایمیل",
      body: "برای فعال شدن حساب، روی دکمه زیر کلیک کن.",
      action: { label: "تأیید ایمیل", href: link("email") },
      showLinkAsText: true,
      note: "اگر در جاب‌آموز ثبت‌نام نکرده‌ای، این ایمیل را نادیده بگیر.",
    }),
  },
  {
    file: "reset-password.html",
    dashboardName: "Reset password",
    subject: "بازیابی رمز عبور جاب‌آموز",
    html: emailLayout({
      heading: "بازیابی رمز عبور",
      body: "برای انتخاب رمز عبور تازه، روی دکمه زیر کلیک کن.",
      action: { label: "انتخاب رمز تازه", href: link("recovery") },
      showLinkAsText: true,
      note: "اگر این درخواست از تو نبوده است، این ایمیل را نادیده بگیر.",
    }),
  },
  {
    file: "magic-link.html",
    dashboardName: "Magic link or OTP",
    subject: "ورود به جاب‌آموز",
    html: emailLayout({
      heading: "ورود به حساب",
      body: "برای ورود به حساب، روی دکمه زیر کلیک کن.",
      action: { label: "ورود", href: link("magiclink") },
      showLinkAsText: true,
      note: "اگر این درخواست از تو نبوده است، این ایمیل را نادیده بگیر.",
    }),
  },
  {
    file: "change-email.html",
    dashboardName: "Change email address",
    subject: "تأیید ایمیل تازه در جاب‌آموز",
    html: emailLayout({
      heading: "تأیید ایمیل تازه",
      body: "برای تأیید تغییر ایمیل حساب به {{ .NewEmail }}، روی دکمه زیر کلیک کن.",
      action: { label: "تأیید ایمیل تازه", href: link("email_change") },
      showLinkAsText: true,
      note: "اگر این درخواست از تو نبوده است، این ایمیل را نادیده بگیر.",
    }),
  },
  {
    file: "invite.html",
    dashboardName: "Invite user",
    subject: "دعوت به جاب‌آموز",
    html: emailLayout({
      heading: "دعوت به جاب‌آموز",
      body: "برای ساختن حساب، روی دکمه زیر کلیک کن.",
      action: { label: "پذیرفتن دعوت", href: link("invite") },
      showLinkAsText: true,
    }),
  },
  {
    file: "reauthentication.html",
    dashboardName: "Reauthentication",
    subject: "کد تأیید جاب‌آموز",
    html: emailLayout({
      heading: "کد تأیید",
      body: `کد تأیید: <strong style="font-size:20px;letter-spacing:2px;direction:ltr;unicode-bidi:embed">{{ .Token }}</strong>`,
      note: "اگر این درخواست از تو نبوده است، این ایمیل را نادیده بگیر.",
    }),
  },
];

mkdirSync("supabase/templates", { recursive: true });
for (const t of TEMPLATES) {
  // Supabase fills {{ .SiteURL }} itself; the logo and footer link are fixed
  // to the public address so they work even if that setting changes.
  writeFileSync(`supabase/templates/${t.file}`, t.html + "\n", "utf8");
  console.log(`${t.file.padEnd(24)} ${t.dashboardName}`);
}

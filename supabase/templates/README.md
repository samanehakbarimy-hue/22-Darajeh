# The auth emails Supabase sends

Everything the *site* sends goes through `lib/email/` and deploys with the
code. These do not. Supabase sends them itself, from templates stored in its
dashboard, and there is no API for them — so the files here have to be pasted
in by hand.

**Do not edit these files.** They are written by a script from the same shell
the site's own emails use, so the two always look alike:

    node --experimental-strip-types --import ./scripts/register-alias.mjs scripts/build-auth-templates.mts

Change the wording in `scripts/build-auth-templates.mts`, or the look in
`lib/email/layout.ts`, run that, and paste again.

## Pasting

Supabase → Authentication → Emails → pick the template → set the subject and
replace the whole body with the file → Save.

| Dashboard name | File | Subject | In the dashboard? |
| --- | --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | `تأیید ایمیل در جاب‌آموز` | Yes, 2026-10-03 |
| Reset password | `reset-password.html` | `بازیابی رمز عبور جاب‌آموز` | Yes, 2026-10-03 |
| Magic link or OTP | `magic-link.html` | `ورود به جاب‌آموز` | Yes, 2026-10-03 |
| Change email address | `change-email.html` | `تأیید ایمیل تازه در جاب‌آموز` | Yes, 2026-10-03 |
| Invite user | `invite.html` | `دعوت به جاب‌آموز` | Yes, 2026-10-03 |
| Reauthentication | `reauthentication.html` | `کد تأیید جاب‌آموز` | Yes, 2026-10-03 |

Each was read back from the dashboard after a reload and compared with its
file by length and checksum. They were regenerated and pasted a second time
that day (name in the greeting, sign-off, centring), and read back again. The dashboard's Site URL is `https://jobamooz.com`
and `https://jobamooz.com/**` is in the redirect allow-list, which is what the
links in these templates depend on.

If a file here is regenerated, the dashboard copy is stale until pasted again.

Update the last column when one is pasted. Nothing in this repository can
tell what the dashboard holds; this table is the only record.

## Why the links do not use `{{ .ConfirmationURL }}`

That default goes through Supabase's own verify endpoint and comes back to
`/auth/callback` with a one-time code that only the browser that started the
flow can redeem (PKCE). Register on a laptop, open the email on a phone, and
the link lands on the login page with an error. The first outside specialist
did exactly this on 2026-09-29.

Every link here goes to our own `/auth/confirm` with `{{ .TokenHash }}`, which
is verified on whatever device opens it. `{{ .RedirectTo }}` is the callback
URL the app asked for; the route unwraps the destination inside it
(`destinationFromConfirmLink` in `lib/next-path.ts`).

`{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}`, `{{ .NewEmail }}`
and `{{ .Token }}` are Supabase's and must stay exactly as written.

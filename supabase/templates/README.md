# The auth emails Supabase sends

Everything the *site* sends goes through `lib/email/` and deploys with the
code. These do not. Supabase sends them itself, from templates stored in the
project dashboard, and there is no API for them — so a copy lives here and gets
pasted in by hand.

**Where:** Supabase → Authentication → Emails → the template, then paste the
subject and the HTML and save.

| File | Template | Subject | Pasted in |
| --- | --- | --- | --- |
| `confirm-signup.html` | Confirm signup | `تأیید ایمیل در جاب‌آموز` | 2026-09-20; link changed 2026-09-29 (see below) |

Editing a file here changes nothing on its own. Whatever is in the dashboard is
what gets sent, so a change to one of these has to be pasted in again.

The link appears twice — once on the button and once as text, because a mail
client that strips the button still leaves somebody a link they can copy — and
both must be identical:

    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}

**Why not `{{ .ConfirmationURL }}`, the default.** That one goes through
Supabase's own verify endpoint and comes back to `/auth/callback` with a
one-time code that can only be exchanged by the browser that started the
signup (PKCE). Somebody who registers on a laptop and opens the email on
their phone — the first outside specialist did exactly this on 2026-09-29 —
lands on the login page with an error, never gets the welcome email, and has
to sign in by hand. The `token_hash` form is verified by our own
`/auth/confirm` route on whatever device opens it. `{{ .RedirectTo }}` is the
callback URL signUp() asked for; the route unwraps the destination inside it.

The three template variables are Supabase's and must stay exactly as written.

The styling is `lib/email/layout.ts` written out flat. If that shell changes —
the wordmark, the colours, the footer line — this file is the one place that
will not follow on its own.

**Still English defaults:** Invite user, Magic Link, Change Email Address,
Reset Password, Reauthentication. Reset Password is the one a real person is
most likely to meet next.

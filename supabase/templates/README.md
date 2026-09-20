# The auth emails Supabase sends

Everything the *site* sends goes through `lib/email/` and deploys with the
code. These do not. Supabase sends them itself, from templates stored in the
project dashboard, and there is no API for them — so a copy lives here and gets
pasted in by hand.

**Where:** Supabase → Authentication → Emails → the template, then paste the
subject and the HTML and save.

| File | Template | Subject to set |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | `تأیید ایمیل در جاب‌آموز` |

`{{ .ConfirmationURL }}` is Supabase's own variable and must stay exactly as
written, twice — once on the button and once as text, because a mail client
that strips the button still leaves somebody a link they can copy. This is the
same link the untouched English default used; only the words and the styling
around it changed, so nothing about how a confirmation is verified moved.

The styling is `lib/email/layout.ts` written out flat. If that shell changes —
the wordmark, the colours, the footer line — this file is the one place that
will not follow on its own.

**Still English defaults:** Invite user, Magic Link, Change Email Address,
Reset Password, Reauthentication. Reset Password is the one a real person is
most likely to meet next.

# Handoff — JobAmooz

_Written 2026-09-20. The repo is the source of truth; where this disagrees, believe the files._

## Git / deploy state

- `master` HEAD == `origin/master` == `e5bc93e`, deployed to production.
- Uncommitted, leave alone: `.claude/settings.local.json`, `CLAUDE.md` (has the
  Session handoff section), this file.
- Production is `jobamooz` on Vercel (`sama-9866`), aliased to `jobamooz.com`.
  Deploy with `vercel --prod --yes` from **PowerShell** (the global CLI 59.1.3
  is the authorised one; `npx vercel` fetches a newer unauthorised build; git
  is not wired to auto-deploy).
- `git push` works again — `gh` CLI is git's credential helper for github.com
  and had `rsheikhyy` as the active account; fixed with
  `gh auth switch --user samanehakbarimy-hue`. If pushes 403 again, that
  switch got flipped back — re-run it.

## Active unfinished task: paste one template into Supabase

The specialist signup emails are **built, tested and deployed** (`e5bc93e`,
migration 0060) — see "Recently shipped". One step is left and only Samaneh
can do it, because Supabase has no API for auth templates:

**Supabase → Authentication → Emails → Confirm signup.** Paste
`supabase/templates/confirm-signup.html` as the body and
`تأیید ایمیل در جاب‌آموز` as the subject. Until then a new specialist still
gets the English default ("Confirm your signup"). `{{ .ConfirmationURL }}`
appears twice in that file and must stay exactly as written.

The other five auth templates are still English defaults. Reset Password is
the one a real person is most likely to meet next; nobody has asked for it.

Her one open judgement call: the Persian wording of both letters. She was
shown them rendered on 2026-09-20. Changing either is a one-string edit —
`sendWelcomeToSpecialist()` in `lib/email/notifications.ts` for the welcome,
the template file for the confirm.

## Recently shipped (do not redo)

- **The specialist welcome email** (`e5bc93e`, migration 0060).
  `claim_welcome_email()` stamps `profiles.welcome_email_sent_at` and returns
  the address in one statement, so the letter goes once however many times the
  auth callback runs (it runs on every LinkedIn sign-in). Stamp first, send
  second, `release_welcome_email()` hands it back when the send failed — which
  is also why this works locally with no Resend key. Every account that existed
  on 2026-09-20 was stamped in the migration so nobody got a stale welcome.
  Called from both `app/auth/confirm/route.ts` and `app/auth/callback/route.ts`.
  9 new access-rule checks; suite is 210 now.
- **Email buttons are the site teal** (`#20917e` fill, `#0a1c19` label, as in
  `globals.css`). The old `#da0101` was from a palette the site stopped using.
  This changes every notice, not just the new one.
- **Pricing cron fixed** (`5454c3b`, migration 0059). It had never run: the
  route called `refresh_prices()` through the anon-key client, which that
  function is revoked from. Now a narrow `pricing_cron` Postgres role (EXECUTE
  on that one function, no table access) called via direct `pg` from
  `lib/pricing-cron-db.ts`. Password lives only as Vercel env
  `PRICING_CRON_DATABASE_URL`. Verified end-to-end 2026-09-10: a real run moved
  `usd_rate` 206010 → 234220 and recalculated every `price_toman`. Runs itself
  at 06:00 UTC daily.
- **Inbox + real message replies** (`0346b7a`, migration 0058). `/dashboard/inbox`;
  the fake «جواب دادم» button is a real reply textarea + email both ways.
- **Profile form**: years-of-experience as a number 3–30 (band derived by
  trigger), four-part vertical rail progress, copy cleanup.
- **Pricing bands in USD** with the 60 USD cap; the two previously-uncapped
  services now have bands.
- **`22darajeh.com` redirects to jobamooz.com again** (`1698010`). Both apex
  and www 308 to the matching path; rules in `next.config.ts` `redirects()`.
  The domains are assigned to the `jobamooz` Vercel project — keep them there.

## Open decisions / loose ends

- **`SITE_PRIVATE` is on** — signed-out visitors see «در دست ساخت». Deliberate
  (her call). Do not "fix" it.
- **`git push` flips to the wrong GitHub account.** `gh` CLI is git's
  credential helper and keeps re-selecting `rsheikhyy` (403 on her repo). Fix
  each time with `gh auth switch --user samanehakbarimy-hue`.

## Test / build state at HEAD

- `npm test` — 31 pass, 0 fail
- `node scripts/db.js supabase/tests/access_rules.sql` — 210 pass, 0 fail
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds
- `npm run lint` — 3 errors, all pre-existing in `scripts/db.js` (AGENTS.md)

## First action for the next session

Nothing is half-built. The only outstanding step is hers: pasting
`supabase/templates/confirm-signup.html` into Supabase. Ask whether that is
done before writing anything new about signup mail.

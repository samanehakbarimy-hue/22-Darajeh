# Handoff — JobAmooz

_Written 2026-09-10. The repo is the source of truth; where this disagrees, believe the files._

## Git / deploy state

- `master` HEAD == `origin/master` == `5454c3b`. Nothing unpushed.
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

## Active unfinished task: specialist signup emails

**Proposed, not built.** A written proposal (both Persian drafts + the
once-only design) was shown to the user weeks ago; she has not answered the
open questions, so no code exists.

Plan once the questions are answered:
1. Migration `0060`: add `profiles.welcome_email_sent_at` + a `SECURITY
   DEFINER` claim function that stamps it only where still null and returns a
   row only to the caller that won (idempotent welcome email).
2. Send function in `lib/email/notifications.ts`, called from
   `app/auth/callback/route.ts` and `app/auth/confirm/route.ts`.
3. Access-rule checks: second call sends nothing, unverified refused, seeker
   refused, no claiming for another user.
4. Paste the Persian confirm-signup template into Supabase by hand (all six
   auth templates are currently untouched English defaults).

Open questions blocking it:
- Approve or edit the two Persian texts.
- Stamp before sending (a send failure loses the email) or after (risk of
  duplicates)?
- Should LinkedIn signups, which skip the confirm email, get the welcome?
- Existing emails carry a leftover red button (`#da0101`) vs the site teal —
  change it or leave it?

## Recently shipped (do not redo)

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
- `node scripts/db.js supabase/tests/access_rules.sql` — all pass, 0 fail
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds
- `npm run lint` — 3 errors, all pre-existing in `scripts/db.js` (AGENTS.md)

## First action for the next session

If continuing the signup emails: get the four open questions answered before
writing the migration — the second one decides the function's shape. That is
the only open build task.

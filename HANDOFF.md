# Handoff — JobAmooz

_Written 2026-09-29. The repo is the source of truth; where this disagrees, believe the files._

## Git / deploy state

- `master` == `origin/master` == `4cba25e`, **deployed to production 2026-09-29**
  (merges of #80 and #81; both branches deleted). Live checks after deploy:
  five security headers present, X-Powered-By gone, every page 200, cron 401,
  holding page intact.
- Vercel builds a preview for every pushed branch (behind its login wall);
  production still deploys only by `vercel --prod --yes` from PowerShell.
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

## Active: the first outside signup went badly (2026-09-29)

Samaneh's friend «سما» registered as a specialist at 13:41 UTC, confirmed at
13:42, signed in at 13:45, filled in the profile, pressed save, watched a
spinner for ~4 minutes, then got the «از سمت ما بود، نه تو» page. Nothing
saved: `profiles` row exists, no `mentor_profiles` row, no welcome stamp.

What is established:
- Vercel's function cap is 300s → the save ran until killed → 504 → React
  error boundary replaced the page and unmounted the form. Reproduced locally
  by answering a server action with a 504. Fixed in #81 (both halves) — merged
  and live.
- Not the photo processing (sharp does a 196MP bomb in 0.26s), not a lock
  (nothing stuck in pg_stat_activity), not a platform incident (Supabase's
  only one that day was 16:26 UTC, US-East; Vercel none).
- Photo was ≤3MB (client gate at line 338 of the profile form).

What is NOT established: which Supabase call stalled. Only the **Supabase
dashboard API/Postgres logs for 13:45–14:15 UTC on 2026-09-29** can say, and
they expire ~24h after. Needs her Chrome (extension was disconnected) or her
signing in to Supabase in the browser pane. After that window, this is
unknowable and the fixes in #81 are the answer regardless.

Also seen, lower priority: the email confirmation link did not log her in
(one session, at 13:45:30, not 13:42) — she had to sign in by hand. The
confirm mail uses `{{ .ConfirmationURL }}` → `/auth/callback` (PKCE), which
needs the browser that started signup. `/auth/confirm` (token_hash) exists
for exactly this and works from any device; switching the Supabase template
to it is a small follow-up, not done.

Welcome email never went out for her (callback bailed before the claim).

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

## Follow-ups that exist because of the 29th, none started

- Switch the Supabase "Confirm signup" template link to the token_hash form
  (`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`) so
  confirmation logs people in from any device. Template file + paste by hand.
- `keepTheForm()` on the shorter forms (booking, message, brief, review).
- Shrink photos in the browser before upload; phone photos are 4–15MB and
  the form currently refuses anything over 3MB.
- Ask the friend to try again — the site she hit is no longer the one running.

## First action for the next session

If it is still before ~13:45 UTC on 2026-09-30: Supabase dashboard → Logs →
API, window 13:45–14:15 UTC on the 29th, find the call that stalled. After
that the logs are gone and the cause stays unknown; the fixes stand anyway.

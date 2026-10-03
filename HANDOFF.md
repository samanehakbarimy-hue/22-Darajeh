# Handoff — JobAmooz

_Written 2026-10-03. The repo is the source of truth; where this disagrees, believe the files._

## Git / deploy state

- `master` == `origin/master`, **deployed to production 2026-10-02** with
  #83 (phone header menu) and #84 (Next.js 16.3.8, closes the next/og
  advisory; `npm audit` clean). Live checks after deploy: phone menu present,
  every page 200, security headers present, holding page intact.
- #85 (per-page titles, canonicals, JSON-LD, `public/og.png`,
  `public/llms.txt`, robots disallow list) merged and deployed 2026-10-02
  after she approved the wording. Checked live: the share image is served,
  and a signed-out visitor still gets the holding page with `noindex` and no
  preview tags. The site is NOT open and NOT indexed.
- #86 (signup trap field: a clipped, untabbable input that bots fill and
  people never meet; a filled trap is sent to `/signup/check-email` before any
  account or email) merged and deployed 2026-10-02. This is the part of
  signup bot protection that needs no dashboard; a CAPTCHA in Supabase Auth
  would still need her (third-party account + secret) and a code change to
  pass the token, so do not switch CAPTCHA on in the dashboard alone — it
  would break every signup and login.
- #87 merged and deployed 2026-10-03: **the header and footer are navy
  (`#1c2b45`), not green.** A tester said the old `#1a4740` read as
  police-uniform green; she compared four options on the real browse page and
  chose navy. The mid green stays on buttons only. Do not move it back.
- **THE SITE IS PUBLIC AND INDEXABLE since 2026-10-03.** On her explicit
  instruction ("I told you I want the site be published"), `SITE_PRIVATE` was
  removed from Vercel Production and `ALLOW_INDEXING=true` was added, then a
  forced redeploy. Checked live: the real homepage is served to strangers, no
  `noindex`, robots.txt carries the sitemap and the disallow list, every
  dashboard page sends a signed-out visitor only the shell and a redirect to
  login, `/admin` redirects, the cron route still answers 401. Do not put the
  holding page back unless she asks.
- #88 merged and deployed 2026-10-03: one voice, written Persian with «تو»,
  across the site, the emails and the template file. «گفتگو» is the only
  spelling. New copy must follow it: no «می‌کنه / رو / توی / بهمون».
- #89 merged and deployed 2026-10-03: the homepage hands follow the scroll on
  browsers without scroll-driven animations (Safari, so all of iOS) via a JS
  progress variable; the old three-second timer fallback is gone. Verified by
  patching `CSS.supports` in a desktop browser, not on a physical iPhone.
- #90 and #91 merged and deployed 2026-10-03: the forgot-password link sits
  under the password box, and over-explaining copy was cut down across 16
  files after she said "the receiver is not stupid". **Copy rule: say what
  happened and the next step, then stop.** No narrating the mechanism, no
  reassurance. The forgot-password confirmation is the same either way and
  must stay so (it must not reveal whether an address is registered).
- #92 merged and deployed 2026-10-03: one email shell (navy header with the
  logo, «سلام {name}،», button, sign-off) for the site's own notices, and
  `scripts/build-auth-templates.mts` generates all six Supabase auth templates
  from it into `supabase/templates/`. All six were pasted into the dashboard
  the same day. How: set the subject with the native input setter, replace the
  Monaco model with `executeEdits`, then `form.requestSubmit()`; a JS
  `.click()` on Save did nothing, and a cookie banner covered the real button
  until optional cookies were declined. Read back after a reload every time.
- #93 merged and deployed 2026-10-03: the sender name is `🌳 JobAmooz` for
  the site's own emails (`lib/email/send.ts`) and, in the Supabase dashboard's
  SMTP settings, for the auth emails. Only the Sender name field was changed
  there; the SMTP form keeps the stored password when its field is left empty
  ("Stored password is hidden. Enter a new password to replace it."). The
  first `vercel --prod` after this merge failed with a bare `"status":
  "error"` and the retry succeeded; that has happened twice, so retry once
  before investigating.
- #94 and #95 merged and deployed 2026-10-03: emails greet by name
  (`{{ if .Data.full_name }}` in the Supabase templates), sign off «با
  احترام،», and centre through a wrapping table. All six templates were
  regenerated, pasted again and read back. She confirmed a real reset email
  arrived in the new design.
- **Sender picture in Gmail (the round avatar) is not solved and cannot be
  from code.** Checked 2026-10-03: the domain has NO DMARC record, and
  `mail.jobamooz.com` (the sending subdomain) has no MX, so it cannot receive
  mail; `jobamooz.com` receives through Cloudflare Email Routing. Two routes,
  both needing Reza (he holds DNS): (a) free, Gmail only: make the sending
  address receivable, create a Google account on it, set the logo as its
  photo; (b) BIMI: DMARC at enforcement plus a paid certificate. A DMARC
  record is worth adding regardless, for deliverability.
- **Google Search Console is set up (2026-10-03, in her Chrome, at her
  request).** Property `https://jobamooz.com` (URL prefix), verified by the
  HTML tag in `app/layout.tsx` (`metadata.verification.google`, #96) — do not
  remove it. `sitemap.xml` submitted; its status read "Couldn't fetch" right
  after submitting, which is normal for the first minutes, and the sitemap
  answers 200 to Googlebot from outside. Indexing was requested for the
  homepage, whose last crawl (2026-09-30) had seen the old `noindex` holding
  page. The request for `/specialists` did not go through (the inspection box
  would not take input through the browser tool); the sitemap lists it.
  Check the sitemap status and the Pages report in a few days.
- #99 merged and deployed 2026-10-03: the sender name is `👔 JobAmooz` (she
  preferred the tie to the tree), in `lib/email/send.ts` and in the Supabase
  SMTP sender name.
- #98 merged and deployed 2026-10-03 on her "ship it": the email shell is a
  roomy letter on the site's ivory (30px headline, 17px text, no card, quiet
  fallback link). The six Supabase templates were pasted a third time and read
  back against the files. No open PRs.
- She asked for a tie-only emoji in the sender name; none exists (👔 is the
  only necktie emoji and most platforms draw it with a shirt). She was offered
  👔, 🌳 or no emoji and has not chosen; it is 👔 now.
- **She wants the logo as the sender's round picture in Gmail.** Asked three
  times. Plan (free, Gmail only, usually but not always honoured): in
  Cloudflare, enable Email Routing for the subdomain `mail.jobamooz.com` and
  forward `noreply@mail.jobamooz.com` to her inbox; she then creates a Google
  account on that address ("use my current email address") and sets the logo
  as its photo. Cloudflare was NOT signed in in her Chrome on 2026-10-03; the
  DNS is Reza's. Claude cannot create the Google account. The only logo file
  is 128px (`public/logo-mark.png`).
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

## After the launch: what still needs her

The site is open. These were skipped to open it, and still stand:

1. Done 2026-10-03: all six Supabase auth templates are pasted (through her
   own Chrome, after she signed in) and verified against the files. A real
   reset or signup email has not been received and looked at since; ask her
   to request a password reset and confirm it arrives in Persian and that the
   link opens the new-password page.
2. Search Console and Bing Webmaster Tools are both done (2026-10-03). Bing:
   she signed in and added the site herself; verified by the `msvalidate.01`
   tag in `app/layout.tsx` (#97, do not remove); `sitemap.xml` submitted,
   status Processing. Look at both consoles in a few days for crawl errors.
3. **A real signed-in test.** A tester registered as a seeker on 2026-10-03
   and confirmed fine; nobody has saved a specialist profile or booked a
   session since the 2026-09-29 fixes, and no signed-in page has been viewed
   at phone width.
4. CAPTCHA on signup would need a provider account and secret from her plus a
   code change; the trap field (#86) is what exists.

Told to her plainly: one approved specialist in one field, so most searches
on the site find nobody; Google takes weeks; no guarantee of AI answers.

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

- **PASTE PENDING:** #82 is merged and live, so `/auth/confirm` understands
  the new link — but the Supabase dashboard still holds the OLD template.
  Nothing changes for signups until `supabase/templates/confirm-signup.html`
  is pasted into Authentication → Emails → Confirm signup. Needs her Chrome
  (extension disconnected all day on the 29th) or her sign-in in the pane.
  Then a real test: register on one device, open the email on another.
- `keepTheForm()` on the shorter forms (booking, message, brief, review).
- Shrink photos in the browser before upload; phone photos are 4–15MB and
  the form currently refuses anything over 3MB.
- Ask the friend to try again — the site she hit is no longer the one running.

## First action for the next session

Ask whether the Persian reset-password email arrived and its link worked.
Then Google Search Console: she has the steps and is to paste the HTML-tag
line. (The logs from the 2026-09-29 stalled save have expired; the
cause is unknowable and the fixes in #81 stand.)

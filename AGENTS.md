<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 22 Darajeh — things that will bite you

**The middleware is `proxy.ts`, not `middleware.ts`.** This Next.js version
renamed it. Creating `middleware.ts` alongside it fails the build. `proxy.ts`
holds the session refresh and the `SITE_PRIVATE` gate that rewrites signed-out
visitors to `/soon`.

**Run `npm test`.** Fifteen tests in `lib/__tests__/` cover money formatting,
session timing, that every job title carries its own tool suggestions, and
which post-login redirects are allowed back out.
They run under Node's own test runner with a `@/` alias hook — no framework.

**`npm run lint` reports 3 pre-existing errors in `scripts/db.js`**
(`require()` style imports in a plain Node script). They are not yours and not
a regression. Everything else must stay clean.

**Database work goes through `scripts/db.js`** — `node scripts/db.js file.sql`
or `--query "..."`. It connects as **superuser and bypasses RLS**, so any test
of a policy must switch role inside a transaction first, or it proves nothing.

**Access rules have their own suite**: `node scripts/db.js
supabase/tests/access_rules.sql`. 74 checks that impersonate a seeker, a
specialist, an admin and a signed-out visitor against the live database, all
inside transactions that roll back. Every printed row must say `pass = true`.
It exists because two ways to make yourself an admin shipped and sat there
unnoticed: reading the policies was not enough, running them was.

**`SECURITY DEFINER` does not change `auth.uid()`.** It changes which role
executes, so a definer function is still subject to triggers that check who
the caller is. Assuming otherwise is what broke the resubmit path in 0022.
**There is no service-role key, deliberately.** Anything needing to read across
users goes through a `SECURITY DEFINER` function, as `booking_parties()` and
`held_session_count()` do.

**Money lives in one place**: `lib/rates.ts`. The USD rate comes from tgju.org
and is shown to admins only.

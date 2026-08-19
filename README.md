# ۲۲ درجه (22 Darajeh)

Ask a career question of someone already doing the job. Specialists offer free
22-minute calls; people browse them, pick an open slot, and write a short note
saying what they want to talk about. The specialist accepts or declines.

The interface is Persian and right-to-left throughout.

## Stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- [Supabase](https://supabase.com) for auth, database, and avatar storage
- [Tailwind CSS](https://tailwindcss.com) v4 (CSS-based config, no `tailwind.config.js`)
- [jalaali-js](https://github.com/jalaali/jalaali-js) for the Persian calendar
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
npm install
npm run dev
```

Create `.env.local` (gitignored — never commit it):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Both come from the Supabase project's API settings.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Roles

- **متقاضی (seeker)** — browses specialists and requests a call.
- **متخصص (specialist)** — fills in a profile, publishes available slots, and
  answers requests. New specialists are `pending` until an admin approves them;
  only approved ones appear publicly.
- **ادمین (admin)** — approves specialists and can see the member list.

Anyone signed in can request a call, whatever their role.

## How a booking works

1. Someone picks an open slot and writes a note. The booking is created as
   **`pending`** and the slot is held so nobody else can take it.
2. The specialist opens their dashboard, which marks the request **seen**.
3. They accept or decline. Declining releases the slot back to the pool.
4. Once accepted, the seeker sees the meeting link.

The sender can reword their note while the request is still `pending`; edits
set `edited_at` (shown to both sides) and clear `seen_at`, because the
specialist has not read the new wording.

## Security model

Access rules live in the database as RLS policies, not in page code — a page
that forgets a check cannot leak anything.

- **`profiles`** — readable only if it is your own, you are an admin, you are a
  specialist that person booked, or it belongs to an approved specialist.
- **`mentor_contacts`** (phone) — the specialist and admins only. Never shown
  to seekers.
- **`mentor_meeting_links`** — additionally readable by a seeker with a
  confirmed booking, because they need to join.
- **`bookings`** — the two people involved.

Actions that need to bypass RLS use `security definer` functions with the check
inside them (`respond_to_booking`, `edit_booking_message`, `admin_list_members`,
`delete_own_account`, `is_admin`). The project deliberately uses **no
service-role key**.

`is_admin()` exists because a policy on `profiles` that reads `profiles` to
check for an admin causes infinite recursion. Anything asking "is the caller an
admin" from inside a policy should call it.

## Database

Schema lives in [`supabase/migrations`](supabase/migrations) as ordered SQL
files. **Add a new numbered file** rather than editing an applied one — the
migrations are the record of how production got to its current shape.

## Layout

- `app/` — routes. Landing page, auth (`login`, `signup`), the public directory
  and booking flow (`specialists`), the signed-in area (`dashboard`), `admin`,
  and the static pages (`faq`, `privacy`, `terms`, `contact`).
- `components/` — shared UI. Notably `MonthCalendar` (the Jalali/Gregorian month
  grid used by both the availability and booking flows) and `SubmitButton`
  (reads the surrounding form's pending state, so server-component forms get a
  spinner for free).
- `lib/persian.ts` — Persian digits, date formatters, and time helpers. Put
  shared formatting here rather than inline, so screens stay consistent.
- `lib/actions/` — server actions.
- `lib/supabase/` — clients for browser and server contexts.
- `supabase/migrations/` — database schema.

## Conventions

- Form fields that matter are **controlled**. React clears uncontrolled fields
  after a form action, which silently destroys what someone typed when a
  submission is rejected.
- Comments explain **why**, not what. If a line looks odd, it usually is —
  the comment says which bug it prevents.
- Times are currently stored in the server's timezone (UTC on Vercel) rather
  than the user's. This works while everyone is in Iran but is **wrong** and
  must be fixed before any reminder emails are sent.

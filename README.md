# ۲۲ درجه (22 Darajeh)

Book a free 22-minute video call with a specialist who has already walked the
path you're on. Seekers browse approved specialists, pick one of their open
slots, and say what they want to talk about. No cost, no commitment.

The interface is Persian and right-to-left throughout.

## Stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- [Supabase](https://supabase.com) for auth, database, and avatar storage
- [Tailwind CSS](https://tailwindcss.com) for styling
- Deployed on [Vercel](https://vercel.com)

## Getting started

Install dependencies and create `.env.local` with your Supabase project's
credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Both values come from your Supabase project's API settings. Env files are
gitignored — never commit them.

Then run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Database

Schema lives in [`supabase/migrations`](supabase/migrations) as ordered SQL
files, applied with the Supabase CLI. Add a new numbered file rather than
editing one that has already been applied.

## Roles

- **Seeker (منتی)** — browses specialists and books a call.
- **Specialist (متخصص)** — fills in a profile, publishes available slots, and
  receives bookings. New specialists start as pending and need admin approval
  before they appear in the directory.
- **Admin (ادمین)** — reviews and approves or rejects specialist applications.

## Layout

- `app/` — routes: the landing page, auth (`login`, `signup`), the specialist
  directory and booking flow (`specialists`), the signed-in area (`dashboard`),
  and `admin`.
- `components/` — shared UI.
- `lib/actions/` — server actions for auth, bookings, availability, profiles,
  and admin review.
- `lib/supabase/` — Supabase clients for browser and server contexts.
- `supabase/migrations/` — database schema.

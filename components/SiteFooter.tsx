import Link from "next/link";
import { cookies } from "next/headers";

/**
 * Whether anyone is signed in, from the cookie rather than a round trip.
 *
 * This only decides which links to show, so a wrong answer costs a stray link
 * and nothing else — not worth a second call to Supabase on every page when
 * the navbar is already making one.
 */
async function hasSession(): Promise<boolean> {
  const jar = await cookies();
  return jar
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

const GROUPS = (signedIn: boolean) => [
  {
    title: "جاب‌آموز",
    // The licence badges will sit under this column, so the room is kept here
    // rather than found later.
    reservesBadges: true,
    links: [
      { href: "/specialists", label: "پیدا کردن کارشناس" },
      // Inviting someone who is already a member to sign up, and someone
      // already signed in to sign in, is the sort of thing people notice.
      ...(signedIn
        ? [{ href: "/dashboard", label: "حساب من" }]
        : [
            { href: "/signup/mentor", label: "به کارشناس‌ها بپیوند" },
            { href: "/login", label: "ورود" },
          ]),
    ],
  },
  {
    title: "راهنما",
    links: [
      { href: "/faq", label: "سؤال‌های پرتکرار" },
      { href: "/contact", label: "تماس با ما" },
    ],
  },
  {
    title: "قوانین",
    links: [
      { href: "/privacy", label: "حریم خصوصی" },
      { href: "/terms", label: "قوانین استفاده" },
    ],
  },
];

/**
 * Two figures held above a pair of cupped hands, drawn rather than fetched so
 * it costs nothing and takes the colour of the text around it.
 *
 * Deliberately simplified: at 44px the arms, fingers and feet of the original
 * turn to mud, so what is left is the part that still reads — two people, and
 * hands underneath them.
 */
function ElderlyMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 74 74"
      className="h-11 w-11 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="29" cy="13.5" r="4.3" />
      <path d="M25.2 21.8c-1.8 1.3-2.8 3.2-2.8 5.5V38" />
      <path d="M32.8 21.8c1.8 1.3 2.8 3.2 2.8 5.5V38" />
      <path d="M37.2 26.5V38" />

      <circle cx="46.5" cy="14.5" r="4.3" />
      <path d="M44.5 9.3a2.5 2.5 0 1 1 3.6 0" />
      <path d="M43 22.8c-1.8 1.4-2.8 3.4-2.8 5.6V32h12.6v-3.6c0-2.2-1-4.2-2.8-5.6" />

      <path d="M33 67c-2.6-3.7-6-7-9.9-9.5-2.2-1.5-3.4-3.9-3.4-6.5V32.5c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1v11" />
      <path d="M19.7 47.5c-1.5-3.3-3.3-6-5.5-8.2-1.3-1.3-3.3-1.3-4.6 0-1.3 1.3-1.3 3.3 0 4.6l8.4 8.8" />
      <path d="M41 67c2.6-3.7 6-7 9.9-9.5 2.2-1.5 3.4-3.9 3.4-6.5V32.5c0-1.7-1.4-3.1-3.1-3.1s-3.1 1.4-3.1 3.1v11" />
      <path d="M54.3 47.5c1.5-3.3 3.3-6 5.5-8.2 1.3-1.3 3.3-1.3 4.6 0 1.3 1.3 1.3 3.3 0 4.6l-8.4 8.8" />
    </svg>
  );
}

export default async function SiteFooter() {
  const signedIn = await hasSession();

  return (
    <footer className="mt-auto bg-header px-6 py-6 text-header-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 text-right sm:grid-cols-4">
          {GROUPS(signedIn).map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold">{group.title}</h3>
              <ul className="mt-2.5 flex flex-col gap-1.5 text-sm text-header-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-0.5 hover:text-header-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {group.reservesBadges && (
                /* Enamad and whatever else is granted go here. Empty on
                   purpose: an outlined box saying "logo goes here" is worse
                   than a gap nobody notices, and this way the column does not
                   jump when the real badge arrives. */
                <div aria-hidden className="mt-3 h-6" />
              )}
            </div>
          ))}

          {/* Quiet on purpose. It is a thing the site does, not a thing the
              site sells, so it gets a mark and one small sentence rather than
              a heading of its own. */}
          <div>
            <ElderlyMark />
            <p className="mt-2 max-w-[16rem] text-[11px] leading-5 text-header-muted opacity-70">
              بخشی از درآمد جاب‌آموز صرف حمایت از سالمندان می‌شود. گزارش
              حمایت‌ها سالانه منتشر می‌شود.
            </p>
          </div>
        </div>

        {/* The name and its tagline. The old mark spelled the old brand, so
            it is gone until there is a new one. */}
        <div className="mt-6 flex flex-col gap-2 border-t border-header-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold">جاب‌آموز</span>
            <span className="text-sm font-semibold text-header-muted">
              فرصت‌ها از زاویه‌ای تازه
            </span>
          </div>
          <p className="text-xs text-header-muted">
            جاب‌آموز — با کسی حرف بزن که همان کار را می‌کند.
          </p>
        </div>
      </div>
    </footer>
  );
}

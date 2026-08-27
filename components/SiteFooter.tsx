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

export default async function SiteFooter() {
  const signedIn = await hasSession();

  return (
    <footer className="mt-auto bg-header px-6 py-10 text-header-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-2 gap-8 text-right sm:grid-cols-3">
          {GROUPS(signedIn).map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold">{group.title}</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-header-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1 hover:text-header-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The name and its tagline. The old mark spelled the old brand, so
            it is gone until there is a new one. */}
        <div className="mt-10 flex flex-col gap-3 border-t border-header-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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

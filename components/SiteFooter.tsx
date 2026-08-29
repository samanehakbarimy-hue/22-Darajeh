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
 * The elderly mark, from `elder icon.jpg` in the repository root.
 *
 * It arrives as grey lines on white paper, which is no use on a dark footer,
 * so what ships is the alpha channel of it: the paper thrown away, the ink
 * kept, painted with `currentColor`. That is why it is a mask and not an
 * `<img>` — it takes the footer's cream from the text around it and follows
 * the palette if that ever changes, instead of carrying a colour of its own.
 *
 * The lines are hairlines. Scaled straight down to 44px they thinned out to
 * almost nothing against the green, so partial coverage is lifted on the way
 * down: a stroke landing on 30% of a pixel comes back at about 55%. Checked
 * at actual size, not guessed.
 */
function ElderlyMark() {
  return (
    <span
      aria-hidden
      className="block h-11 w-11 bg-current"
      style={{
        maskImage: "url(/elder-icon.png)",
        WebkitMaskImage: "url(/elder-icon.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
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

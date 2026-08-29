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

/**
 * The elderly mark, from `elder icon.jpg` in the repository root.
 *
 * It arrives as grey lines on white paper, which is no use on a dark footer,
 * so what ships is the alpha channel of it: the paper thrown away, the ink
 * kept, painted with `currentColor`. That is why it is a mask and not an
 * `<img>` — it takes the footer's cream from the text around it and follows
 * the palette if that ever changes, instead of carrying a colour of its own.
 *
 * The lines are hairlines. Scaled straight down they thinned out to
 * almost nothing against the green, so partial coverage is lifted on the way
 * down: a stroke landing on 30% of a pixel comes back at about 55%. Checked
 * at actual size, not guessed.
 */
function ElderlyMark() {
  return (
    <span
      aria-hidden
      className="block h-[68px] w-[68px] shrink-0 bg-current"
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
        {/* Five units, not four: the three link columns take one each and the
            elderly note takes two. It needs the width to say what it says in
            two lines instead of four, and a column of its own width left it
            looking like an afterthought wedged in at the end. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-right sm:grid-cols-5">
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

              {/* Enamad and whatever else is granted belong under this
                  column. Kept as a place in the markup and nothing more —
                  reserving height for a badge that does not exist yet just
                  makes the footer taller for no one. Put the badge here and
                  give it its own margin when there is one. */}
            </div>
          ))}

          {/* Quiet on purpose. It is a thing the site does, not a thing the
              site sells, so it gets a mark and one sentence rather than a
              heading of its own — but quiet is not the same as illegible, so
              the text keeps the muted colour at full strength rather than
              being dimmed on top of it. */}
          <div className="col-span-2 flex items-start gap-3">
            <ElderlyMark />
            {/* The three lines are broken by hand rather than left to wrap:
                each one is a whole clause, and where the wrap falls decides
                whether it reads as a sentence or as text that ran out of
                room. 13px against the links' 14 — smaller, but not the
                whisper it was at 11. */}
            <p className="text-[13px] leading-6 text-header-muted">
              بخشی از درآمد جاب‌آموز
              <br />
              صرف حمایت از سالمندان می‌شود.
              <br />
              گزارش حمایت‌ها سالانه منتشر می‌شود.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

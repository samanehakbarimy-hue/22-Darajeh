import Link from "next/link";

const GROUPS = [
  {
    title: "۲۲ درجه",
    links: [
      { href: "/specialists", label: "پیدا کردن متخصص" },
      { href: "/signup/mentor", label: "متخصص شدن" },
      { href: "/login", label: "ورود" },
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

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-card-border px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-2 gap-8 text-right sm:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold">{group.title}</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-card-border pt-6 text-xs text-muted">
          ۲۲ درجه — یک تماس ۲۲ دقیقه‌ای با کسی که همان کار را می‌کند.
        </p>
      </div>
    </footer>
  );
}

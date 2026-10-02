import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import { getCurrentUser } from "@/lib/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  let fullName: string | null = null;
  let photoUrl: string | null = null;
  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, photo_url, role")
      .eq("id", user.id)
      .maybeSingle();
    fullName = profile?.full_name ?? null;
    photoUrl = profile?.photo_url ?? null;
    role = profile?.role ?? null;
  }

  // A specialist has no use for "find a specialist" — they are the specialist.
  // Point each role at the thing they actually came to do.
  // A specialist receives requests; a seeker sends them. Calling both
  // "درخواست‌های من" made the specialist look like someone shopping for help.
  const links =
    role === "mentor"
      ? [
          { href: "/dashboard/sessions", label: "جلسات من" },
          { href: "/dashboard/inbox", label: "صندوق پیام" },
          { href: "/dashboard/mentor/availability", label: "زمان‌های آزاد" },
          { href: "/dashboard/mentor/services", label: "خدمات و قیمت‌ها" },
          { href: "/dashboard/mentor/profile", label: "پروفایل من" },
        ]
      : role === "admin"
        ? [
            { href: "/admin", label: "مدیریت" },
            { href: "/specialists", label: "کارشناس‌ها" },
            { href: "/dashboard/requests", label: "درخواست‌های من" },
            { href: "/dashboard/inbox", label: "صندوق پیام" },
          ]
        : user
          ? [
              { href: "/specialists", label: "پیدا کردن کارشناس" },
              { href: "/dashboard/requests", label: "درخواست‌های من" },
              { href: "/dashboard/inbox", label: "صندوق پیام" },
            ]
          : [{ href: "/specialists", label: "پیدا کردن کارشناس" }];

  return (
    <header className="relative flex items-center justify-between border-b border-header-border bg-header px-6 py-4 text-header-foreground sm:px-12">
      <Logo />

      {/* The row, from a laptop up. Below that the same links live in the
          menu further down: a specialist's seven items need about 850px, so
          the switch is at lg rather than md, where they would still collide. */}
      <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="py-1 text-header-muted hover:text-header-foreground"
          >
            {link.label}
          </Link>
        ))}

        {user ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-header-muted hover:text-header-foreground"
            >
              <Avatar photoUrl={photoUrl} name={fullName ?? "?"} size={28} />
              {fullName ?? "پروفایل من"}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="py-1 text-header-muted hover:text-header-foreground"
              >
                خروج
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-header-muted hover:text-header-foreground">
              ورود
            </Link>
            <Link
              href="/signup/mentor"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              به کارشناس‌ها بپیوند
            </Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-1 lg:hidden">
        {/* Signing in is the one thing a signed-out visitor on a phone is
            most likely looking for, so it stays out of the menu. */}
        {!user && (
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-header-muted hover:text-header-foreground"
          >
            ورود
          </Link>
        )}
        <MobileMenu>
          <nav className="flex flex-col text-base font-medium">
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 border-b border-header-border py-4 text-header-foreground"
              >
                <Avatar photoUrl={photoUrl} name={fullName ?? "?"} size={36} />
                {fullName ?? "پروفایل من"}
              </Link>
            )}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-header-muted hover:text-header-foreground"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <form action={logout} className="mt-1 border-t border-header-border pt-1">
                <button
                  type="submit"
                  className="w-full py-3 text-start text-header-muted hover:text-header-foreground"
                >
                  خروج
                </button>
              </form>
            ) : (
              <Link
                href="/signup/mentor"
                className="mt-3 rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                به کارشناس‌ها بپیوند
              </Link>
            )}
          </nav>
        </MobileMenu>
      </div>
    </header>
  );
}

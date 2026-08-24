import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          { href: "/dashboard/mentor/availability", label: "زمان‌های آزاد" },
          { href: "/dashboard/mentor/services", label: "خدمات و قیمت‌ها" },
          { href: "/dashboard/mentor/profile", label: "پروفایل من" },
        ]
      : role === "admin"
        ? [
            { href: "/admin", label: "مدیریت" },
            { href: "/specialists", label: "متخصص‌ها" },
            { href: "/dashboard/requests", label: "درخواست‌های من" },
          ]
        : user
          ? [
              { href: "/specialists", label: "پیدا کردن متخصص" },
              { href: "/dashboard/requests", label: "درخواست‌های من" },
            ]
          : [{ href: "/specialists", label: "پیدا کردن متخصص" }];

  return (
    <header className="flex items-center justify-between border-b border-card-border px-6 py-4 sm:px-12">
      <Logo />
      <nav className="flex items-center gap-4 text-sm font-medium">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="py-1 text-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}

        {user ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted hover:text-foreground"
            >
              <Avatar photoUrl={photoUrl} name={fullName ?? "?"} size={28} />
              {fullName ?? "پروفایل من"}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="py-1 text-muted hover:text-foreground"
              >
                خروج
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-muted hover:text-foreground">
              ورود
            </Link>
            <Link
              href="/signup/mentor"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-hover"
            >
              به متخصص‌ها بپیوند
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

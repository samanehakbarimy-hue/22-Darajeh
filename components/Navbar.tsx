import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import Avatar from "@/components/Avatar";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let photoUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, photo_url")
      .eq("id", user.id)
      .maybeSingle();
    fullName = profile?.full_name ?? null;
    photoUrl = profile?.photo_url ?? null;
  }

  return (
    <header className="flex items-center justify-between border-b border-card-border px-6 py-4 sm:px-12">
      <Link href="/" className="text-xl font-bold text-brand">
        ۲۲ درجه
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link href="/specialists" className="text-muted hover:text-foreground">
          پیدا کردن متخصص
        </Link>

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
              <button type="submit" className="text-muted hover:text-foreground">
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
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-dark"
            >
              متخصص شوید
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

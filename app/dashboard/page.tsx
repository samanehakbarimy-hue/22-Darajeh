import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const roleLabel =
    profile?.role === "mentor"
      ? "مربی"
      : profile?.role === "admin"
        ? "ادمین"
        : "جویا";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">
        خوش اومدی{profile?.full_name ? `، ${profile.full_name}` : ""}!
      </h1>
      <p className="mt-2 text-foreground/70">
        حساب تو به‌عنوان «{roleLabel}» ثبت شده.
      </p>
      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-foreground/20 px-6 py-3 font-medium hover:bg-foreground/5"
        >
          خروج از حساب
        </button>
      </form>
    </div>
  );
}

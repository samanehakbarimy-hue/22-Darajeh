import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { linkLinkedIn } from "@/lib/actions/auth";
import AccountForm from "./account-form";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url")
    .eq("id", user.id)
    .single();

  const linkedinConnected = user.identities?.some(
    (identity) => identity.provider === "linkedin_oidc",
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">تنظیمات حساب</h1>
      <p className="mt-2 text-sm text-muted">
        اطلاعات پایه حساب خودت رو اینجا مدیریت کن.
      </p>

      {error === "delete_failed" && (
        <p className="mt-4 text-sm text-red-400">
          حذف حساب با خطا مواجه شد. دوباره امتحان کن یا با پشتیبانی تماس بگیر.
        </p>
      )}
      {error === "link_failed" && (
        <p className="mt-4 text-sm text-red-400">
          اتصال به لینکدین با خطا مواجه شد. دوباره امتحان کن.
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-card-border bg-card p-5">
        {linkedinConnected ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="text-brand">✅</span>
            حساب لینکدینت وصل شده.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              با وصل کردن لینکدین، عکس و اسمت خودکار از اونجا میاد — لازم
              نیست دستی پر کنی.
            </p>
            <form action={linkLinkedIn} className="mt-3">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-full border border-card-border px-6 py-3 font-medium hover:bg-background"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 text-[#0A66C2]"
                >
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
                وصل کردن لینکدین
              </button>
            </form>
          </>
        )}
      </div>

      <AccountForm
        email={user.email ?? ""}
        initialFullName={profile?.full_name ?? ""}
        initialPhotoUrl={profile?.photo_url ?? ""}
      />
    </div>
  );
}

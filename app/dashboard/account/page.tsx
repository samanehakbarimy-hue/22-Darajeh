import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./account-form";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url")
    .eq("id", user.id)
    .single();

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

      <AccountForm
        email={user.email ?? ""}
        initialFullName={profile?.full_name ?? ""}
        initialPhotoUrl={profile?.photo_url ?? ""}
      />
    </div>
  );
}

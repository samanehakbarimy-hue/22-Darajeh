import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveMentor, rejectMentor } from "@/lib/actions/admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: pendingMentors } = await supabase
    .from("mentor_profiles")
    .select("id, bio, expertise_tags, linkedin_url, profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">تأیید متخصص‌ها</h1>
      <p className="mt-2 text-muted">متخصص‌های در انتظار تأیید:</p>

      {(!pendingMentors || pendingMentors.length === 0) && (
        <p className="mt-8 text-muted">فعلاً متخصصی در انتظار تأیید نیست.</p>
      )}

      <ul className="mt-8 flex flex-col gap-6">
        {pendingMentors?.map((mentor) => (
          <li key={mentor.id} className="rounded-xl border border-card-border bg-card p-6">
            <h2 className="font-bold">
              {(mentor.profiles as unknown as { full_name: string } | null)?.full_name}
            </h2>
            <p className="mt-2 text-sm text-muted">{mentor.bio}</p>
            <p className="mt-2 text-sm text-muted">
              حوزه‌ها: {(mentor.expertise_tags ?? []).join("، ")}
            </p>
            {mentor.linkedin_url && (
              <a
                href={mentor.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-brand"
              >
                لینکدین
              </a>
            )}
            <div className="mt-4 flex gap-3">
              <form action={approveMentor}>
                <input type="hidden" name="mentor_id" value={mentor.id} />
                <button
                  type="submit"
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-dark"
                >
                  تأیید
                </button>
              </form>
              <form action={rejectMentor}>
                <input type="hidden" name="mentor_id" value={mentor.id} />
                <button
                  type="submit"
                  className="rounded-full border border-card-border px-4 py-2 text-sm font-medium hover:bg-background"
                >
                  رد کردن
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

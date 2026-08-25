import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  approveMentor,
  reopenMentorReview,
  rejectMentor,
  requestMentorChanges,
 } from "@/lib/actions/admin";
import { seniorityBadge } from "@/lib/seniority";
import Avatar from "@/components/Avatar";
import { dateFormats } from "@/lib/persian";
import SendBackForReview from "@/components/SendBackForReview";
import { getCurrentUser } from "@/lib/auth";
import { getUsdToToman } from "@/lib/exchange-rate";

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: "mentor" | "seeker" | "admin";
  photo_url: string | null;
  status: "pending" | "approved" | "rejected" | "changes_requested" | null;
  created_at: string;
};

const ROLE_LABEL: Record<Member["role"], string> = {
  mentor: "متخصص",
  seeker: "متقاضی",
  admin: "ادمین",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تأیید",
  approved: "تأیید‌شده",
  rejected: "رد‌شده",
  changes_requested: "نیاز به اصلاح",
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-card-border bg-card px-4 py-3">
      <div className="text-2xl font-bold">{value.toLocaleString("fa-IR")}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const usdRate = await getUsdToToman();

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

  const { data: membersData, error: membersError } =
    await supabase.rpc("admin_list_members");
  const members = (membersData ?? []) as Member[];

  const { data: pendingMentors } = await supabase
    .from("mentor_profiles")
    .select(
      "id, bio, expertise_tags, linkedin_url, headline, seniority, profiles(full_name), mentor_meeting_links(meeting_link)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true });

  const mentors = members.filter((m) => m.role === "mentor");
  const dateFormatter = dateFormats.fullDate;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">مدیریت</h1>
      <p className="mt-2 text-muted">
        همه کسانی که در ۲۲ درجه ثبت‌نام کرده‌اند.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="کل اعضا" value={members.length} />
        <Stat
          label="متخصص تأیید‌شده"
          value={mentors.filter((m) => m.status === "approved").length}
        />
        <Stat label="در انتظار تأیید" value={pendingMentors?.length ?? 0} />
        <Stat label="رزروها" value={bookingCount ?? 0} />
      </div>

      {/* The rate every suggested price is built from. Nobody else needs to see
          it, but somebody should be able to check it — a feed that started
          returning nonsense would move every suggested price on the site with
          nothing to notice it by. */}
      <p className="mt-6 rounded-xl border border-card-border bg-card px-4 py-3 text-xs leading-6 text-muted">
        {usdRate === null ? (
          <>
            نرخ دلار در دسترس نیست، پس پیشنهادهای قیمت فعلاً مبلغ دلاری ندارند.
          </>
        ) : (
          <>
            نرخ دلار برای پیشنهادهای قیمت:{" "}
            <span className="font-medium text-foreground">
              {usdRate.toLocaleString("fa-IR")} تومان
            </span>{" "}
            — از بازار آزاد (tgju.org).
          </>
        )}
      </p>

      {/* Pending approvals first — this is the only part that needs action. */}
      {pendingMentors && pendingMentors.length > 0 && (
        <section className="mt-12">

      <h2 className="text-lg font-bold">در انتظار تأیید</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pendingMentors.map((mentor) => (
              <li
                key={mentor.id}
                className="rounded-xl border border-card-border bg-card p-6"
              >
                <h3 className="font-bold">
                  {
                    (mentor.profiles as unknown as { full_name: string } | null)
                      ?.full_name
                  }
                </h3>
                {mentor.headline && (
                  <p className="mt-1 text-sm text-muted">{mentor.headline}</p>
                )}
                {/* The claim being checked: does the headline and bio
                    support this much experience? */}
                {!(
                  mentor.mentor_meeting_links as unknown as {
                    meeting_link: string | null;
                  } | null
                )?.meeting_link && (
                  <p className="mt-2 rounded-xl border border-brand/40 bg-brand-light px-3 py-2 text-xs leading-6 text-brand-deep">
                    لینک جلسه ندارد. تأیید کردن، پروفایلی را منتشر می‌کند که
                    می‌شود رزروش کرد ولی نمی‌شود دیدش — دکمه تأیید به‌جایش
                    درخواست اصلاح می‌فرستد.
                  </p>
                )}

                {seniorityBadge(mentor.seniority) && (
                  <p className="mt-2 inline-block rounded-full border border-brand/40 bg-brand-light px-3 py-1 text-xs text-brand-deep">
                    ادعای تجربه: {seniorityBadge(mentor.seniority)}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted">{mentor.bio}</p>
                <p className="mt-2 text-sm text-muted">
                  حوزه‌ها: {(mentor.expertise_tags ?? []).join("، ")}
                </p>
                {mentor.linkedin_url && (
                  <a
                    href={mentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-sm text-brand-deep"
                  >
                    لینکدین
                  </a>
                )}
                <div className="mt-4 flex gap-3">
                  <form action={approveMentor}>
                    <input type="hidden" name="mentor_id" value={mentor.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
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

                {/* Between yes and no: hand it back with a reason. */}
                <form
                  action={requestMentorChanges}
                  className="mt-4 border-t border-card-border pt-4"
                >
                  <input type="hidden" name="mentor_id" value={mentor.id} />
                  <label
                    htmlFor={`note-${mentor.id}`}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    درخواست اصلاح
                  </label>
                  <textarea
                    id={`note-${mentor.id}`}
                    name="review_note"
                    rows={2}
                    required
                    maxLength={500}
                    placeholder="چه چیزی باید اصلاح شود؟ همین متن را خودش می‌بیند."
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="submit"
                    className="mt-3 rounded-full border border-card-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand-deep"
                  >
                    فرستادن برای اصلاح
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-bold">اعضا</h2>

        {membersError && (
          <p className="mt-4 text-sm text-danger">
            خطا در خواندن فهرست اعضا: {membersError.message}
          </p>
        )}

        {!membersError && members.length === 0 && (
          <p className="mt-4 text-muted">هنوز کسی ثبت‌نام نکرده.</p>
        )}

        {members.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-right text-sm">
              <thead className="bg-card text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">نام</th>
                  <th className="px-4 py-3 font-medium">ایمیل</th>
                  <th className="px-4 py-3 font-medium">نقش</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 font-medium">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t border-card-border align-middle"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          photoUrl={member.photo_url}
                          name={member.full_name}
                          size={28}
                        />
                        {member.role === "mentor" &&
                        member.status === "approved" ? (
                          <Link
                            href={`/specialists/${member.id}`}
                            className="inline-block py-1 hover:text-brand-deep"
                          >
                            {member.full_name}
                          </Link>
                        ) : (
                          <span>{member.full_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted" dir="ltr">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {ROLE_LABEL[member.role]}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {member.status
                        ? (STATUS_LABEL[member.status] ?? member.status)
                        : "—"}
                      {/* A rejection has to be undoable: it is one click
                          away from approval and asks nothing first. */}
                      {member.role === "mentor" &&
                        member.status === "approved" && (
                          <SendBackForReview
                            mentorId={member.id}
                            name={member.full_name}
                          />
                        )}
                      {(member.status === "rejected" ||
                        member.status === "changes_requested") && (
                        <form action={reopenMentorReview} className="mt-1">
                          <input
                            type="hidden"
                            name="mentor_id"
                            value={member.id}
                          />
                          <button
                            type="submit"
                            className="text-xs text-brand-deep hover:underline"
                          >
                            بازگرداندن به بررسی
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {dateFormatter.format(new Date(member.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

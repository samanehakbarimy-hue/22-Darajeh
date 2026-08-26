import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  approveMentor,
  reopenMentorReview,
  rejectMentor,
  requestMentorChanges,
  saveAdminSummary,
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
  phone: string | null;
  has_google: boolean;
  created_at: string;
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

/**
 * One kind of member, listed on its own.
 *
 * A specialist has a profile to approve and a status to act on; a seeker has
 * neither and never will. They were sharing a table with a "role" column,
 * which was readable with two rows and would not be with two hundred.
 */
function MemberGroup({
  title,
  empty,
  members,
}: {
  title: string;
  empty: string;
  members: Member[];
}) {
  const dateFormatter = dateFormats.fullDate;

  return (
    <div className="mt-8">
      <h3 className="font-bold">
        {title}{" "}
        <span className="text-sm font-normal text-muted">
          ({members.length.toLocaleString("fa-IR")})
        </span>
      </h3>

      {members.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-card-border">
          <table className="w-full text-right text-sm">
            <thead className="bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">نام</th>
                <th className="px-4 py-3 font-medium">ایمیل</th>
                <th className="px-4 py-3 font-medium">موبایل</th>
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
                      <span>{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted" dir="ltr">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 text-muted" dir="ltr">
                    {member.phone ?? "—"}
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
    </div>
  );
}

type MentorDetail = {
  id: string;
  headline: string | null;
  company: string | null;
  bio: string | null;
  expertise_tags: string[] | null;
  skills: string[] | null;
  linkedin_url: string | null;
  seniority: string | null;
  admin_summary: string | null;
  mentor_meeting_links: unknown;
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

/**
 * A specialist, with everything it takes to believe them.
 *
 * They were a row in a table: a name, an email and a status. The queue at the
 * top of this page shows the claims and the LinkedIn profile while somebody is
 * waiting, and then that view is gone for good — so a specialist approved last
 * month, or one whose profile has changed since, could not be checked again
 * without opening the database.
 */
function SpecialistList({
  members,
  detailById,
}: {
  members: Member[];
  detailById: Map<string, MentorDetail>;
}) {
  const dateFormatter = dateFormats.fullDate;

  if (members.length === 0) {
    return <p className="mt-3 text-sm text-muted">هنوز کارشناسی ثبت‌نام نکرده.</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-4">
      {members.map((member) => {
        const detail = detailById.get(member.id);
        const meetingLink = (
          detail?.mentor_meeting_links as { meeting_link: string | null } | null
        )?.meeting_link;
        const tags = detail?.expertise_tags ?? [];
        const skills = detail?.skills ?? [];

        return (
          <li
            key={member.id}
            className="rounded-xl border border-card-border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  photoUrl={member.photo_url}
                  name={member.full_name}
                  size={44}
                />
                <div>
                  <h4 className="font-bold">
                    {member.status === "approved" ? (
                      <Link
                        href={`/specialists/${member.id}`}
                        className="hover:text-brand-deep"
                      >
                        {member.full_name}
                      </Link>
                    ) : (
                      member.full_name
                    )}
                  </h4>
                  {detail?.headline && (
                    <p className="mt-0.5 text-sm text-muted">
                      {detail.headline}
                      {detail.company ? ` — ${detail.company}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left">
                <span className="text-sm">
                  {member.status
                    ? (STATUS_LABEL[member.status] ?? member.status)
                    : "—"}
                </span>
                {member.status === "approved" && (
                  <SendBackForReview
                    mentorId={member.id}
                    name={member.full_name}
                  />
                )}
                {(member.status === "rejected" ||
                  member.status === "changes_requested") && (
                  <form action={reopenMentorReview} className="mt-1">
                    <input type="hidden" name="mentor_id" value={member.id} />
                    <button
                      type="submit"
                      className="text-xs text-brand-deep hover:underline"
                    >
                      بازگرداندن به بررسی
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="ایمیل">
                <span dir="ltr" className="text-muted">
                  {member.email}
                </span>
              </Detail>
              <Detail label="موبایل">
                <span dir="ltr" className="text-muted">
                  {member.phone ?? "—"}
                </span>
              </Detail>

              {/* The one thing that can be checked against the outside world.
                  Its absence is worth seeing too: a claim of fifteen years
                  with nowhere to check it is the case to look at hardest. */}
              <Detail label="لینکدین">
                {detail?.linkedin_url ? (
                  <a
                    href={detail.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="break-all text-brand-deep hover:underline"
                  >
                    {detail.linkedin_url}
                  </a>
                ) : (
                  <span className="text-muted">
                    نگذاشته — راهی برای راستی‌آزمایی بیرون از سایت نیست.
                  </span>
                )}
              </Detail>

              <Detail label="ادعای تجربه">
                <span className="text-muted">
                  {seniorityBadge(detail?.seniority ?? null) || "—"}
                </span>
              </Detail>

              <Detail label="لینک جلسه">
                {meetingLink ? (
                  <span dir="ltr" className="break-all text-muted">
                    {meetingLink}
                  </span>
                ) : member.has_google ? (
                  <span className="text-muted">
                    برای هر جلسه از حساب گوگل ساخته می‌شود.
                  </span>
                ) : (
                  <span className="text-muted">
                    ندارد — رزروها جایی برای رفتن ندارند.
                  </span>
                )}
              </Detail>

              <Detail label="تاریخ عضویت">
                <span className="text-muted">
                  {dateFormatter.format(new Date(member.created_at))}
                </span>
              </Detail>
            </div>

            {tags.length > 0 && (
              <p className="mt-4 text-sm text-muted">
                حوزه‌ها: {tags.join("، ")}
              </p>
            )}
            {skills.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                ابزارها: {skills.join("، ")}
              </p>
            )}
            {detail?.bio && (
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                {detail.bio}
              </p>
            )}

            {/* The house view, in the site's voice rather than theirs. It sits
                on their public page above their own introduction, and is worth
                having precisely because the reader knows they did not write
                it — so a trigger stops them from being able to. */}
            <form
              action={saveAdminSummary}
              className="mt-5 border-t border-card-border pt-5"
            >
              <input type="hidden" name="mentor_id" value={member.id} />
              <label
                htmlFor={`summary-${member.id}`}
                className="mb-1.5 block text-sm font-medium"
              >
                معرفی ۲۲ درجه
                <span className="mr-1 text-xs font-normal text-muted">
                  (روی پروفایل عمومی دیده می‌شود)
                </span>
              </label>
              <textarea
                id={`summary-${member.id}`}
                name="admin_summary"
                rows={4}
                maxLength={1200}
                defaultValue={detail?.admin_summary ?? ""}
                className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                className="mt-3 rounded-full border border-card-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand-deep"
              >
                ذخیره معرفی
              </button>
            </form>
          </li>
        );
      })}
    </ul>
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
      "id, bio, expertise_tags, linkedin_url, headline, seniority, profiles!mentor_profiles_id_fkey(full_name), mentor_meeting_links(meeting_link)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Everything an admin needs in order to believe a specialist is who they
  // say they are. The pending queue above shows this for someone waiting; a
  // specialist who was approved last month left no way to check them again.
  const { data: mentorDetails } = await supabase
    .from("mentor_profiles")
    .select(
      "id, headline, company, bio, expertise_tags, skills, linkedin_url, seniority, admin_summary, mentor_meeting_links(meeting_link)",
    );

  const detailById = new Map(
    (mentorDetails ?? []).map((row) => [row.id as string, row]),
  );

  const googleConnectedIds = new Set(
    members.filter((m) => m.has_google).map((m) => m.id),
  );

  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true });

  const mentors = members.filter((m) => m.role === "mentor");
  const seekers = members.filter((m) => m.role === "seeker");
  const admins = members.filter((m) => m.role === "admin");

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold">مدیریت</h1>
      <p className="mt-2 text-muted">
        همه کسانی که در ۲۲ درجه ثبت‌نام کرده‌اند.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="کل اعضا" value={members.length} />
        <Stat
          label="کارشناس تأیید‌شده"
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
                )?.meeting_link &&
                  !googleConnectedIds.has(mentor.id) && (
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
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20"
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

        <div className="mt-8">
          <h3 className="font-bold">
            کارشناس‌ها{" "}
            <span className="text-sm font-normal text-muted">
              ({mentors.length.toLocaleString("fa-IR")})
            </span>
          </h3>
          <SpecialistList members={mentors} detailById={detailById} />
        </div>
        <MemberGroup
          title="متقاضی‌ها"
          empty="هنوز متقاضی‌ای ثبت‌نام نکرده."
          members={seekers}
        />
        {admins.length > 0 && (
          <MemberGroup title="ادمین‌ها" empty="" members={admins} />
        )}
      </section>
    </div>
  );
}

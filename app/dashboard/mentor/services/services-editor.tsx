"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { deleteService, saveService } from "@/lib/actions/services";
import { formatRange, suggestedRange } from "@/lib/seniority";
import {
  PROJECT_TEMPLATES,
  SESSION_TYPES,
  formatDuration,
  formatServicePrice,
  serviceTitle,
  type MentorService,
} from "@/lib/services";
import PriceInput, { onlyDigits, present } from "@/components/PriceInput";

type ProjectDraft = {
  id?: string;
  title: string;
  description: string;
  minHours: string;
  price: string;
  isActive: boolean;
};

const BLANK_PROJECT: ProjectDraft = {
  title: "",
  description: "",
  minHours: "2",
  price: "",
  isActive: true,
};

const FIELD =
  "rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

/**
 * Two halves, because the two kinds of offer are shaped differently.
 *
 * Sessions are a fixed list: the specialist sets a price and nothing else, so
 * each one is a small form of its own rather than a modal. Project work is
 * theirs to describe, so it keeps a full editor.
 */
export default function ServicesEditor({
  services,
  tableMissing,
  seniority,
  usdRate,
}: {
  services: MentorService[];
  tableMissing: boolean;
  seniority: string | null;
  /** Toman per dollar, or null when the live rate was unavailable. */
  usdRate: number | null;
}) {
  const [saveState, saveAction] = useActionState(saveService, undefined);
  const [deleteState, deleteAction] = useActionState(deleteService, undefined);
  const [project, setProject] = useState<ProjectDraft | null>(null);

  // React 19 resets uncontrolled fields once a form action finishes, which has
  // eaten typed text in this project before. The project form is controlled.
  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setProject((current) => (current ? { ...current, [key]: value } : current));

  if (tableMissing) {
    return (
      <div className="mt-8 rounded-2xl border border-card-border bg-card p-6">
        <p className="font-bold">جدول خدمات هنوز ساخته نشده</p>
        <p className="mt-2 text-sm leading-7 text-muted">
          مهاجرت <code className="text-foreground">0019_mentor_services</code>{" "}
          باید یک بار روی دیتابیس اجرا شود.
        </p>
      </div>
    );
  }

  const byKey = new Map(
    services
      .filter((s) => s.kind === "consultation" && s.session_key)
      .map((s) => [s.session_key as string, s]),
  );
  const projects = services.filter((s) => s.kind === "hourly_project");
  const projectSuggestion = suggestedRange(
    seniority,
    project ? Number(project.minHours) || 0 : 0,
    usdRate,
  );

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-bold">جلسات</h2>
        <p className="mt-1 text-sm leading-7 text-muted">
          مدت هر جلسه ثابت است تا قیمت‌ها بین متخصص‌ها قابل مقایسه باشد. تو فقط
          تصمیم می‌گیری کدام را ارائه بدهی و چقدر بگیری.
        </p>
        <p className="mt-2 text-sm leading-7 text-muted">
          قیمت را خالی بگذاری، روی پروفایلت «به‌زودی» می‌آید. صفر ننویس —
          رایگان فقط همان تماس ۲۲ دقیقه‌ای است. بیشتر کسانی که اینجا رزرو
          می‌کنند اول راهشان‌اند و از جیب خودشان می‌دهند، پس پایین بازه هم قیمت
          درستی است.
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {SESSION_TYPES.map((session) => {
            const existing = byKey.get(session.key);
            const suggestion = suggestedRange(
              seniority,
              session.minutes / 60,
              usdRate,
            );

            return (
              <li
                key={session.key}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <form action={saveAction} className="flex flex-col gap-3">
                  <input type="hidden" name="kind" value="consultation" />
                  <input type="hidden" name="session_key" value={session.key} />
                  {existing && (
                    <input type="hidden" name="id" value={existing.id} />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{session.title}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {session.description}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {session.minutes.toLocaleString("fa-IR")} دقیقه
                      </p>
                    </div>
                    {existing?.is_active && (
                      <span className="shrink-0 rounded-full bg-success-light px-3 py-1 text-xs text-success">
                        <span aria-hidden>✓</span> روی پروفایل
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted">قیمت (تومان)</span>
                      <PriceInput
                        name="price_toman"
                        defaultValue={
                          existing?.price_toman == null
                            ? ""
                            : String(existing.price_toman)
                        }
                        placeholder="۵۰۰,۰۰۰"
                        className={`w-48 ${FIELD}`}
                      />
                    </label>

                    <label className="flex items-center gap-2 pb-3 text-sm">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={existing ? existing.is_active : true}
                        className="accent-brand"
                      />
                      نمایش روی پروفایل
                    </label>

                    <SubmitButton
                      pendingLabel="ذخیره..."
                      className="mb-2 px-5 py-2 text-sm"
                    >
                      {existing ? "به‌روزرسانی" : "اضافه کن"}
                    </SubmitButton>

                    {existing && (
                      <button
                        type="submit"
                        formAction={deleteAction}
                        name="id"
                        value={existing.id}
                        className="mb-2 rounded-full border border-card-border px-4 py-2 text-xs text-red-400 hover:border-red-400"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  {suggestion && (
                    <p className="text-xs leading-6 text-muted">
                      پیشنهاد ۲۲ درجه برای این مدت و تجربه‌ات:{" "}
                      <span className="font-medium text-foreground">
                        {formatRange(suggestion, usdRate)}
                      </span>
                    </p>
                  )}
                </form>
              </li>
            );
          })}
        </ul>

        {saveState?.error && (
          <p className="mt-3 text-sm text-red-400">{saveState.error}</p>
        )}
        {deleteState?.error && (
          <p className="mt-3 text-sm text-red-400">{deleteState.error}</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">پروژه‌ها (نفرساعت)</h2>
        <p className="mt-1 text-sm leading-7 text-muted">
          اینجا برعکس جلسات است: عنوان، توضیح و حداقل ساعت را خودت می‌نویسی، چون
          هر پروژه شکل خودش را دارد.
        </p>

        {projects.length > 0 && (
          <ul className="mt-5 flex flex-col gap-3">
            {projects.map((service) => (
              <li
                key={service.id}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{serviceTitle(service)}</h3>
                      {!service.is_active && (
                        <span className="rounded-full border border-card-border px-2.5 py-0.5 text-xs text-muted">
                          پنهان
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="mt-1.5 text-sm leading-6 text-muted">
                        {service.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      {formatDuration(service)} —{" "}
                      <span className="font-bold text-foreground">
                        {formatServicePrice(service, usdRate)}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProject({
                          id: service.id,
                          title: service.title,
                          description: service.description,
                          minHours: String(service.min_hours ?? 2),
                          price:
                            service.price_toman == null
                              ? ""
                              : String(service.price_toman),
                          isActive: service.is_active,
                        })
                      }
                      className="rounded-full border border-card-border px-4 py-2 text-xs hover:border-brand hover:text-brand"
                    >
                      ویرایش
                    </button>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <SubmitButton
                        variant="danger"
                        pendingLabel="حذف..."
                        className="w-full px-4 py-2 text-xs"
                      >
                        حذف
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {project === null ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {PROJECT_TEMPLATES.map((template) => (
              <button
                key={template.title}
                type="button"
                onClick={() =>
                  setProject({
                    ...BLANK_PROJECT,
                    title: template.title,
                    description: template.description,
                    minHours: String(template.minHours),
                  })
                }
                className="rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {template.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setProject({ ...BLANK_PROJECT })}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-hover"
            >
              پروژه دلخواه +
            </button>
          </div>
        ) : (
          <form
            action={saveAction}
            className="mt-5 flex flex-col gap-5 rounded-2xl border border-card-border bg-card p-6"
          >
            <input type="hidden" name="kind" value="hourly_project" />
            {project.id && <input type="hidden" name="id" value={project.id} />}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">عنوان</span>
              <input
                name="title"
                value={project.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={80}
                required
                className={FIELD}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                توضیح کوتاه <span className="text-muted">(اختیاری)</span>
              </span>
              <textarea
                name="description"
                value={project.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={300}
                rows={3}
                className={`leading-7 ${FIELD}`}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">حداقل ساعت</span>
              <input
                name="min_hours"
                inputMode="numeric"
                value={project.minHours}
                onChange={(e) => set("minHours", e.target.value)}
                className={`w-40 ${FIELD}`}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">قیمت هر ساعت (تومان)</span>
              <input
                name="price_toman"
                inputMode="numeric"
                autoComplete="off"
                value={project.price}
                onChange={(e) => set("price", present(onlyDigits(e.target.value)))}
                placeholder="۹۰۰,۰۰۰"
                className={`w-full max-w-xs ${FIELD}`}
              />
              {projectSuggestion && (
                <span className="text-xs leading-6 text-muted">
                  پیشنهاد ۲۲ درجه برای این حجم کار:{" "}
                  <span className="font-medium text-foreground">
                    {formatRange(projectSuggestion, usdRate)}
                  </span>
                </span>
              )}
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={project.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="accent-brand"
              />
              روی پروفایلم نشان داده شود
            </label>

            <div className="flex items-center gap-3">
              <SubmitButton
                pendingLabel="در حال ذخیره..."
                className="px-6 py-2.5 text-sm"
              >
                ذخیره
              </SubmitButton>
              <button
                type="button"
                onClick={() => setProject(null)}
                className="rounded-full border border-card-border px-5 py-2.5 text-sm hover:bg-background"
              >
                انصراف
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

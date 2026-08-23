"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { deleteService, saveService } from "@/lib/actions/services";
import { formatRange, suggestedRange } from "@/lib/seniority";
import {
  KIND_LABEL,
  TEMPLATES,
  formatDuration,
  formatServicePrice,
  type MentorService,
  type ServiceKind,
} from "@/lib/services";

type Draft = {
  id?: string;
  kind: ServiceKind;
  title: string;
  description: string;
  minutes: string;
  minHours: string;
  price: string;
  isActive: boolean;
};

const BLANK: Draft = {
  kind: "consultation",
  title: "",
  description: "",
  minutes: "45",
  minHours: "2",
  price: "",
  isActive: true,
};

function toDraft(service: MentorService): Draft {
  return {
    id: service.id,
    kind: service.kind,
    title: service.title,
    description: service.description,
    minutes: String(service.minutes ?? 45),
    minHours: String(service.min_hours ?? 2),
    price: service.price_toman === null ? "" : String(service.price_toman),
    isActive: service.is_active,
  };
}

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
  const [draft, setDraft] = useState<Draft | null>(null);

  // React 19 resets uncontrolled fields once a form action finishes, which has
  // eaten typed text in this project before. Every field here is controlled.
  // Scaled by how long the work is, so a 45-minute session and a 3-hour
  // minimum come from the same base rate rather than two invented numbers.
  const hours =
    draft === null
      ? 0
      : draft.kind === "consultation"
        ? (Number(draft.minutes) || 0) / 60
        : Number(draft.minHours) || 0;
  const suggestion = suggestedRange(seniority, hours);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  if (tableMissing) {
    return (
      <div className="mt-8 rounded-2xl border border-card-border bg-card p-6">
        <p className="font-bold">جدول خدمات هنوز ساخته نشده</p>
        <p className="mt-2 text-sm leading-7 text-muted">
          مهاجرت <code className="text-foreground">0019_mentor_services</code>{" "}
          باید یک بار روی دیتابیس اجرا شود. تا آن موقع این صفحه کار نمی‌کند.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold">خدمت‌های تو</h2>
        {services.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            هنوز خدمتی اضافه نکرده‌ای. از نمونه‌های پایین شروع کن یا خودت یکی
            بساز.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{service.title}</h3>
                      <span className="rounded-full border border-card-border px-2.5 py-0.5 text-xs text-muted">
                        {KIND_LABEL[service.kind]}
                      </span>
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
                      onClick={() => setDraft(toDraft(service))}
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
        {deleteState?.error && (
          <p className="mt-3 text-sm text-red-400">{deleteState.error}</p>
        )}
      </section>

      {draft === null ? (
        <section>
          <h2 className="text-lg font-bold">اضافه کردن خدمت</h2>
          <p className="mt-1 text-sm text-muted">
            از یک نمونه شروع کن — بعد متن و قیمتش را خودت عوض می‌کنی.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.title}
                type="button"
                onClick={() =>
                  setDraft({
                    ...BLANK,
                    kind: template.kind,
                    title: template.title,
                    description: template.description,
                    minutes: String(template.minutes ?? 45),
                    minHours: String(template.minHours ?? 2),
                  })
                }
                className="rounded-full border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
              >
                {template.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDraft({ ...BLANK })}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-hover"
            >
              خدمت دلخواه +
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-bold">
            {draft.id ? "ویرایش خدمت" : "خدمت تازه"}
          </h2>

          <form action={saveAction} className="mt-5 flex flex-col gap-5">
            {draft.id && <input type="hidden" name="id" value={draft.id} />}
            <input type="hidden" name="kind" value={draft.kind} />

            <div>
              <span className="mb-2 block text-sm font-medium">نوع</span>
              <div className="flex gap-2">
                {(["consultation", "hourly_project"] as ServiceKind[]).map(
                  (kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => set("kind", kind)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        draft.kind === kind
                          ? "border-brand bg-brand-light text-brand"
                          : "border-card-border text-muted hover:border-brand hover:text-brand"
                      }`}
                    >
                      {KIND_LABEL[kind]}
                    </button>
                  ),
                )}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">عنوان</span>
              <input
                name="title"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={80}
                required
                className="rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                توضیح کوتاه{" "}
                <span className="text-muted">(اختیاری)</span>
              </span>
              <textarea
                name="description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={300}
                rows={3}
                className="rounded-xl border border-card-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-brand"
              />
            </label>

            {draft.kind === "consultation" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">مدت جلسه (دقیقه)</span>
                <input
                  name="minutes"
                  inputMode="numeric"
                  value={draft.minutes}
                  onChange={(e) => set("minutes", e.target.value)}
                  className="w-40 rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">حداقل ساعت</span>
                <input
                  name="min_hours"
                  inputMode="numeric"
                  value={draft.minHours}
                  onChange={(e) => set("minHours", e.target.value)}
                  className="w-40 rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                قیمت به تومان{" "}
                {draft.kind === "hourly_project" && (
                  <span className="text-muted">(برای هر ساعت)</span>
                )}
              </span>
              <input
                name="price_toman"
                inputMode="numeric"
                value={draft.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="خالی بگذار تا «به‌زودی» نمایش داده شود"
                className="w-full max-w-xs rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
              />
              {suggestion && (
                <span className="text-xs leading-6 text-brand">
                  پیشنهاد ۲۲ درجه برای این مدت و تجربه‌ات:{" "}
                  {formatRange(suggestion, usdRate)}
                </span>
              )}
              <span className="text-xs leading-6 text-muted">
                تا وقتی قیمت نگذاری، روی پروفایلت «به‌زودی» نوشته می‌شود. صفر
                ننویس — رایگان فقط همان تماس ۲۲ دقیقه‌ای است.
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={draft.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="accent-brand"
              />
              روی پروفایلم نشان داده شود
            </label>

            {saveState?.error && (
              <p className="text-sm text-red-400">{saveState.error}</p>
            )}

            <div className="flex items-center gap-3">
              <SubmitButton pendingLabel="در حال ذخیره..." className="px-6 py-2.5 text-sm">
                ذخیره
              </SubmitButton>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-full border border-card-border px-5 py-2.5 text-sm hover:bg-background"
              >
                انصراف
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

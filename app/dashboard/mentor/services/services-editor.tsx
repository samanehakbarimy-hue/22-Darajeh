"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { deleteService, saveService } from "@/lib/actions/services";
import { formatRange, suggestedRange } from "@/lib/seniority";
import {
  SESSION_TYPES,
  type MentorService,
} from "@/lib/services";
import PriceInput, { onlyDigits } from "@/components/PriceInput";


const FIELD =
  "rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-deep focus:ring-2 focus:ring-brand/20";

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
  // A price far outside the suggestion is usually a slip, occasionally a
  // considered choice, and never the admin's business. So it asks once rather
  // than refusing: nobody has to seek permission to be expensive.
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);
  const [deleteState, deleteAction] = useActionState(deleteService, undefined);


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
  // One rate per specialist now, guaranteed by a unique index.
  const projectRate = services.find((s) => s.kind === "hourly_project") ?? null;
  const projectSuggestion = suggestedRange(seniority, 1, usdRate);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-bold">جلسات</h2>
        <p className="mt-1 text-sm leading-7 text-muted">
          مدت هر جلسه ثابت است تا قیمت‌ها بین کارشناس‌ها قابل مقایسه باشد. تو فقط
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
                <form
                  action={saveAction}
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    const typed = Number(
                      onlyDigits(
                        String(
                          new FormData(event.currentTarget).get("price_toman") ??
                            "",
                        ),
                      ),
                    );
                    const wild =
                      typed > 0 &&
                      suggestion !== null &&
                      (typed > suggestion.high * 2 || typed < suggestion.low / 2);

                    if (wild && needsConfirm !== session.key) {
                      event.preventDefault();
                      setNeedsConfirm(session.key);
                    } else {
                      setNeedsConfirm(null);
                    }
                  }}
                >
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

                  <label className="flex w-fit flex-col gap-1.5">
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

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
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
                      className="px-5 py-2 text-sm"
                    >
                      {existing ? "به‌روزرسانی" : "اضافه کن"}
                    </SubmitButton>

                    {existing && (
                      <button
                        type="submit"
                        formAction={deleteAction}
                        name="id"
                        value={existing.id}
                        className="rounded-full border border-card-border px-4 py-2 text-xs text-danger hover:border-danger"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  {needsConfirm === session.key && (
                    <p className="rounded-xl border border-brand/40 bg-brand-light px-3 py-2 text-xs leading-6 text-brand-deep">
                      این قیمت خیلی از پیشنهاد فاصله دارد. اگر عمدی است، یک بار
                      دیگر بزن تا ذخیره شود.
                    </p>
                  )}

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
          <p className="mt-3 text-sm text-danger">{saveState.error}</p>
        )}
        {deleteState?.error && (
          <p className="mt-3 text-sm text-danger">{deleteState.error}</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">کار پروژه‌ای (نفرساعت)</h2>
        <p className="mt-1 text-sm leading-7 text-muted">
          اینجا فهرستی برای انتخاب نیست. تو فقط نرخ ساعتی‌ات را می‌گویی؛ خود کار
          را کسی که سفارش می‌دهد توضیح می‌دهد و تو تصمیم می‌گیری قبولش کنی یا
          نه.
        </p>

        <form
          action={saveAction}
          className="mt-5 flex flex-col gap-5 rounded-2xl border border-card-border bg-card p-6"
        >
          <input type="hidden" name="kind" value="hourly_project" />
          {projectRate && (
            <input type="hidden" name="id" value={projectRate.id} />
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">نرخ هر ساعت (تومان)</span>
            <PriceInput
              name="price_toman"
              defaultValue={
                projectRate?.price_toman == null
                  ? ""
                  : String(projectRate.price_toman)
              }
              placeholder="۹۰۰,۰۰۰"
              className={`w-full max-w-xs ${FIELD}`}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_negotiable"
              defaultChecked={projectRate?.is_negotiable ?? false}
              className="accent-brand"
            />
            نرخ ثابتی ندارم — قابل مذاکره
          </label>

          {projectSuggestion && (
            <p className="text-xs leading-6 text-muted">
              پیشنهاد ۲۲ درجه برای یک ساعت کار با تجربه‌ات:{" "}
              <span className="font-medium text-foreground">
                {formatRange(projectSuggestion, usdRate)}
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-card-border pt-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={projectRate ? projectRate.is_active : true}
                className="accent-brand"
              />
              نمایش روی پروفایل
            </label>

            <SubmitButton pendingLabel="ذخیره..." className="px-5 py-2 text-sm">
              {projectRate ? "به‌روزرسانی" : "ذخیره نرخ"}
            </SubmitButton>

            {projectRate && (
              <button
                type="submit"
                formAction={deleteAction}
                name="id"
                value={projectRate.id}
                className="rounded-full border border-card-border px-4 py-2 text-xs text-danger hover:border-danger"
              >
                حذف
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

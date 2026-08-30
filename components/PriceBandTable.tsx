"use client";

import { useActionState } from "react";
import { savePriceBand } from "@/lib/actions/pricing";
import { SENIORITY_LEVELS } from "@/lib/seniority";

export type Band = {
  session_key: string;
  seniority: string;
  min_toman: number;
  max_toman: number;
};

const SERVICES: { key: string; title: string; minutes: number }[] = [
  { key: "resume-review", title: "بررسی رزومه", minutes: 30 },
  { key: "career-path", title: "مسیر شغلی", minutes: 45 },
  { key: "interview-prep", title: "آمادگی مصاحبه", minutes: 60 },
];

function Cell({
  sessionKey,
  seniority,
  band,
}: {
  sessionKey: string;
  seniority: string;
  band: Band | undefined;
}) {
  const [state, action, pending] = useActionState(savePriceBand, undefined);

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="session_key" value={sessionKey} />
      <input type="hidden" name="seniority" value={seniority} />

      <div className="flex items-center gap-1.5">
        <input
          name="min_toman"
          inputMode="numeric"
          defaultValue={band?.min_toman ?? ""}
          aria-label="کمینه"
          className="w-24 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-deep"
        />
        <span className="text-xs text-muted">تا</span>
        <input
          name="max_toman"
          inputMode="numeric"
          defaultValue={band?.max_toman ?? ""}
          aria-label="بیشینه"
          className="w-24 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-deep"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-card-border px-3 py-1 text-xs hover:border-brand hover:text-brand-deep disabled:opacity-60"
        >
          ذخیره
        </button>
        {state?.saved && <span className="text-xs text-success">ثبت شد</span>}
        {state?.error && (
          <span className="text-xs text-danger">{state.error}</span>
        )}
      </div>
    </form>
  );
}

/**
 * The nine numbers the site will publish without being asked: three session
 * types against three experience bands, in toman.
 *
 * They were a formula in lib/seniority.ts -- a base dollar rate times a
 * seniority factor times the length of the session -- which meant that
 * deciding a resume review is worth more took a deploy. Each cell saves on its
 * own, because changing one number should not mean re-submitting eight others
 * that were already right.
 */
export default function PriceBandTable({ bands }: { bands: Band[] }) {
  const find = (k: string, s: string) =>
    bands.find((b) => b.session_key === k && b.seniority === s);

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-right text-sm">
        <thead className="bg-card text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">جلسه</th>
            {SENIORITY_LEVELS.map((level) => (
              <th key={level.value} className="px-4 py-3 font-medium">
                {level.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((service) => (
            <tr key={service.key} className="border-t border-card-border">
              <td className="px-4 py-3 align-top">
                <div className="font-medium">{service.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {service.minutes.toLocaleString("fa-IR")} دقیقه
                </div>
              </td>
              {SENIORITY_LEVELS.map((level) => (
                <td key={level.value} className="px-4 py-3 align-top">
                  <Cell
                    sessionKey={service.key}
                    seniority={level.value}
                    band={find(service.key, level.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

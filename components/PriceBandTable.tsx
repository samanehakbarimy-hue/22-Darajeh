"use client";

import { useActionState, useState } from "react";
import { savePriceBand } from "@/lib/actions/pricing";
import { SENIORITY_LEVELS } from "@/lib/seniority";
import { HOURLY_BAND_KEY, SESSION_TYPES } from "@/lib/services";
import { ceilToman, floorToman } from "@/lib/rates";

export type Band = {
  session_key: string;
  seniority: string;
  min_usd: number;
  max_usd: number;
};

/**
 * Every priced thing on the site, read from the catalogue rather than copied
 * from it.
 *
 * This used to be a hand-written list of three, which is how پرسش و پاسخ came
 * to have no range at all: it was added to SESSION_TYPES and nothing here
 * noticed. A missing row is not a cosmetic gap — the trigger reads an absent
 * band as "no rule yet" and publishes whatever it is given, so the one service
 * nobody listed was the one service nobody capped.
 *
 * Project work is appended by hand because it genuinely is not a session: it
 * has no session type and is priced by the hour.
 */
const ROWS: { key: string; title: string; meta: string }[] = [
  ...SESSION_TYPES.map((session) => ({
    key: session.key,
    title: session.title,
    meta: `${session.minutes.toLocaleString("fa-IR")} دقیقه`,
  })),
  { key: HOURLY_BAND_KEY, title: "کار پروژه‌ای", meta: "هر نفر-ساعت" },
];

/** What a dollar band is worth today, for an admin who thinks in toman. */
function tomanHint(
  min: string,
  max: string,
  rate: number | null,
): string | null {
  const lo = Number(min);
  const hi = Number(max);
  if (!rate || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  if (lo <= 0 || hi <= 0) return null;

  // The floor rounds up and the ceiling down, so the toman figures quoted here
  // are always inside the dollar band rather than a hair outside it.
  return `${ceilToman(lo * rate).toLocaleString("fa-IR")} تا ${floorToman(
    hi * rate,
  ).toLocaleString("fa-IR")} تومان`;
}

function Cell({
  sessionKey,
  seniority,
  band,
  usdRate,
}: {
  sessionKey: string;
  seniority: string;
  band: Band | undefined;
  usdRate: number | null;
}) {
  const [state, action, pending] = useActionState(savePriceBand, undefined);
  const [min, setMin] = useState(String(band?.min_usd ?? ""));
  const [max, setMax] = useState(String(band?.max_usd ?? ""));

  const hint = tomanHint(min, max, usdRate);

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="session_key" value={sessionKey} />
      <input type="hidden" name="seniority" value={seniority} />

      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1">
          <span className="text-xs text-muted">$</span>
          <input
            name="min_usd"
            inputMode="decimal"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            aria-label="کمترین قیمت به دلار"
            className="w-16 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-deep"
          />
        </span>
        <span className="text-xs text-muted">تا</span>
        <span className="flex items-center gap-1">
          <span className="text-xs text-muted">$</span>
          <input
            name="max_usd"
            inputMode="decimal"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            aria-label="بیشترین قیمت به دلار"
            className="w-16 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-deep"
          />
        </span>
      </div>

      {/* Shown, never stored. The rate moves and this line moves with it; the
          only number kept anywhere is the dollar one above. */}
      {hint && <p className="text-[11px] leading-5 text-muted">{hint}</p>}

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
 * What the site will publish without being asked: every priced thing against
 * the three experience bands, in dollars.
 *
 * Fifteen cells since 0056 — four session types plus project work. It was nine
 * until پرسش و پاسخ and the hourly rate turned out to have no range at all,
 * which meant no ceiling either.
 *
 * Dollars because that is what a session is worth. They were toman until 0055,
 * which meant the range and the price it judges were quoted in different
 * currencies and the rule drifted every time the market moved — nine numbers
 * an admin would have had to re-type to undo a change they never made. The
 * toman figure under each cell is the same band at today's rate, printed for
 * somebody who thinks in toman and stored nowhere.
 *
 * Each cell saves on its own, because changing one number should not mean
 * re-submitting eight others that were already right.
 */
export default function PriceBandTable({
  bands,
  usdRate,
}: {
  bands: Band[];
  /** Toman per dollar, for the hint under each cell. */
  usdRate: number | null;
}) {
  const find = (k: string, s: string) =>
    bands.find((b) => b.session_key === k && b.seniority === s);

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-right text-sm">
        <thead className="bg-card text-muted">
          <tr>
            {/* Not «جلسه» any more: the last row is project work, which is
                priced by the hour and is not a session. */}
            <th className="px-4 py-3 font-medium">خدمت</th>
            {SENIORITY_LEVELS.map((level) => (
              <th key={level.value} className="px-4 py-3 font-medium">
                {level.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-t border-card-border">
              <td className="px-4 py-3 align-top">
                <div className="font-medium">{row.title}</div>
                <div className="mt-0.5 text-xs text-muted">{row.meta}</div>
              </td>
              {SENIORITY_LEVELS.map((level) => (
                <td key={level.value} className="px-4 py-3 align-top">
                  <Cell
                    sessionKey={row.key}
                    seniority={level.value}
                    band={find(row.key, level.value)}
                    usdRate={usdRate}
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

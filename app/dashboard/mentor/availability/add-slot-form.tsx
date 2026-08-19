"use client";

import { useActionState, useMemo, useState } from "react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { addAvailabilitySlots } from "@/lib/actions/availability";
import TimeWheel from "@/components/TimeWheel";

// Saturday-first, matching how a Persian week is read.
const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const GREGORIAN_WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

// Mentors pick a round start time — nobody offers a call at 09:06 — and the
// 22 minutes are measured from there, so 09:00 becomes 09:00–09:22.
const SESSION_MINUTES = 22;
const START_STEP = 30;
// Nobody wants career advice at eight in the morning; evenings, once work is
// over, are when these calls actually happen.
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;

// Times repeat weekly by default, for the next three months. Slots have to
// end somewhere, and a mentor can extend whenever they like.
const REPEAT_WEEKS = 12;

function hhmm(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const TIME_OPTIONS = (() => {
  const out: { start: string; end: string }[] = [];
  for (let m = DAY_START; m + SESSION_MINUTES <= DAY_END; m += START_STEP) {
    out.push({ start: hhmm(m), end: hhmm(m + SESSION_MINUTES) });
  }
  return out;
})();

function fa(n: number | string) {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AddSlotForm({
  useJalali,
  takenDates = [],
}: {
  useJalali: boolean;
  takenDates?: string[];
}) {
  const taken = useMemo(() => new Set(takenDates), [takenDates]);

  const [state, action, pending] = useActionState(addAvailabilitySlots, undefined);

  const today = useMemo(() => startOfToday(), []);
  const [cursor, setCursor] = useState(() => new Date(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [wheelHour, setWheelHour] = useState(9);
  const [wheelMinute, setWheelMinute] = useState(0);


  /** In Iran the weekend is Thursday and Friday; elsewhere Saturday/Sunday. */
  function isWeekend(d: Date) {
    const day = d.getDay(); // 0 = Sunday
    return useJalali ? day === 4 || day === 5 : day === 6 || day === 0;
  }

  const { label, days, leadingBlanks } = useMemo(() => {
    if (useJalali) {
      const { jy, jm } = toJalaali(cursor);
      const length = jalaaliMonthLength(jy, jm);
      const first = toGregorian(jy, jm, 1);
      const firstDate = new Date(first.gy, first.gm - 1, first.gd);
      const blanks = (firstDate.getDay() + 1) % 7; // Saturday-first
      return {
        label: `${JALALI_MONTHS[jm - 1]} ${fa(jy)}`,
        days: Array.from({ length }, (_, i) => {
          const g = toGregorian(jy, jm, i + 1);
          return new Date(g.gy, g.gm - 1, g.gd);
        }),
        leadingBlanks: blanks,
      };
    }

    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const length = new Date(y, m + 1, 0).getDate();
    const firstDate = new Date(y, m, 1);
    return {
      label: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
      }).format(firstDate),
      days: Array.from({ length }, (_, i) => new Date(y, m, i + 1)),
      leadingBlanks: (firstDate.getDay() + 6) % 7, // Monday-first
    };
  }, [cursor, useJalali]);

  function shiftMonth(delta: number) {
    if (useJalali) {
      const { jy, jm } = toJalaali(cursor);
      let ny = jy;
      let nm = jm + delta;
      if (nm < 1) {
        nm = 12;
        ny -= 1;
      } else if (nm > 12) {
        nm = 1;
        ny += 1;
      }
      const g = toGregorian(ny, nm, 1);
      setCursor(new Date(g.gy, g.gm - 1, g.gd));
    } else {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    }
  }

  function toggleTime(t: string) {
    setTimes((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : [...prev, t].sort((a, b) => toMinutes(a) - toMinutes(b)),
    );
  }

  function addWheelTime() {
    const t = `${String(wheelHour).padStart(2, "0")}:${String(wheelMinute).padStart(2, "0")}`;
    if (!times.includes(t)) toggleTime(t);
  }

  const weekdays = useJalali ? JALALI_WEEKDAYS : GREGORIAN_WEEKDAYS;
  const selectedLabel = selectedDate
    ? new Intl.DateTimeFormat(useJalali ? "fa-IR" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(selectedDate)
    : null;

  // Count what the mentor chose, not what it multiplies out to. Picking two
  // times is adding two times; that they recur weekly is a property of them,
  // not twenty-four separate decisions.
  const chosenCount = times.length;

  return (
    <form action={action} className="rounded-2xl border border-card-border bg-card p-6">
      <input type="hidden" name="date" value={selectedDate ? isoDate(selectedDate) : ""} />
      <input type="hidden" name="times" value={times.join(",")} />
      <input type="hidden" name="repeat_weeks" value={REPEAT_WEEKS} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-full border border-card-border px-3 py-1 text-sm text-muted transition hover:border-brand hover:text-brand"
              aria-label="ماه قبل"
            >
              ‹
            </button>
            <span className="text-sm font-bold">{label}</span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-full border border-card-border px-3 py-1 text-sm text-muted transition hover:border-brand hover:text-brand"
              aria-label="ماه بعد"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekdays.map((w, i) => {
              // Column index of the weekend, in each calendar's own ordering.
              const weekendColumn = useJalali ? i >= 5 : i >= 5;
              return (
                <span
                  key={w}
                  className={`py-1 ${weekendColumn ? "text-amber-400/70" : "text-muted"}`}
                >
                  {w}
                </span>
              );
            })}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const iso = isoDate(day);
              const past = day < today;
              const selected = selectedDate && isoDate(selectedDate) === iso;
              const weekend = isWeekend(day);
              const hasSlots = taken.has(iso);
              const dayNumber = useJalali ? fa(toJalaali(day).jd) : day.getDate();
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={past}
                  onClick={() => setSelectedDate(day)}
                  title={weekend ? "تعطیل" : undefined}
                  className={`relative aspect-square rounded-lg text-sm transition ${
                    selected
                      ? "bg-brand font-bold text-background"
                      : past
                        ? "cursor-not-allowed text-muted/30"
                        : hasSlots
                          ? "bg-brand-light font-bold text-brand"
                          : weekend
                            ? "text-amber-400/80 hover:bg-brand-light hover:text-brand"
                            : "text-foreground hover:bg-brand-light hover:text-brand"
                  }`}
                >
                  {dayNumber}
                  {/* A day already carrying slots keeps its dot in every month
                      the mentor browses to, not just the one on screen. */}
                  {hasSlots && !selected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        <div>
          {!selectedDate && (
            <p className="text-sm text-muted">اول یک روز از تقویم انتخاب کن.</p>
          )}

          {selectedDate && (
            <>
              <p className="mb-3 text-sm">
                <span className="text-muted">روز انتخاب‌شده: </span>
                <span className="font-bold">{selectedLabel}</span>
              </p>

              {times.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs text-brand"
                    >
                      <span dir="ltr">
                        {useJalali
                          ? `${fa(t)} تا ${fa(hhmm(toMinutes(t) + SESSION_MINUTES))}`
                          : `${t}–${hhmm(toMinutes(t) + SESSION_MINUTES)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleTime(t)}
                        aria-label={`حذف ${t}`}
                        className="text-brand/60 transition hover:text-brand"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="mb-2 text-xs text-muted">
                ساعت شروع را انتخاب کن؛ جلسه ۲۲ دقیقه بعد تمام می‌شه.
              </p>
              <div
                dir="ltr"
                className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
              >
                {TIME_OPTIONS.map(({ start, end }) => {
                  const on = times.includes(start);
                  return (
                    <button
                      key={start}
                      type="button"
                      onClick={() => toggleTime(start)}
                      className={`rounded-lg border px-2 py-2 transition ${
                        on
                          ? "border-brand bg-brand-light text-brand"
                          : "border-card-border text-muted hover:border-brand hover:text-brand"
                      }`}
                    >
                      <span className="block text-sm font-bold" dir="ltr">
                        {useJalali ? fa(start) : start}
                      </span>
                      <span className="block text-[10px] opacity-70" dir="ltr">
                        {useJalali ? `تا ${fa(end)}` : `to ${end}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <span className="mb-1.5 block text-xs text-muted">
                  ساعت دلخواه
                </span>
                <div className="flex items-center gap-3">
                  <TimeWheel
                    hour={wheelHour}
                    minute={wheelMinute}
                    usePersianDigits={useJalali}
                    onChange={(h, m) => {
                      setWheelHour(h);
                      setWheelMinute(m);
                    }}
                  />
                  <button
                    type="button"
                    onClick={addWheelTime}
                    className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
                  >
                    افزودن
                  </button>
                </div>
              </div>

            </>
          )}
        </div>
      </div>

      {state?.error && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.added ? (
        <p className="mt-4 rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand">
          زمان‌های آزادت اضافه شد.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !selectedDate || times.length === 0}
        className="mt-6 w-full rounded-full bg-brand px-6 py-3 font-semibold text-background transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending
          ? "در حال افزودن..."
          : chosenCount > 0
            ? `افزودن ${fa(chosenCount)} زمان`
            : "افزودن زمان"}
      </button>
    </form>
  );
}

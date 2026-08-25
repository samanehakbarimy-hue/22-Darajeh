"use client";

import { useMemo, useState } from "react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { fa, isoDate } from "@/lib/persian";

const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const GREGORIAN_WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/**
 * A month grid in either calendar. Specialists use it to offer times and
 * seekers to pick one; it was written twice before this component existed.
 *
 * The caller decides which days are unusable and which carry a mark, so the
 * grid itself has no opinion about slots or bookings.
 */
export default function MonthCalendar({
  useJalali,
  value,
  onChange,
  startFrom,
  isDisabled,
  isMarked,
}: {
  useJalali: boolean;
  value: Date | null;
  onChange: (day: Date) => void;
  /** Month to open on. Defaults to the selected day, else today. */
  startFrom?: Date;
  isDisabled?: (day: Date) => boolean;
  isMarked?: (day: Date) => boolean;
}) {
  const [cursor, setCursor] = useState(() => startFrom ?? value ?? new Date());

  const { label, days, leadingBlanks } = useMemo(() => {
    if (useJalali) {
      const { jy, jm } = toJalaali(cursor);
      const length = jalaaliMonthLength(jy, jm);
      const first = toGregorian(jy, jm, 1);
      const firstDate = new Date(first.gy, first.gm - 1, first.gd);
      return {
        label: `${JALALI_MONTHS[jm - 1]} ${fa(jy)}`,
        days: Array.from({ length }, (_, i) => {
          const g = toGregorian(jy, jm, i + 1);
          return new Date(g.gy, g.gm - 1, g.gd);
        }),
        // getDay() is 0 for Sunday; a Persian week starts on Saturday.
        leadingBlanks: (firstDate.getDay() + 1) % 7,
      };
    }

    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const firstDate = new Date(y, m, 1);
    return {
      label: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
      }).format(firstDate),
      days: Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) =>
        new Date(y, m, i + 1),
      ),
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

  /** In Iran the weekend is Thursday and Friday; elsewhere Saturday/Sunday. */
  function isWeekend(d: Date) {
    const day = d.getDay();
    return useJalali ? day === 4 || day === 5 : day === 6 || day === 0;
  }

  const weekdays = useJalali ? JALALI_WEEKDAYS : GREGORIAN_WEEKDAYS;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="ماه قبل"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-card-border text-sm text-muted transition hover:border-brand hover:text-brand-deep"
        >
          ‹
        </button>
        <span className="text-sm font-bold">{label}</span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="ماه بعد"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-card-border text-sm text-muted transition hover:border-brand hover:text-brand-deep"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((w, i) => (
          <span
            key={w}
            className={`py-1 ${i >= 5 ? "text-warning/70" : "text-muted"}`}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const iso = isoDate(day);
          const disabled = isDisabled?.(day) ?? false;
          const selected = value !== null && isoDate(value) === iso;
          const marked = isMarked?.(day) ?? false;
          const weekend = isWeekend(day);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(day)}
              title={weekend ? "تعطیل" : undefined}
              className={`relative aspect-square rounded-lg text-sm transition ${
                selected
                  ? "bg-brand font-bold text-brand-on"
                  : disabled
                    ? "cursor-not-allowed text-muted/30"
                    : marked
                      ? "bg-brand-light font-bold text-brand-deep hover:bg-brand hover:text-brand-on"
                      : weekend
                        ? "text-warning/80 hover:bg-brand-light hover:text-brand-deep"
                        : "text-foreground hover:bg-brand-light hover:text-brand-deep"
              }`}
            >
              {useJalali ? fa(toJalaali(day).jd) : day.getDate()}
              {marked && !selected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

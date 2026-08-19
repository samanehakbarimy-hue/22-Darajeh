"use client";

import { useActionState, useMemo, useState } from "react";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { createBooking } from "@/lib/actions/booking";

type Slot = { id: string; startTime: string };

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function fa(n: number | string) {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingForm({
  mentorId,
  slots,
}: {
  mentorId: string;
  slots: Slot[];
}) {
  const [state, action, pending] = useActionState(createBooking, undefined);

  // Group the open slots by day, so the calendar can offer only the days this
  // specialist is actually free.
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = isoDate(new Date(slot.startTime));
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return map;
  }, [slots]);

  const firstDay = slots.length > 0 ? new Date(slots[0].startTime) : new Date();
  const [cursor, setCursor] = useState(firstDay);
  const [selectedDay, setSelectedDay] = useState<string | null>(
    slots.length > 0 ? isoDate(new Date(slots[0].startTime)) : null,
  );
  const [slotId, setSlotId] = useState<string>("");

  const { label, days, leadingBlanks } = useMemo(() => {
    const { jy, jm } = toJalaali(cursor);
    const length = jalaaliMonthLength(jy, jm);
    const first = toGregorian(jy, jm, 1);
    const firstDate = new Date(first.gy, first.gm - 1, first.gd);
    return {
      label: `${MONTHS[jm - 1]} ${fa(jy)}`,
      days: Array.from({ length }, (_, i) => {
        const g = toGregorian(jy, jm, i + 1);
        return new Date(g.gy, g.gm - 1, g.gd);
      }),
      leadingBlanks: (firstDate.getDay() + 1) % 7, // Saturday-first
    };
  }, [cursor]);

  function shiftMonth(delta: number) {
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
  }

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayFormatter = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const daySlots = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="mentor_id" value={mentorId} />
      <input type="hidden" name="slot_id" value={slotId} />

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">
          خودت رو معرفی کن و بگو چرا می‌خوای این تماس رو داشته باشی (حدود ۱۰۰
          کلمه)
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="سلام! من ... هستم و در حال حاضر روی ... کار می‌کنم. دوست دارم درباره ... باهات صحبت کنم چون ..."
          className="w-full rounded-lg border border-card-border bg-background px-4 py-3 outline-none focus:border-brand"
        />
      </div>

      <div>
        <span className="mb-3 block text-sm font-medium">یک زمان انتخاب کن</span>

        {slots.length === 0 ? (
          <p className="text-sm text-muted">
            این متخصص فعلاً زمان خالی ثبت نکرده.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-card-border bg-card p-5 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="ماه قبل"
                  className="rounded-full border border-card-border px-3 py-1 text-sm text-muted transition hover:border-brand hover:text-brand"
                >
                  ‹
                </button>
                <span className="text-sm font-bold">{label}</span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="ماه بعد"
                  className="rounded-full border border-card-border px-3 py-1 text-sm text-muted transition hover:border-brand hover:text-brand"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1">
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
                  const free = byDay.has(iso);
                  const selected = selectedDay === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!free}
                      onClick={() => {
                        setSelectedDay(iso);
                        setSlotId("");
                      }}
                      className={`aspect-square rounded-lg text-sm transition ${
                        selected
                          ? "bg-brand font-bold text-background"
                          : free
                            ? "bg-brand-light font-bold text-brand hover:bg-brand hover:text-background"
                            : "cursor-not-allowed text-muted/30"
                      }`}
                    >
                      {fa(toJalaali(day).jd)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {selectedDay && (
                <>
                  <p className="mb-3 text-sm">
                    <span className="text-muted">روز انتخاب‌شده: </span>
                    <span className="font-bold">
                      {dayFormatter.format(new Date(selectedDay))}
                    </span>
                  </p>
                  {/* One session per booking, so these are single-choice. */}
                  <div className="grid grid-cols-2 gap-2">
                    {daySlots.map((slot) => {
                      const on = slotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSlotId(slot.id)}
                          className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                            on
                              ? "border-brand bg-brand-light font-bold text-brand"
                              : "border-card-border text-muted hover:border-brand hover:text-brand"
                          }`}
                          dir="ltr"
                        >
                          {fa(timeFormatter.format(new Date(slot.startTime)))}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        disabled={pending || !slotId}
        type="submit"
        className="rounded-full bg-brand px-6 py-3 font-semibold text-background transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "در حال ارسال..." : "ارسال درخواست"}
      </button>
    </form>
  );
}

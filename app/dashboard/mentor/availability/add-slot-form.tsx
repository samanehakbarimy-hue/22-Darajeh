"use client";

import { useActionState, useMemo, useState } from "react";
import { addAvailabilitySlots } from "@/lib/actions/availability";
import MonthCalendar from "@/components/MonthCalendar";
import TimeWheel from "@/components/TimeWheel";
import { fa, hhmm, isoDate, startOfToday, toMinutes } from "@/lib/persian";

// Mentors pick a round start time — nobody offers a call at 09:06 — and the
// 22 minutes are measured from there, so 09:00 becomes 09:00–09:22.
const SESSION_MINUTES = 22;
const START_STEP = 30;
// Nobody wants career advice at eight in the morning; evenings, once work is
// over, are when these calls actually happen.
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;

// Times repeat weekly by default, for the next six months. Slots have to end
// somewhere, and a mentor can extend whenever they like.
const REPEAT_WEEKS = 26;

const TIME_OPTIONS = (() => {
  const out: { start: string; end: string }[] = [];
  for (let m = DAY_START; m + SESSION_MINUTES <= DAY_END; m += START_STEP) {
    out.push({ start: hhmm(m), end: hhmm(m + SESSION_MINUTES) });
  }
  return out;
})();

export default function AddSlotForm({
  useJalali,
  takenDates = [],
}: {
  useJalali: boolean;
  takenDates?: string[];
}) {
  const taken = useMemo(() => new Set(takenDates), [takenDates]);

  const [state, action, pending] = useActionState(
    addAvailabilitySlots,
    undefined,
  );

  const today = useMemo(() => startOfToday(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [wheelHour, setWheelHour] = useState(9);
  const [wheelMinute, setWheelMinute] = useState(0);
  const [wheelTouched, setWheelTouched] = useState(false);

  function toggleTime(t: string) {
    setTimes((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : [...prev, t].sort((a, b) => toMinutes(a) - toMinutes(b)),
    );
  }

  // Once the times are saved they are no longer a pending selection. Leaving
  // them chosen left the button offering to add what had just been added, and
  // pressing it did nothing because the server skips duplicates. Clear during
  // render rather than in an effect, so the button never paints as enabled.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.added && (times.length > 0 || wheelTouched)) {
      setTimes([]);
      setWheelTouched(false);
    }
  }

  // Moving the wheel is the choice. Requiring a separate "add" press meant a
  // mentor could set a time, see it on screen, and still find the submit
  // button dead — two add buttons, and the wrong one looked like the action.
  const wheelTime = `${String(wheelHour).padStart(2, "0")}:${String(wheelMinute).padStart(2, "0")}`;
  const allTimes =
    wheelTouched && !times.includes(wheelTime)
      ? [...times, wheelTime].sort((a, b) => toMinutes(a) - toMinutes(b))
      : times;

  function removeTime(t: string) {
    if (t === wheelTime && wheelTouched) setWheelTouched(false);
    if (times.includes(t)) toggleTime(t);
  }

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
  const chosenCount = allTimes.length;

  return (
    <form
      action={action}
      className="rounded-2xl border border-card-border bg-card p-6"
    >
      <input
        type="hidden"
        name="date"
        value={selectedDate ? isoDate(selectedDate) : ""}
      />
      <input type="hidden" name="times" value={allTimes.join(",")} />
      <input type="hidden" name="repeat_weeks" value={REPEAT_WEEKS} />

      {/* Only split into two columns once there is something to put in the
          second one; an empty half beside the calendar looks unfinished. */}
      <div
        className={`grid gap-8 ${
          selectedDate ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div className={selectedDate ? "" : "mx-auto w-full max-w-xs"}>
          <MonthCalendar
            useJalali={useJalali}
            value={selectedDate}
            onChange={setSelectedDate}
            isDisabled={(day) => day < today}
            isMarked={(day) => taken.has(isoDate(day))}
          />
        </div>

        {selectedDate && (
          <div>
            <p className="mb-3 text-sm">
              <span className="text-muted">روز انتخاب‌شده: </span>
              <span className="font-bold">{selectedLabel}</span>
            </p>

            {allTimes.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {allTimes.map((t) => (
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
                      onClick={() => removeTime(t)}
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
                    setWheelTouched(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {state?.error && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {/* Drop the confirmation as soon as a new selection starts, so it never
          describes something other than what the button is about to do. */}
      {state?.added && allTimes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand">
          زمان‌های آزادت اضافه شد.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !selectedDate || allTimes.length === 0}
        className="mt-6 w-full rounded-full bg-brand px-6 py-3 font-semibold text-background transition hover:bg-brand-hover disabled:opacity-50"
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

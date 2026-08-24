"use client";

import { useActionState, useMemo, useState } from "react";
import { createBooking } from "@/lib/actions/booking";
import MonthCalendar from "@/components/MonthCalendar";
import Spinner from "@/components/Spinner";
import { dateFormats, fa, isoDate } from "@/lib/persian";

type Slot = { id: string; startTime: string };

// Must match the limit enforced in createBooking.
const MAX_WORDS = 120;

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

  const firstFreeDay = slots.length > 0 ? new Date(slots[0].startTime) : null;
  const [selectedDay, setSelectedDay] = useState<Date | null>(firstFreeDay);
  const [slotId, setSlotId] = useState("");
  const [message, setMessage] = useState("");

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const tooLong = wordCount > MAX_WORDS;

  const daySlots = selectedDay ? (byDay.get(isoDate(selectedDay)) ?? []) : [];

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="mentor_id" value={mentorId} />
      <input type="hidden" name="slot_id" value={slotId} />

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium">
          خودت رو معرفی کن و بگو چرا می‌خوای این تماس رو داشته باشی
        </label>
        {/* Controlled, so a rejected submission doesn't erase what was
            written — React resets uncontrolled fields after a form action. */}
        <textarea
          id="message"
          name="message"
          maxLength={2000}
          rows={6}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="سلام! من ... هستم و در حال حاضر روی ... کار می‌کنم. دوست دارم درباره ... باهات صحبت کنم چون ..."
          className="w-full rounded-lg border border-card-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {/* Only the ceiling is a rule, so only mention it when it is close. */}
        {wordCount > MAX_WORDS - 20 && (
          <p
            className={`mt-1.5 text-xs ${tooLong ? "text-amber-400" : "text-muted"}`}
          >
            {fa(wordCount)} کلمه از {fa(MAX_WORDS)}
          </p>
        )}
      </div>

      <div>
        <span className="mb-3 block text-sm font-medium">یک زمان انتخاب کن</span>

        {slots.length === 0 ? (
          <p className="text-sm text-muted">
            این متخصص فعلاً زمان خالی ثبت نکرده.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-card-border bg-card p-5 md:grid-cols-2">
            <MonthCalendar
              useJalali
              value={selectedDay}
              startFrom={firstFreeDay ?? undefined}
              onChange={(day) => {
                setSelectedDay(day);
                setSlotId("");
              }}
              isDisabled={(day) => !byDay.has(isoDate(day))}
              isMarked={(day) => byDay.has(isoDate(day))}
            />

            <div>
              {selectedDay && (
                /* One session per booking, so these are single-choice — and
                   pressing the chosen one again lets it go. */
                <div className="flex flex-col gap-2">
                  {daySlots.map((slot) => {
                    const on = slotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSlotId(on ? "" : slot.id)}
                        aria-pressed={on}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                          on
                            ? "border-brand bg-brand-light font-bold text-brand"
                            : "border-card-border text-muted hover:border-brand hover:text-brand"
                        }`}
                        dir="ltr"
                      >
                        {fa(dateFormats.clock.format(new Date(slot.startTime)))}
                      </button>
                    );
                  })}
                </div>
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
        disabled={pending || !slotId || wordCount === 0 || tooLong}
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-background transition hover:bg-brand-hover disabled:opacity-50"
      >
        {pending && <Spinner />}
        {pending ? "در حال ارسال..." : "ارسال درخواست"}
      </button>
    </form>
  );
}

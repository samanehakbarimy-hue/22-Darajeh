"use client";

import { useActionState } from "react";
import { createBooking } from "@/lib/actions/booking";

type Slot = { id: string; label: string };

export default function BookingForm({
  mentorId,
  slots,
}: {
  mentorId: string;
  slots: Slot[];
}) {
  const [state, action, pending] = useActionState(createBooking, undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="mentor_id" value={mentorId} />

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

      <fieldset>
        <legend className="mb-2 text-sm font-medium">یک زمان انتخاب کن</legend>
        {slots.length === 0 && (
          <p className="text-sm text-muted">
            این متخصص فعلاً زمان خالی ثبت نکرده.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {slots.map((slot, index) => (
            <label
              key={slot.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-card-border bg-card px-4 py-3 has-checked:border-brand"
            >
              <input
                type="radio"
                name="slot_id"
                value={slot.id}
                required
                defaultChecked={index === 0}
                className="accent-brand"
              />
              <span>{slot.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        disabled={pending || slots.length === 0}
        type="submit"
        className="rounded-full bg-brand px-6 py-3 font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "در حال ارسال..." : "ارسال درخواست و رزرو"}
      </button>
    </form>
  );
}

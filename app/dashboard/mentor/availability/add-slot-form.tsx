"use client";

import { useActionState } from "react";
import { addAvailabilitySlot } from "@/lib/actions/availability";

export default function AddSlotForm() {
  const [state, action, pending] = useActionState(addAvailabilitySlot, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium">
          تاریخ
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="time" className="mb-1 block text-sm font-medium">
          ساعت شروع
        </label>
        <input
          id="time"
          name="time"
          type="time"
          required
          className="rounded-lg border border-card-border bg-background px-4 py-2 outline-none focus:border-brand"
        />
      </div>
      <button
        disabled={pending}
        type="submit"
        className="rounded-full bg-brand px-6 py-2 font-semibold text-background hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "در حال افزودن..." : "افزودن زمان"}
      </button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

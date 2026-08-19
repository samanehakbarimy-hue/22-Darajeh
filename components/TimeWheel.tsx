"use client";

import { useEffect, useRef } from "react";
import { fa } from "@/lib/persian";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

/**
 * One scrollable column, snapping to whichever value sits in the middle —
 * the way a phone's alarm picker behaves.
 */
function Column({
  values,
  value,
  onChange,
  usePersianDigits,
  label,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  usePersianDigits: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Scrolling we caused ourselves must not be read back as the user choosing
  // something: snap adjusts the position after we set it, and reading that
  // would commit a value nobody picked.
  const programmatic = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = values.indexOf(value) * ITEM_HEIGHT;
    programmatic.current = true;
    // After layout, so snap has something real to snap to.
    requestAnimationFrame(() => {
      el.scrollTop = target;
      setTimeout(() => {
        programmatic.current = false;
      }, 200);
    });
    // Position once on mount; afterwards the wheel owns its own scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = ref.current;
    if (!el || programmatic.current) return;
    if (settle.current) clearTimeout(settle.current);
    // Wait for the scroll to come to rest before committing a value, so
    // flicking through the list doesn't fire a change per item.
    settle.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const next = values[Math.max(0, Math.min(index, values.length - 1))];
      if (next !== undefined && next !== value) onChange(next);
    }, 80);
  }

  function selectAt(v: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: values.indexOf(v) * ITEM_HEIGHT, behavior: "smooth" });
    onChange(v);
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      className="hide-scrollbar snap-y snap-mandatory overflow-y-scroll"
      style={{
        height: WHEEL_HEIGHT,
        // Half an item of padding top and bottom lets the first and last
        // values reach the middle.
        paddingBlock: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
      }}
    >
      {values.map((v) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => selectAt(v)}
            className={`flex w-full snap-center items-center justify-center tabular-nums transition ${
              selected
                ? "text-lg font-bold text-brand"
                : "text-xs text-muted/40"
            }`}
            style={{ height: ITEM_HEIGHT }}
            dir="ltr"
          >
            {usePersianDigits
              ? fa(String(v).padStart(2, "0"))
              : String(v).padStart(2, "0")}
          </button>
        );
      })}
    </div>
  );
}

export default function TimeWheel({
  hour,
  minute,
  onChange,
  usePersianDigits = true,
  minuteStep = 5,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  usePersianDigits?: boolean;
  minuteStep?: number;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);

  return (
    // Forced left-to-right so the hour sits on the left and the minutes on the
    // right, the way a clock reads — an RTL page would otherwise flip them.
    <div
      dir="ltr"
      className="relative w-32 rounded-xl border border-card-border bg-background"
      style={{ height: WHEEL_HEIGHT }}
    >
      {/* The band marking which row counts as chosen. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-0 border-y border-brand/30 bg-brand-light/40"
        style={{ top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2, height: ITEM_HEIGHT }}
      />
      <div className="relative z-10 grid h-full grid-cols-[1fr_auto_1fr] items-center">
        <Column
          values={hours}
          value={hour}
          onChange={(h) => onChange(h, minute)}
          usePersianDigits={usePersianDigits}
          label="ساعت"
        />
        <span className="px-1 text-lg text-muted">:</span>
        <Column
          values={minutes}
          value={minute}
          onChange={(m) => onChange(hour, m)}
          usePersianDigits={usePersianDigits}
          label="دقیقه"
        />
      </div>
    </div>
  );
}

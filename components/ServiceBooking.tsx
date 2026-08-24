"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  TABS,
  formatDuration,
  formatServicePrice,
  serviceDescription,
  serviceTitle,
  type MentorService,
  type ServiceTab,
} from "@/lib/services";

/** One offer: what it is on the right, what it costs on the left. */
function ServiceRow({
  title,
  description,
  meta,
  price,
  action,
}: {
  title: string;
  description: string;
  meta: string;
  price: string;
  action: React.ReactNode;
}) {
  return (
    <li className="border-b border-card-border py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {/* The title takes at least half the row whatever the price says, and
            the price drops to its own line before it can squeeze the title
            into a column one word wide. */}
        <div className="min-w-[55%] flex-1">
          <h4 className="font-bold">{title}</h4>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          )}
        </div>
        <div className="text-left">
          <div className="text-xs text-muted">{meta}</div>
          <div className="mt-0.5 text-sm font-bold">{price}</div>
        </div>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </li>
  );
}

/**
 * Everything a specialist offers, in one card.
 *
 * Sessions have fixed lengths from the catalogue, so a price here means the
 * same thing as the same price on another profile. Project work is priced by
 * the hour, on terms the specialist wrote.
 */
export default function ServiceBooking({
  specialistId,
  services,
}: {
  specialistId: string;
  services: MentorService[];
  /** Toman per dollar, or null when the live rate was unavailable. */
}) {
  const [active, setActive] = useState<ServiceTab>("sessions");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, which is how a tablist is expected to
  // behave. Reversed, because on an RTL page the next tab is to the left.
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta =
      event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + TABS.length) % TABS.length;
    setActive(TABS[next].tab);
    tabRefs.current[next]?.focus();
  }

  const sessions = services.filter((s) => s.kind === "consultation");
  // One rate per specialist, not a catalogue: the work is described by the
  // person asking for it, not guessed at in advance.
  const projectRate =
    services.find((s) => s.kind === "hourly_project") ?? null;

  const inertCta = (label: string) => (
    // Inert until there is a way to take payment. A live button would collect
    // money nobody can receive.
    <span
      className="inline-block cursor-not-allowed rounded-full border border-card-border px-4 py-2 text-xs text-muted"
      aria-disabled
    >
      {label}
    </span>
  );

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <div
        role="tablist"
        aria-label="راه‌های کار با این متخصص"
        className="flex border-b border-card-border"
      >
        {TABS.map((tab, index) => {
          const selected = tab.tab === active;
          return (
            <button
              key={tab.tab}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${tab.tab}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.tab)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`flex-1 whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-medium transition ${
                selected
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {active === "sessions" ? (
          <>
            <ul className="flex flex-col">
              {sessions.map((service) => (
                <ServiceRow
                  key={service.id}
                  title={serviceTitle(service)}
                  description={serviceDescription(service)}
                  meta={formatDuration(service)}
                  price={formatServicePrice(service)}
                  action={inertCta("رزرو")}
                />
              ))}
            </ul>

          </>
        ) : !projectRate ? (
          <p className="py-6 text-sm leading-7 text-muted">
            این متخصص هنوز نرخ کار پروژه‌ای نگذاشته. می‌تونی تماس رایگان ۲۲
            دقیقه‌ای را رزرو کنی و نیازت را با او در میان بگذاری.
          </p>
        ) : (
          <ul className="flex flex-col">
            <ServiceRow
              title="کار پروژه‌ای"
              description="کارَت را توضیح بده و فایل‌هایش را بفرست؛ متخصص می‌بیند و می‌گوید قبول می‌کند یا نه."
              meta="نفرساعت"
              price={
                projectRate.is_negotiable
                  ? "قابل مذاکره"
                  : formatServicePrice(projectRate)
              }
              action={
                <Link
                  href={`/specialists/${specialistId}/project`}
                  className="shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-background hover:bg-brand-hover"
                >
                  نوشتن درخواست
                </Link>
              }
            />
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  FREE_CALL,
  TABS,
  formatDuration,
  formatServicePrice,
  type MentorService,
  type ServiceType,
} from "@/lib/services";
import { fa } from "@/lib/persian";

/** One service, laid out the same whether it is sold by session or by hour. */
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
    <li className="rounded-xl border border-card-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold">{title}</h4>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-3 text-xs text-muted">
        <span>{meta}</span>
        <span aria-hidden>•</span>
        <span className="font-bold text-foreground">{price}</span>
      </div>
    </li>
  );
}

/**
 * Everything a specialist offers, in one card.
 *
 * The free call is live. Paid services come from the specialist's own rows;
 * a price they have not set shows as به‌زودی and its button stays inert,
 * because there is nowhere for the money to go yet.
 */
export default function ServiceBooking({
  specialistId,
  hasSlots,
  nearestSlotLabel,
  services,
}: {
  specialistId: string;
  hasSlots: boolean;
  nearestSlotLabel: string | null;
  services: MentorService[];
}) {
  const [active, setActive] = useState<ServiceType>("free_call");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, which is how a tablist is expected to
  // behave. Reversed, because on an RTL page the next tab is to the left.
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta =
      event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + TABS.length) % TABS.length;
    setActive(TABS[next].type);
    tabRefs.current[next]?.focus();
  }

  const paid =
    active === "free_call"
      ? []
      : services.filter((service) => service.kind === active);

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <div
        role="tablist"
        aria-label="راه‌های کار با این متخصص"
        className="flex gap-1 rounded-full border border-card-border p-1"
      >
        {TABS.map((tab, index) => {
          const selected = tab.type === active;
          return (
            <button
              key={tab.type}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${tab.type}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.type}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.type)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`flex-1 whitespace-nowrap rounded-full px-2 py-2 text-xs font-medium transition sm:text-sm ${
                selected
                  ? "bg-brand text-background"
                  : "text-muted hover:text-foreground"
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
        className="mt-5"
      >
        {active === "free_call" ? (
          <>
            <ul className="flex flex-col gap-3">
              <ServiceRow
                title={FREE_CALL.title}
                description={FREE_CALL.description}
                meta={`${fa(FREE_CALL.minutes)} دقیقه`}
                price="رایگان"
                action={
                  hasSlots ? (
                    <Link
                      href={`/specialists/${specialistId}/book`}
                      className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-brand-hover"
                    >
                      رزرو
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-full border border-card-border px-4 py-2.5 text-xs text-muted">
                      زمان آزاد نیست
                    </span>
                  )
                }
              />
            </ul>

            {nearestSlotLabel && (
              <p className="mt-3 text-xs text-muted">
                نزدیک‌ترین زمان: {nearestSlotLabel}
              </p>
            )}
          </>
        ) : paid.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-background p-4 text-sm leading-7 text-muted">
            این متخصص هنوز{" "}
            {active === "consultation" ? "جلسه مشاوره‌ای" : "همکاری پروژه‌ای"}{" "}
            اضافه نکرده. می‌تونی تماس رایگان ۲۲ دقیقه‌ای را رزرو کنی و نیازت را
            با او در میان بگذاری.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {paid.map((service) => (
                <ServiceRow
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  meta={formatDuration(service)}
                  price={formatServicePrice(service)}
                  action={
                    // Inert until there is a way to take payment. A live
                    // button would collect money nobody can receive.
                    <span
                      className="shrink-0 cursor-not-allowed rounded-full border border-card-border px-4 py-2.5 text-xs text-muted"
                      aria-disabled
                    >
                      {service.kind === "consultation"
                        ? "رزرو"
                        : "درخواست همکاری"}
                    </span>
                  }
                />
              ))}
            </ul>

            <p className="mt-4 rounded-xl border border-card-border bg-background p-3 text-xs leading-6 text-muted">
              پرداخت آنلاین هنوز فعال نیست. فعلاً تماس رایگان را رزرو کن و
              درباره این خدمت با متخصص حرف بزن.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

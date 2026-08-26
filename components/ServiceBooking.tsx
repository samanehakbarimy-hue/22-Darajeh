"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  FREE_CALL,
  TABS,
  formatDuration,
  formatServicePrice,
  serviceDescription,
  serviceTitle,
  type MentorService,
  type ServiceTab,
} from "@/lib/services";
import { fa } from "@/lib/persian";

/** A numbered step in what a plan includes. */
function Included({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-deep">
        {fa(n)}
      </span>
      <span className="text-sm leading-6">
        <span className="font-medium">{title}</span>
        {body && <span className="block text-muted">{body}</span>}
      </span>
    </li>
  );
}

/** One reassurance, ticked. Only things that are true. */
function Assurance({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 text-xs text-muted">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0 text-brand-deep"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {children}
    </li>
  );
}

/** One paid offer: what it is, what it costs, and how long it runs. */
function ServiceRow({
  title,
  description,
  meta,
  price,
  action,
}: {
  title: string;
  description: string;
  meta?: string;
  price: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="border-b border-card-border py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-[55%] flex-1">
          <h4 className="text-sm font-bold">{title}</h4>
          {description && (
            <p className="mt-1 text-xs leading-6 text-muted">{description}</p>
          )}
        </div>
        <div className="text-left">
          {meta && <div className="text-xs text-muted">{meta}</div>}
          <div className="mt-0.5 text-sm font-bold">{price}</div>
        </div>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </li>
  );
}

/**
 * The panel a visitor decides from, laid out the way the profiles this site is
 * compared to lay theirs out: the three ways to work with somebody as tabs
 * across the top, the price of the chosen one large underneath, what it
 * includes, and one button.
 *
 * The free conversation is the first tab rather than a row in a list. It is
 * what the site is for, and the only thing here anyone can book today.
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
  const [active, setActive] = useState<ServiceTab>("intro");
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
  const projectRate = services.find((s) => s.kind === "hourly_project") ?? null;

  const cheapestSession = sessions.length
    ? sessions.reduce((low, s) =>
        (s.price_toman ?? Infinity) < (low.price_toman ?? Infinity) ? s : low,
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
        <div className="p-5">
          <div
            role="tablist"
            aria-label="راه‌های کار با این کارشناس"
            className="flex gap-1 rounded-full border border-card-border p-1"
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
                  className={`flex-1 rounded-full px-2 py-2 text-xs font-medium leading-5 transition ${
                    selected
                      ? "bg-brand text-brand-on"
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
            {active === "intro" && (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-brand-deep">
                    رایگان
                  </span>
                  <span className="text-sm text-muted">
                    / {fa(FREE_CALL.minutes)} دقیقه
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  بدون کارت بانکی. همین حالا قابل رزرو است.
                </p>

                <ul className="mt-5 flex flex-col gap-3">
                  <Included
                    n={1}
                    title="بگو دنبال چه هستی"
                    body="سؤالت را موقع رزرو می‌نویسی تا کارشناس آماده بیاید."
                  />
                  <Included
                    n={2}
                    title={`${fa(FREE_CALL.minutes)} دقیقه گفت‌وگوی ویدیویی`}
                    body="روی لینک جلسه‌ی خود کارشناس برگزار می‌شود."
                  />
                </ul>
              </>
            )}

            {active === "sessions" && (
              <>
                {cheapestSession ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {formatServicePrice(cheapestSession)}
                    </span>
                    <span className="text-sm text-muted">به بالا</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted">
                    این کارشناس هنوز جلسه‌ی تخصصی نگذاشته.
                  </div>
                )}

                <ul className="mt-3 flex flex-col">
                  {sessions.map((service) => (
                    <ServiceRow
                      key={service.id}
                      title={serviceTitle(service)}
                      description={serviceDescription(service)}
                      meta={formatDuration(service)}
                      price={formatServicePrice(service)}
                    />
                  ))}
                </ul>
              </>
            )}

            {active === "projects" && (
              <>
                {projectRate ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {projectRate.is_negotiable
                          ? "قابل مذاکره"
                          : formatServicePrice(projectRate)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      کارَت را توضیح بده و فایل‌هایش را بفرست؛ کارشناس می‌بیند و
                      می‌گوید قبول می‌کند یا نه.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-7 text-muted">
                    این کارشناس هنوز نرخ کار پروژه‌ای نگذاشته. گفت‌وگوی رایگان
                    را رزرو کن و نیازت را با او در میان بگذار.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* The button and the promises around it, on the tinted foot of the
            card so the eye lands on them last. */}
        <div className="border-t border-card-border bg-brand-light/40 p-5">
          {active === "projects" && projectRate ? (
            <Link
              href={`/specialists/${specialistId}/project`}
              className="block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-brand-on transition hover:bg-brand-hover"
            >
              نوشتن درخواست
            </Link>
          ) : hasSlots ? (
            <Link
              href={`/specialists/${specialistId}/book`}
              className="block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-brand-on transition hover:bg-brand-hover"
            >
              رزرو گفت‌وگوی رایگان
            </Link>
          ) : (
            <span
              role="button"
              aria-disabled="true"
              className="block cursor-not-allowed rounded-full border border-card-border px-5 py-3 text-center text-sm text-muted"
            >
              فعلاً زمان آزادی نیست
            </span>
          )}

          {active === "sessions" && sessions.length > 0 && (
            <p className="mt-3 text-xs leading-6 text-muted">
              پرداخت آنلاین هنوز فعال نیست، برای همین این جلسه‌ها فعلاً رزرو
              نمی‌شوند. گفت‌وگوی رایگان را رزرو کن و جزئیات را با کارشناس نهایی
              کن.
            </p>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            <Assurance>بدون کارت بانکی</Assurance>
            <Assurance>هر وقت خواستی لغو کن</Assurance>
            <Assurance>بدون قرارداد</Assurance>
          </ul>
        </div>
      </div>

      {/* Availability, in its own box under the card — the same place the
          profiles this one is measured against put it. */}
      <div className="rounded-2xl border border-card-border bg-card p-5">
        <div className="flex items-start gap-2 text-sm">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>
            {nearestSlotLabel ? (
              <>
                <span className="text-muted">نزدیک‌ترین زمان: </span>
                <span className="font-medium">{nearestSlotLabel}</span>
              </>
            ) : (
              <span className="text-muted">
                هنوز زمان آزادی نگذاشته است.
              </span>
            )}
          </span>
        </div>
        {nearestSlotLabel && (
          <p className="mt-2 pr-6 text-xs text-muted">به وقت تهران</p>
        )}
      </div>
    </div>
  );
}

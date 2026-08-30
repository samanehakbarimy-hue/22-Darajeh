"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  FREE_CALL,
  TABS,
  formatDuration,
  servicePrice,
  serviceDescription,
  serviceTitle,
  type MentorService,
  type ServicePrice,
  type ServiceTab,
} from "@/lib/services";
import { fa } from "@/lib/persian";

/** A numbered step in what a plan includes. */
function Included({ n, title }: { n: number; title: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-deep">
        {fa(n)}
      </span>
      <span className="text-sm leading-6">{title}</span>
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

/**
 * One paid offer: what it is, what it costs, and how long it runs.
 *
 * Two columns, not a wrapping flex row. The old layout let the price wrap
 * under the title once it got long enough, which put the duration and the
 * amount in different places on different rows — «بررسی رزومه» at seven
 * million toman broke where «مسیر شغلی» at nine hundred thousand did not, so
 * the three sessions never lined up with each other.
 *
 * A grid fixes the columns instead: everything the eye reads down the right
 * edge is what the session is, everything down the left is what it costs.
 * The price column takes the width it needs and refuses to break inside a
 * number; the description gets the rest and wraps there, which is the only
 * place wrapping does no harm.
 */
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
  price: ServicePrice | null;
  action?: React.ReactNode;
}) {
  return (
    <li className="border-b border-card-border py-4 last:border-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
        <div className="min-w-0">
          <h4 className="text-sm font-bold leading-6">{title}</h4>
          {description && (
            <p className="mt-0.5 text-xs leading-6 text-muted">{description}</p>
          )}
          {meta && <p className="mt-1 text-xs leading-5 text-muted">{meta}</p>}
        </div>

        {/* Left edge on an RTL page, so the amounts stack against the card
            border and can be compared down the column at a glance. */}
        <div className="shrink-0 text-left">
          {price ? (
            <>
              <div className="whitespace-nowrap text-sm font-bold leading-6">
                {price.toman}
              </div>
              {price.usd && (
                <div className="mt-0.5 whitespace-nowrap text-xs leading-5 text-muted">
                  {price.usd}
                </div>
              )}
            </>
          ) : (
            <div className="whitespace-nowrap text-sm text-muted">به‌زودی</div>
          )}
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
  usdRate,
}: {
  specialistId: string;
  hasSlots: boolean;
  nearestSlotLabel: string | null;
  services: MentorService[];
  /**
   * Toman per dollar, as the daily job last recorded it. Null when it has
   * never run — the card then shows toman alone rather than inventing a
   * dollar figure from a guess.
   */
  usdRate: number | null;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="p-5">
          <div
            role="tablist"
            aria-label="راه‌های کار با این کارشناس"
            className="flex items-stretch gap-1 rounded-2xl border border-card-border p-1"
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
                  className={`flex-1 rounded-2xl px-2 py-2 text-xs font-medium leading-5 transition ${
                    selected
                      ? "bg-brand text-brand-on"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <span className="block">{tab.label}</span>
                  {tab.note && (
                    <span className="block text-[11px] opacity-80">
                      {tab.note}
                    </span>
                  )}
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
                  <span className="text-2xl font-bold text-brand-deep">
                    رایگان
                  </span>
                  <span className="text-sm text-muted">
                    / {fa(FREE_CALL.minutes)} دقیقه
                  </span>
                </div>

                <ul className="mt-4 flex flex-col gap-2.5">
                  <Included n={1} title="بگو دنبال چه هستی" />
                  <Included
                    n={2}
                    title={`${fa(FREE_CALL.minutes)} دقیقه گفت‌وگوی ویدیویی`}
                  />
                </ul>
              </>
            )}

            {active === "sessions" && (
              <>
                {sessions.length === 0 && (
                  <p className="text-sm text-muted">
                    این کارشناس هنوز جلسه‌ی تخصصی نگذاشته.
                  </p>
                )}

                <ul className="flex flex-col">
                  {sessions.map((service) => (
                    <ServiceRow
                      key={service.id}
                      title={serviceTitle(service)}
                      description={serviceDescription(service)}
                      meta={formatDuration(service)}
                      price={servicePrice(service, usdRate)}
                    />
                  ))}
                </ul>
              </>
            )}

            {active === "projects" && (
              <>
                {projectRate ? (
                  <>
                    {(() => {
                      const hourly = servicePrice(projectRate, usdRate);
                      if (projectRate.is_negotiable || !hourly) {
                        return (
                          <div className="text-lg font-bold">
                            {projectRate.is_negotiable
                              ? "قابل مذاکره"
                              : "به‌زودی"}
                          </div>
                        );
                      }
                      return (
                        <div>
                          <div className="text-lg font-bold leading-7">
                            {hourly.toman}
                          </div>
                          {hourly.usd && (
                            <div className="mt-0.5 text-xs text-muted">
                              {hourly.usd}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <p className="mt-2 text-sm leading-6 text-muted">
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
              className="block rounded-full bg-booking px-5 py-3 text-center text-sm font-semibold text-booking-on transition hover:bg-booking-hover"
            >
              رزرو گفت‌وگو
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
      <div className="rounded-2xl border border-card-border bg-card shadow-sm p-5">
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

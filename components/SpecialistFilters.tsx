"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/**
 * The browse page's filters.
 *
 * Written as a list of groups rather than one hard-coded control, because
 * there is exactly one group today and there will be more: the taxonomy of
 * fields and topics is not settled yet, and when it is, it arrives here as
 * another entry in the array the page passes in — no change to this file.
 *
 * The current selection comes from the page rather than from useSearchParams:
 * the page has already read it to do the filtering, and reading it twice is
 * how the two drift apart. It also keeps this component out of the Suspense
 * rules that hook carries.
 */
export type FilterOption = {
  value: string;
  label: string;
};

export type FilterGroup = {
  /** The query parameter this group writes to. */
  key: string;
  title: string;
  options: FilterOption[];
};

/** How many options an open group shows before «نمایش بیشتر». */
const VISIBLE = 6;

export default function SpecialistFilters({
  groups,
  selected,
  query,
}: {
  groups: FilterGroup[];
  /** Ticked values, by group key. */
  selected: Record<string, string[]>;
  /** The search box's current text, kept when a filter changes. */
  query: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [open, setOpen] = useState(false);

  // Each group starts shut, and opens if something in it is already ticked —
  // a filter doing work behind a closed door is a filter nobody can undo.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () =>
      new Set(groups.filter((g) => selected[g.key]?.length).map((g) => g.key)),
  );

  // Six, then the rest behind a link. Except when what is ticked sits past the
  // sixth: hiding a live filter is the same trap as the closed door above.
  const [shownInFull, setShownInFull] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .filter((g) =>
            g.options
              .slice(VISIBLE)
              .some((o) => (selected[g.key] ?? []).includes(o.value)),
          )
          .map((g) => g.key),
      ),
  );

  const activeCount = groups.reduce(
    (sum, group) => sum + (selected[group.key]?.length ?? 0),
    0,
  );

  function flip(set: Set<string>, key: string): Set<string> {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  function toggle(groupKey: string, value: string, checked: boolean) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);

    for (const group of groups) {
      const current = new Set(selected[group.key] ?? []);
      if (group.key === groupKey) {
        if (checked) current.add(value);
        else current.delete(value);
      }
      for (const item of current) params.append(group.key, item);
    }

    const search = params.toString();
    router.push(search ? `/specialists?${search}` : "/specialists", {
      scroll: false,
    });
  }

  function clearAll() {
    router.push(
      query ? `/specialists?q=${encodeURIComponent(query)}` : "/specialists",
      {
        scroll: false,
      },
    );
  }

  // The panel is rendered twice — once for the drawer, once for the sidebar —
  // and only one is ever on screen. They still share a document, so the ids
  // have to differ or every label points at whichever input came first, which
  // is the hidden one half the time.
  function panelFor(scope: string) {
    return (
      // A box per group, not one box with headings in it. Two lists sharing a
      // card read as one long list whose middle happens to be bold.
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.key);
          const full = shownInFull.has(group.key);
          const options = full
            ? group.options
            : group.options.slice(0, VISIBLE);
          const spare = group.options.length - options.length;
          const panelId = `${scope}-${group.key}-panel`;

          return (
            <fieldset
              key={group.key}
              className="rounded-2xl border border-card-border bg-card px-5 py-4"
            >
              <legend className="sr-only">{group.title}</legend>
              <button
                type="button"
                onClick={() => setOpenGroups((was) => flip(was, group.key))}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-2 text-sm font-bold"
              >
                <span className="flex items-center gap-2">
                  {group.title}
                  {(selected[group.key]?.length ?? 0) > 0 && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand"
                      aria-hidden
                    />
                  )}
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div
                id={panelId}
                hidden={!isOpen}
                className="mt-3 flex flex-col gap-1"
              >
                {options.map((option) => {
                  const checked = (selected[group.key] ?? []).includes(
                    option.value,
                  );
                  const id = `${scope}-${group.key}-${option.value}`;
                  return (
                    <label
                      key={option.value}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition hover:bg-brand-light/50"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        name={group.key}
                        value={option.value}
                        checked={checked}
                        onChange={(event) =>
                          toggle(group.key, option.value, event.target.checked)
                        }
                        className="peer sr-only"
                      />
                      {/* Drawn rather than native: a native checkbox keeps the
                      browser's blue however the rest of the page is coloured. */}
                      <span
                        aria-hidden
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-deep ${
                          checked
                            ? "border-brand bg-brand text-brand-on"
                            : "border-card-border bg-card"
                        }`}
                      >
                        {checked && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={
                          checked ? "font-medium text-brand-deep" : "text-muted"
                        }
                      >
                        {option.label}
                      </span>
                    </label>
                  );
                })}

                {(spare > 0 || full) && group.options.length > VISIBLE && (
                  <button
                    type="button"
                    onClick={() =>
                      setShownInFull((was) => flip(was, group.key))
                    }
                    className="mt-1 self-start px-2 text-sm font-medium text-brand-deep underline underline-offset-4 hover:no-underline"
                  >
                    {full ? "نمایش کمتر" : "نمایش بیشتر"}
                  </button>
                )}
              </div>
            </fieldset>
          );
        })}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="self-start text-sm text-brand-deep underline underline-offset-4 hover:no-underline"
          >
            پاک کردن فیلترها
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Phones get a button and a panel that unfolds under it. A sidebar at
          this width would push the results themselves off the first screen. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-2xl border border-card-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand"
        >
          <span className="flex items-center gap-2">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 text-brand-deep"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            فیلترها
            {activeCount > 0 && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand-deep">
                {activeCount.toLocaleString("fa-IR")}
              </span>
            )}
          </span>
        </button>

        {open && <div className="mt-3">{panelFor(`${uid}-drawer`)}</div>}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6">{panelFor(`${uid}-side`)}</div>
      </aside>
    </>
  );
}

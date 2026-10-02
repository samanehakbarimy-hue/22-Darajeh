"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The header's links, folded behind one button on a phone.
 *
 * The header was a single row at every width. That held for a signed-out
 * visitor on a laptop and for nobody on a phone: a specialist has five links,
 * a name and a way out, and seven things do not fit in 375 pixels — they
 * wrapped onto two lines and ran into the wordmark. The first outside tester
 * said the site did not look good on mobile, and this was what she was
 * looking at on every page.
 *
 * Only the open/closed state lives here. What is inside the panel is rendered
 * by the server component that owns the links, and arrives as children.
 */
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  // Remembered as "open on this page" rather than plain open/closed. The
  // header outlives a page change, so a boolean would leave the menu covering
  // the page the person just asked for; this way arriving somewhere else
  // closes it with no effect to run and nothing to reset.
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "بستن منو" : "باز کردن منو"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="-me-2 flex h-11 w-11 items-center justify-center rounded-lg text-header-foreground hover:bg-white/10"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {/* Both shapes stay in the tree and one is hidden, rather than
              swapping elements: a browser translator that has rewritten the
              page cannot then trip React up when the icon changes. */}
          <g className={open ? "hidden" : ""}>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </g>
          <g className={open ? "" : "hidden"}>
            <path d="M6 6l12 12M18 6L6 18" />
          </g>
        </svg>
      </button>

      <div
        id="mobile-menu"
        hidden={!open}
        // A link to the page already open changes no pathname, so the effect
        // above would never fire for it.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="absolute inset-x-0 top-full z-50 border-b border-header-border bg-header px-6 pb-4 shadow-lg"
      >
        {children}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SPECIALIST_ROLES } from "@/lib/specialist-roles";

const TYPE_MS = 90;
const ERASE_MS = 45;
const HOLD_MS = 1500;
const BETWEEN_MS = 350;

/**
 * «کارشناس» stays put and the field types itself in beside it, holds, erases,
 * and the next one follows — in the order the list is written, looping from
 * the top after the last.
 *
 * The width never moves. Every field is rendered invisibly stacked in the same
 * grid cell as the live one, so the box is always as wide as the longest
 * entry and a short field leaves empty space rather than dragging the line
 * around. Sizing it from the real rendered text rather than a character count
 * matters here: "DevOps" and "طراحی UI/UX" mix scripts, and their widths have
 * nothing to do with how many characters they have.
 *
 * Decorative, so the whole thing is hidden from screen readers and a plain
 * sentence is left in its place. Somebody listening wants to know what the
 * site does, not to sit through seventeen fields being spelled out and
 * deleted.
 */
export default function TypingRoles() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [erasing, setErasing] = useState(false);
  // Assume motion is fine until the browser says otherwise; this only runs on
  // the client, and the server has no opinion to render.
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!animate) return;

    const letters = Array.from(SPECIALIST_ROLES[index]);

    // Still typing.
    if (!erasing && shown < letters.length) {
      const t = setTimeout(() => setShown(shown + 1), TYPE_MS);
      return () => clearTimeout(t);
    }
    // Fully typed: hold it long enough to be read.
    if (!erasing && shown === letters.length) {
      const t = setTimeout(() => setErasing(true), HOLD_MS);
      return () => clearTimeout(t);
    }
    // Rubbing it out, faster than it went on.
    if (erasing && shown > 0) {
      const t = setTimeout(() => setShown(shown - 1), ERASE_MS);
      return () => clearTimeout(t);
    }
    // Empty: a beat, then the next one round.
    const t = setTimeout(() => {
      setErasing(false);
      setIndex((i) => (i + 1) % SPECIALIST_ROLES.length);
    }, BETWEEN_MS);
    return () => clearTimeout(t);
  }, [animate, index, shown, erasing]);

  const text = animate
    ? Array.from(SPECIALIST_ROLES[index]).slice(0, shown).join("")
    : SPECIALIST_ROLES[0];

  return (
    <p className="text-center text-lg leading-8 sm:text-xl">
      <span aria-hidden className="inline-flex items-baseline gap-2">
        <span className="text-muted">کارشناس</span>

        {/* text-start, not the inherited centre: the box is as wide as the
            longest field, so centring inside it would float a short one away
            from «کارشناس» and leave a gap that changes with every word. Held
            to the start, the reserved space all falls after the text. */}
        <span className="inline-grid text-start">
          {/* Each sizer carries the caret too. Without it the live cell is
              text-plus-caret while the sizers are text alone, so the box grew
              by the caret's width at the moment the longest field finished
              typing -- six pixels, once every seventeen words, which is
              exactly the kind of twitch this whole arrangement exists to
              prevent. */}
          {SPECIALIST_ROLES.map((role, i) => (
            <span
              key={`${role}-${i}`}
              className="invisible col-start-1 row-start-1 whitespace-nowrap font-bold"
            >
              {role}
              <span className="typing-caret" />
            </span>
          ))}

          <span className="col-start-1 row-start-1 whitespace-nowrap font-bold text-brand-deep">
            {text}
            <span className="typing-caret" />
          </span>
        </span>
      </span>

      <span className="sr-only">
        کارشناس‌هایی در حوزه‌هایی مثل {SPECIALIST_ROLES.join("، ")}.
      </span>
    </p>
  );
}

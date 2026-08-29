"use client";

import { useEffect, useState } from "react";
import { SPECIALIST_ROLES } from "@/lib/specialist-roles";

const TYPE_MS = 90;
const ERASE_MS = 45;
const HOLD_MS = 1500;
const BETWEEN_MS = 350;

/**
 * «کارشناس» and the field that types itself in beside it, held together as one
 * phrase and centred as one phrase — in the order the list is written, looping
 * from the top after the last.
 *
 * The wrapper is shrink-to-fit and the centring is on its parent, so the pair
 * is measured together and «کارشناس» slides along with the field rather than
 * standing still while the text grows away from it. Nothing here is positioned
 * or given a width: both halves sit in normal flow and the line is only ever
 * as wide as what is currently in it.
 *
 * That means the phrase moves as it types, which is the deliberate trade. An
 * earlier version pinned the field's box to the width of the longest entry so
 * nothing ever shifted, and the cost was that the pair sat off-centre by
 * however much the current word fell short. Centred and moving was the answer
 * wanted; if it ever reads as restless, that older approach is the other end
 * of the same choice.
 *
 * Decorative, so the whole thing is hidden from screen readers and a plain
 * sentence is left in its place. Somebody listening wants to know what the
 * site does, not to sit through sixteen fields being spelled out and deleted.
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
    <p className="flex justify-center text-lg leading-8 sm:text-xl">
      {/* One wrapper, shrink-to-fit, centred by the parent. The two halves are
          flex items in normal flow, so the pair is measured and centred as a
          single phrase. */}
      <span
        aria-hidden
        className="inline-flex w-fit items-baseline gap-2 whitespace-nowrap"
      >
        <span className="text-muted">کارشناس</span>

        <span className="font-bold text-brand-deep">
          {text}
          <span className="typing-caret" />
        </span>
      </span>

      {/* sr-only is positioned out of flow, so it cannot pull the centring
          off. It is here rather than beside the animation for that reason. */}
      <span className="sr-only">
        کارشناس‌هایی در حوزه‌هایی مثل {SPECIALIST_ROLES.join("، ")}.
      </span>
    </p>
  );
}

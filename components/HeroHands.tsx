"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Module scope, not state: the entry should survive a client-side navigation
// back to the home page. It stays false on the server, where the effect never
// runs, so it can never leak between requests.
let hasEntered = false;

/**
 * The landing page's one piece of motion: two hands reach in from the edges of
 * the screen and meet. From then on the reader drives them — scrolling down
 * draws them apart, scrolling back up brings them together again.
 *
 * Decorative only. It renders behind the hero, never intercepts a click, and
 * whether it moves at all is decided in CSS, so prefers-reduced-motion is
 * honoured without the server having to guess.
 */
export default function HeroHands() {
  // Decided during the first render rather than in an effect, so there is no
  // second render and nothing flashes.
  const [entering] = useState(() => !hasEntered);

  useEffect(() => {
    hasEntered = true;
  }, []);

  return (
    <div
      aria-hidden
      className={`hero-hands${entering ? " hero-hands--entering" : ""}`}
    >
      {/* Two halves of one photograph, keyed off its white background and put
          back in their original places in the frame.

          Each hand is wrapped: the wrapper carries the one-time arrival, the
          image inside carries the scroll. Two transforms on two elements, so
          neither has to know about the other.

          Unoptimized on purpose. These already ship as tuned WebP with an
          alpha channel, and the optimizer saves 712 bytes on them while
          serving JPEG -- alpha flattened, hands rendered as solid blocks --
          to any client that does not advertise WebP. */}
      <span className="hero-hands__place hero-hands__place--seeker">
        <Image
          src="/hero-hand-seeker.webp"
          alt=""
          width={860}
          height={380}
          loading="eager"
          unoptimized
          className="hero-hands__hand hero-hands__hand--seeker"
        />
      </span>

      <span className="hero-hands__place hero-hands__place--specialist">
        <Image
          src="/hero-hand-specialist.webp"
          alt=""
          width={852}
          height={520}
          loading="eager"
          unoptimized
          className="hero-hands__hand hero-hands__hand--specialist"
        />
      </span>
    </div>
  );
}

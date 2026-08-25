"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Module scope, not state: the intro should survive a client-side navigation
// back to the home page. A greeting replayed every time someone taps the logo
// stops being a greeting. It stays false on the server, where the effect never
// runs, so it can never leak between requests.
let hasPlayed = false;

/**
 * The landing page's one piece of motion: two hands reach in from the edges of
 * the screen, the light between them catches, and they withdraw. Everything
 * else on the site stays still.
 *
 * Decorative only — it renders behind the hero, never intercepts a click, and
 * ends at opacity 0. Whether it runs at all is decided in CSS, so that
 * prefers-reduced-motion is honoured without the server having to guess.
 */
export default function HeroHands() {
  // Decided during the first render rather than in an effect, so there is no
  // second render and nothing flashes.
  const [show] = useState(() => !hasPlayed);

  useEffect(() => {
    hasPlayed = true;
  }, []);

  if (!show) return null;

  return (
    <div aria-hidden className="hero-hands">
      <span className="hero-hands__glow" />
      {/* Two halves of one photograph, keyed off its white background and put
          back in their original places in the frame.

          Unoptimized on purpose. These already ship as tuned WebP with an
          alpha channel, and the optimizer saves 712 bytes on them while
          serving JPEG -- alpha flattened, hands rendered as solid blocks --
          to any client that does not advertise WebP.

          Eager, not priority: they should not wait for a lazy-load pass, but
          neither should they hold up the headline on a slow connection. */}
      <Image
        src="/hero-hand-seeker.webp"
        alt=""
        width={860}
        height={380}
        loading="eager"
        unoptimized
        className="hero-hands__seeker"
      />
      <Image
        src="/hero-hand-specialist.webp"
        alt=""
        width={852}
        height={520}
        loading="eager"
        unoptimized
        className="hero-hands__specialist"
      />
    </div>
  );
}

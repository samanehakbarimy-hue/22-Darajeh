/**
 * The hero image.
 *
 * Drawn rather than photographed: the project has no licensed Damavand or
 * Azadi photograph, and a stock stand-in would date the page badly. This
 * carries the brief's idea instead — a sunrise, a fresh angle — as a peak
 * with the sun coming up beside it and one thin arc opening off the summit.
 *
 * The arc spans 22 degrees, which is where the name comes from, but nothing
 * here spells that out; the mark in the header already does.
 *
 * Geometry note: the peak is a closed path, so its fill reaches down to its
 * own baseline. Anything meant to show through has to sit clear of that
 * footprint, not merely below the visible slope — which is why the mountain
 * is left of centre and the sun has open sky to its right.
 *
 * To use a real photograph later, swap the <svg> for next/image and keep the
 * framing element around it.
 */
export default function HeroVisual() {
  return (
    <div
      aria-hidden
      className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-card-border bg-card"
    >
      <svg
        viewBox="0 0 480 384"
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
        role="presentation"
      >
        <defs>
          {/* Sky: the ink ground, warming only as it nears the horizon. */}
          <linearGradient id="hv-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e1717" />
            <stop offset="58%" stopColor="#16211f" />
            <stop offset="100%" stopColor="#26201e" />
          </linearGradient>
          <radialGradient id="hv-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6657" stopOpacity="0.40" />
            <stop offset="55%" stopColor="#ff6657" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#ff6657" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hv-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffc0b3" />
            <stop offset="100%" stopColor="#ff6657" />
          </linearGradient>
          {/* The peak, lit warm down the side the sun is on. */}
          <linearGradient id="hv-peak" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b2f2c" />
            <stop offset="55%" stopColor="#1e2b28" />
            <stop offset="100%" stopColor="#182422" />
          </linearGradient>
        </defs>

        <rect width="480" height="384" fill="url(#hv-sky)" />

        {/* Sun and halo, low and clear of the mountain. */}
        <ellipse cx="368" cy="316" rx="250" ry="160" fill="url(#hv-halo)" />
        <circle cx="368" cy="316" r="44" fill="url(#hv-sun)" />

        {/* Horizon: brightest under the sun, gone by either edge. */}
        <rect x="0" y="315" width="480" height="1.2" fill="url(#hv-halo)" />

        {/* Peak. Concave slopes so it reads as a volcano, not a triangle. */}
        <path
          d="M-32 300 C38 292 78 250 124 176 C134 160 142 152 150 152 C158 152 166 160 176 176 C220 250 262 294 330 300 Z"
          fill="url(#hv-peak)"
        />
        {/* Snow, catching the light. */}
        <path
          d="M131 172 C138 162 143 157 150 157 C157 157 162 162 169 172 C162 168 156 174 150 174 C144 174 138 168 131 172 Z"
          fill="#f5f1ea"
          opacity="0.72"
        />

        {/* Near ridge, darker, setting the peak back and cropping the sun. */}
        <path
          d="M0 384 L0 322 C70 306 130 326 200 334 C270 342 340 330 480 312 L480 384 Z"
          fill="#111b1a"
        />

        {/* The angle: 22 degrees off the summit, with the arc between. */}
        <g fill="none" stroke="#ff6657" strokeLinecap="round">
          <path d="M150 152 L150 44" strokeWidth="1.1" opacity="0.32" />
          <path d="M150 152 L190 51" strokeWidth="1.1" opacity="0.32" />
          <path d="M150 74 A78 78 0 0 1 179 80" strokeWidth="1.6" opacity="0.68" />
        </g>
        <circle cx="150" cy="44" r="2.8" fill="#ff6657" opacity="0.9" />
      </svg>
    </div>
  );
}

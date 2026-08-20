import Link from "next/link";

/**
 * The mark: white "22°" on the brand red square.
 *
 * Drawn rather than loaded so it stays sharp at every size and costs no
 * request. The degree is a bordered circle, not the "°" character, which
 * different fonts place at wildly different heights and sizes — at navbar
 * scale the glyph collapsed into a smudge.
 *
 * The numerals use the page font, close to but not identical to the original
 * artwork; swapping in a real file later means replacing this body only.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const ring = size * 0.165;

  return (
    <span
      aria-hidden
      dir="ltr"
      className="inline-flex shrink-0 items-center justify-center rounded-[22%] bg-logo-red font-bold text-white"
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.46, lineHeight: 1 }}>22</span>
      <span
        className="rounded-full border-white"
        style={{
          width: ring,
          height: ring,
          borderWidth: Math.max(1.5, size * 0.055),
          // Lifts the ring to sit against the cap height of the numerals.
          marginTop: -(size * 0.2),
          marginLeft: size * 0.035,
        }}
      />
    </span>
  );
}

/** The mark plus the name, as used in the navbar. */
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-lg font-bold">۲۲ درجه</span>
    </Link>
  );
}

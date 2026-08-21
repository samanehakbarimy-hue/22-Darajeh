import Image from "next/image";
import Link from "next/link";
import wordmark from "@/public/logo-wordmark.png";

// Content box of the marks in the source artwork, so callers pass one number
// and the proportions stay the artwork's.
const ASPECT = 721 / 599;

/**
 * The mark: "22" in cream with a coral degree.
 *
 * Recoloured from the logo file rather than set in a web font. The numerals
 * are a custom geometric face — heavier than anything on the page, filling
 * their box edge to edge with the digits interlocking — so typing "22" would
 * not have matched. The red tile was lifted off by treating the artwork's
 * green channel as an alpha mask, and the degree ring, which is its own
 * connected shape, was tinted separately.
 *
 * The tile version still lives at public/logo-mark.png for anywhere a solid
 * badge is wanted.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <Image
      src={wordmark}
      alt=""
      aria-hidden
      width={Math.round(size * ASPECT)}
      height={size}
      priority
      className="shrink-0"
    />
  );
}

/** The mark plus the name, as used in the header. */
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <LogoMark size={size} />
      {/* The mark already says "22", so the word alone completes the name. */}
      <span className="text-lg font-bold">درجه</span>
    </Link>
  );
}

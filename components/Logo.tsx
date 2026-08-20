import Image from "next/image";
import Link from "next/link";
import mark from "@/public/logo-mark.png";

// The artwork's tile is 830x796 — very close to square, but not square. Held
// here so callers pass one number and still get the true proportions.
const ASPECT = 830 / 796;

/**
 * The mark, from the logo artwork itself.
 *
 * An earlier version drew this in CSS — a rounded square with "22" set in the
 * page font and a bordered circle for the degree. It was not the logo: the
 * real tile has square corners, and its numerals are a custom geometric face,
 * far heavier than any web font, sized to fill the tile edge to edge with the
 * two digits interlocking. That is not reproducible in CSS, so use the file.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src={mark}
      alt=""
      aria-hidden
      width={Math.round(size * ASPECT)}
      height={size}
      priority
      className="shrink-0"
    />
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

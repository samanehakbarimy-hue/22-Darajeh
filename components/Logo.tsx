import Image from "next/image";
import Link from "next/link";
import mark from "@/public/logo-22.webp";

/**
 * The mark: "22" in white on the brand red, square and edge to edge.
 *
 * It is the brand's own artwork rather than anything reconstructed in CSS,
 * and it carries its own ground, which is why it only ever sits on the dark
 * chrome -- a red tile on the white page would be shouting.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <Image
      src={mark}
      alt=""
      aria-hidden
      width={size}
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

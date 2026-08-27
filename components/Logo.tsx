import Link from "next/link";
import Image from "next/image";
import mark from "@/public/logo-mark.png";

/**
 * The mark and the name.
 *
 * The mark is a tree whose trunk is a necktie — growth and work in one shape.
 * It is drawn in black and deep green on ivory, which is why it arrives here
 * on its own ivory tile: the header is the one dark surface on the site, and
 * a black trunk on near-black ink would simply not be there.
 *
 * It is detailed for its size. Two dozen separate leaves do not survive a
 * 16px favicon, and no amount of scaling fixes that — it would want a
 * simplified mark for the small sizes, which is a separate piece of work.
 */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src={mark}
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="rounded-lg"
        priority
      />
      <span className="text-lg font-bold">جاب‌آموز</span>
    </Link>
  );
}

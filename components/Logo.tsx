import Link from "next/link";

/**
 * The name, set as type.
 *
 * There was a mark: "22" in white on the brand red, which the header put
 * beside the word «درجه» so the two together read as the name. That trick
 * cannot survive a rename — the artwork says 22 and the name no longer does —
 * so until there is a new mark, the wordmark is the whole logo. Type on its
 * own is a respectable answer to that, and better than a tile spelling the
 * old brand.
 */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-lg font-bold">جاب‌آموز</span>
    </Link>
  );
}

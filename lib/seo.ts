/**
 * The few things every page says about itself to a search engine.
 *
 * None of this decides whether the site is indexed — that is ALLOW_INDEXING,
 * read in app/layout.tsx and app/robots.ts. This is what a crawler finds once
 * it is let in.
 */

/**
 * A description short enough to be shown whole.
 *
 * Search results cut a description at roughly 155 characters, mid-word and
 * without warning. Cutting it here, at a word boundary with an ellipsis, is
 * the difference between a sentence and a sentence that stops.
 */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Structured data, safe to put inside a <script> tag.
 *
 * The content comes from what people typed into their profiles. JSON.stringify
 * will happily emit "</script>" inside a string, and the browser's HTML parser
 * reads that as the end of the tag, with whatever follows running as markup.
 * Escaping "<" as < keeps it valid JSON and inert HTML.
 */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

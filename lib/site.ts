/**
 * Where this site lives, in one place.
 *
 * The address was written out by hand in five files, and when the domain
 * changed each one was a separate chance to miss it — one of them, the
 * sitemap line in robots.txt, would have gone on naming the old domain until
 * somebody happened to read it.
 *
 * The environment variable is the real answer; the literal here is the
 * fallback for a machine that has not been told, and there is now exactly one
 * of those to update.
 */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobamooz.com";
}

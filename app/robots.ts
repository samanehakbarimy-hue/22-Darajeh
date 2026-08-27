import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Crawlers are allowed in even while the site is private — deliberately.
 *
 * A crawler that is turned away at robots.txt never reads the noindex tag on
 * the page, so anything Google already has stays in its results, snippetless
 * and indefinite. Letting it crawl is what gets the old listing dropped: it
 * arrives, is handed the same "به‌زودی" holding page as any other stranger by
 * the proxy, reads noindex, and forgets the URL.
 *
 * Nothing is risked by the visit. The proxy decides what anyone sees, signed
 * in or not, and a crawler is just another visitor without a session.
 */
export default function robots(): MetadataRoute.Robots {
  // Crawling is always allowed, for the reason above. What changes is whether
  // there is a sitemap inviting them to index -- that follows ALLOW_INDEXING,
  // the same switch the noindex tag reads, so the two can never disagree.
  const allowIndexing = process.env.ALLOW_INDEXING === "true";

  return allowIndexing
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${siteUrl()}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", allow: "/" } };
}

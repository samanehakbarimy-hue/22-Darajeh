import type { MetadataRoute } from "next";

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
  const isPrivate = process.env.SITE_PRIVATE === "true";

  return isPrivate
    ? { rules: { userAgent: "*", allow: "/" } }
    : {
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://22darajeh.com/sitemap.xml",
      };
}

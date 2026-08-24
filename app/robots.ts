import type { MetadataRoute } from "next";

/**
 * While the site is private, tell every crawler to stay away.
 *
 * This is a request, not a wall — well-behaved crawlers honour it and the rest
 * ignore it, which is why the middleware also stands in front of the pages.
 * Flip SITE_PRIVATE off at launch and this opens up on the next deploy.
 */
export default function robots(): MetadataRoute.Robots {
  const isPrivate = process.env.SITE_PRIVATE === "true";

  return isPrivate
    ? { rules: { userAgent: "*", disallow: "/" } }
    : {
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://22darajeh.com/sitemap.xml",
      };
}

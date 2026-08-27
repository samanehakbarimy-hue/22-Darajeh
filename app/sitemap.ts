import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

/**
 * The pages worth indexing, once indexing is allowed at all.
 *
 * robots.txt has advertised a sitemap since the day it was written, and there
 * has never been one — the URL it named returned a 404. That went unnoticed
 * because the line only appears when ALLOW_INDEXING is on, which it has never
 * been, so the first person to notice would have been Google on the day the
 * site opened.
 *
 * Specialist profiles are the point of the site, so they are listed
 * individually. Only approved ones: the rest are not readable by a signed-out
 * crawler anyway, and inviting it to a 404 helps nobody.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticPages = [
    "",
    "/specialists",
    "/signup/mentor",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mentor_profiles")
      .select("id")
      .eq("status", "approved");

    return [
      ...staticPages,
      ...(data ?? []).map((row) => ({
        url: `${base}/specialists/${row.id as string}`,
        lastModified: new Date(),
      })),
    ];
  } catch {
    // A sitemap missing its profiles is worth more than a sitemap that fails
    // to build because the database was briefly unreachable.
    return staticPages;
  }
}

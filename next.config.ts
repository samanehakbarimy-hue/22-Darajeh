import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1mb, too small for a real profile photo upload.
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        // Next serves everything in public/ as `max-age=0, must-revalidate`,
        // because it cannot fingerprint names it did not choose. That is safe
        // and, on a slow link, expensive: a returning reader asks the server
        // about every one of these before the page can paint, and is told
        // each time that nothing has changed. Round trips, not bytes, are
        // what that costs -- and round trips are exactly what hurts a
        // connection that is already struggling.
        //
        // A day of trust, then a week of serving the old copy while fetching
        // the new one in the background. The price is that replacing one of
        // these files in place takes up to a day to reach somebody who has
        // already been here. Rename the file to skip the wait.
        //
        // Files under _next/static are not affected and do not need to be:
        // their names contain a hash, so Next already marks them immutable
        // and refuses to let this override it.
        source:
          "/:file(hero-hand-seeker\\.webp|hero-hand-specialist\\.webp|logo-mark\\.png|elder-icon\\.png|icon\\.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async redirects() {
    // Everything funnels to the bare jobamooz.com. www of either name, and the
    // whole of the old 22darajeh.com, land on the matching path here with a
    // 308 — a real reader following an old bookmark or an old business card
    // arrives where they meant to, and a search engine folds the old address
    // into this one. Both 22darajeh.com and its www must stay attached to this
    // project in Vercel or these rules never see the request.
    const toCanonical = (host: string) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://jobamooz.com/:path*",
      permanent: true,
    });

    return [
      toCanonical("www.jobamooz.com"),
      toCanonical("22darajeh.com"),
      toCanonical("www.22darajeh.com"),
    ];
  },
};

export default nextConfig;

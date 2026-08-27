import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1mb, too small for a real profile photo upload.
      bodySizeLimit: "5mb",
    },
  },
  async redirects() {
    return [
      // One canonical address per domain: www goes to the bare name.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.jobamooz.com" }],
        destination: "https://jobamooz.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.22darajeh.com" }],
        destination: "https://22darajeh.com/:path*",
        permanent: true,
      },
      // The old name still answers, and sends everyone to the new one. Safe to
      // turn on now: Supabase's allowed redirects list both domains, and
      // LinkedIn never sees ours at all — its only redirect URL is Supabase's
      // own callback, so the rename was never its business.
      {
        source: "/:path*",
        has: [{ type: "host", value: "22darajeh.com" }],
        destination: "https://jobamooz.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

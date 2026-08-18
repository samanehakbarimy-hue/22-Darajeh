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
      // Keep one canonical address: send www.22darajeh.com to the bare domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.22darajeh.com" }],
        destination: "https://22darajeh.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

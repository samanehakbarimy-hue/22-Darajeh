import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1mb, too small for a real profile photo upload.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;

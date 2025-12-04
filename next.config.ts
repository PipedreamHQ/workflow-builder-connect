import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable symlinks for local package development
    externalDir: true,
  },
  transpilePackages: ["@pipedream/connect-react"],
  serverExternalPackages: ["@slack/web-api"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.pipedream.net",
      },
      {
        protocol: "https",
        hostname: "pipedream.com",
      },
    ],
  },
  webpack: (config) => {
    // Resolve symlinks to their real paths
    config.resolve.symlinks = true;
    return config;
  },
};

export default withWorkflow(nextConfig);

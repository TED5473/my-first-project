import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default config;

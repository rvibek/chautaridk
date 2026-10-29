import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R0 serves fresh newsroom data on every request. Caching/ISR is tuned in R1.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

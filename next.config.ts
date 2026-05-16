import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["@ionic/react", "@ionic/core"],
  ...(process.env.CAPACITOR_BUILD === "true"
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@ionic/core/components": path.resolve(
        __dirname,
        "node_modules/@ionic/core/components"
      ),
    };
    return config;
  },
};

export default nextConfig;

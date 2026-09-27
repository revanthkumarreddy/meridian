import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const pages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(pages ? { output: "export" as const } : {}),
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

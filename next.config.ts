import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image runs .next/standalone (nextjs-docker); its build sets BUILD_STANDALONE=true.
  // Local `pnpm start` uses the normal output, which `next start` requires.
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  experimental: {
    authInterrupts: true, // forbidden() in group layouts (FE-AUTH-004)
  },
};

export default nextConfig;

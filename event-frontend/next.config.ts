import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

    output: 'standalone', // Recommended for Vercel deployments
  // If using TypeScript
  typescript: {
    ignoreBuildErrors: false, // Set to true temporarily if needed
  },

};

export default nextConfig;

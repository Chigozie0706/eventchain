/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    pnpm: true,
    serverComponentsExternalPackages: [
      '@selfxyz/core',
      // Add other required packages here
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // App Router is automatically enabled in Next.js 13+
};

module.exports = nextConfig;
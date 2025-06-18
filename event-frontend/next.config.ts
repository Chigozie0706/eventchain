import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        { 
          key: 'Access-Control-Allow-Origin',
          value: 'https://e4cd-102-88-115-145.ngrok-free.app/' 
        },
        { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' }
      ]
    }];
  },
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  
};

export default nextConfig;

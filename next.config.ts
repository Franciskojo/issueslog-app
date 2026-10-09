import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow local dev origins
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [],
  },
  // Allow serving uploaded files from /public/uploads
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

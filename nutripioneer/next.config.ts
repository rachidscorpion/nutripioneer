import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    qualities: [100, 75, 50, 25],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

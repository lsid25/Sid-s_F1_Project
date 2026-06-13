import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is enabled via --turbopack flag in dev script (Next.js 15+)

  // API proxy to avoid CORS issues in development
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },

  // Allow external image domains (for driver headshots from F1 CDN)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.formula1.com",
        pathname: "/content/dam/**",
      },
      {
        protocol: "https",
        hostname: "media.formula1.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pass request paths to the backend proxy untouched. Without this, Next.js
  // strips/adds trailing slashes (e.g. 308 redirect /api/v1/courses/ -> /api/v1/courses),
  // which then triggers a FastAPI redirect that leaks the internal Docker host
  // (backend:8000) to the browser. The frontend already calls each endpoint with
  // the exact slash FastAPI expects, so passing paths through verbatim avoids all redirects.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://backend:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

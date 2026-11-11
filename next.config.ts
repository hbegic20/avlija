import type { NextConfig } from "next";
import { isIndexingAllowed } from "./src/lib/seo/indexing";

const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()",
  },
];

const indexingHeaders = isIndexingAllowed ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const thirtyOneDaysInSeconds = 60 * 60 * 24 * 31;

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders, ...indexingHeaders] }];
  },
  partialPrefetching: true,
  images: {
    minimumCacheTTL: thirtyOneDaysInSeconds,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

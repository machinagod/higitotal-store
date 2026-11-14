const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this app so Next doesn't warn about inferring
  // the workspace root from sibling lockfiles outside the repo.
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Rewrite barrel imports (`import { Text } from "@medusajs/ui"`) to the
    // modules actually used. @medusajs/ui's components are "use client", so a
    // server component importing from its barrel otherwise ships the WHOLE
    // kit (radix, cmdk, calendar, date picker, prism…) to every page.
    optimizePackageImports: ["@medusajs/ui", "@medusajs/icons", "lucide-react", "radix-ui"],
  },
  // `public/` files are not content-hashed, so Next serves them with
  // `max-age=0` (and Cloudflare then applies its 4 h default). Brand logos,
  // Higitotal logos/icons and favicons change very rarely: cache them for 30
  // days, revalidating in the background for a day after that. Never
  // `immutable` — a replaced file keeps its URL. (`/_next/static` is hashed
  // and already immutable; fonts are bundled there via next/font.)
  async headers() {
    const longCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=2592000, stale-while-revalidate=86400",
      },
    ]
    return [
      "/brands/:path*",
      "/higitotal/:path*",
      "/favicon.ico",
      "/apple-touch-icon.png",
    ].map((source) => ({ source, headers: longCache }))
  },
  images: {
    // Next/image optimization is ON: the runner (`next start`) resizes source
    // images and serves modern formats via /_next/image, backed by `sharp`
    // (pinned as a prod dependency so it survives `pnpm prune --prod`).
    // WebP only — AVIF's encode cost isn't worth it given Railway's image cache
    // is ephemeral (re-optimizes after each redeploy/restart).
    formats: ["image/webp"],
    // Allowed `quality` values (Next 15.5 gates these): 50 = product thumbnails,
    // 75 = the default used everywhere else (e.g. the PDP gallery).
    qualities: [50, 75],
    // Product imagery is stable and content-addressed in storage, so cache
    // optimized variants aggressively to maximize reuse within a container's life.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      ...(process.env.NEXT_PUBLIC_BASE_URL
        ? [{ // Note: needed to serve images from /public folder
            protocol: process.env.NEXT_PUBLIC_BASE_URL.startsWith("https") ? "https" : "http",
            hostname: process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, ""),
          }]
        : []),
      ...(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
        ? [{ // Note: only needed when using local-file for product media
            protocol: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.startsWith("https") ? "https" : "http",
            hostname: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.replace(/^https?:\/\//, ""),
          }]
        : []),
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      { // Note: can be removed after deleting demo products
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT ? [{ // Note: needed when using MinIO bucket storage for media
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
      }] : []),
    ],
  },
}

module.exports = nextConfig

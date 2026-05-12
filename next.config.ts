import type { NextConfig } from "next";

/**
 * SPA Mode Configuration
 *
 * When SPA_MODE=true, Next.js builds static HTML/JS files via `output: "export"`.
 * In this mode, there is no Next.js server - all API routes are handled by the
 * separate FastAPI backend (see backend/).
 *
 * Deployment Architecture (SPA Mode):
 * - FastAPI serves as the main application server
 * - Pre-built Next.js static files are served from a preset endpoint (e.g., /_next/)
 * - All /api/* requests are routed to FastAPI handlers
 * - Authentication is handled by FastAPI's /api/auth/* routes
 * - Same-origin deployment: both static files and API share the same origin
 *
 * This eliminates the need for CORS configuration since everything is same-origin.
 */
const isSpaMode = process.env.SPA_MODE === "true";

const nextConfig: NextConfig = {
  ...(isSpaMode
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        experimental: {
          serverActions: {
            bodySizeLimit: "2mb",
          },
        },
      }),
};

export default nextConfig;

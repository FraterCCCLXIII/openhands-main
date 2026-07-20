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
const uiBasePath = (process.env.NEXT_PUBLIC_INTHUB_UI_BASE_PATH ?? "")
  .trim()
  .replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Allow local dev access via 127.0.0.1 and LAN IPs, not just "localhost".
  // Next.js dev blocks the HMR WebSocket and dev resources from unknown
  // origins, which leaves the client un-hydrated (stuck on the
  // server-rendered loading spinner).
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "10.0.0.150"],
  ...(uiBasePath ? { basePath: uiBasePath } : {}),
  ...(isSpaMode
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

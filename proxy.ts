import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isAuthDisabled } from "@/src/lib/auth-config";
import { isAllowedWhenAuthDisabled } from "@/src/lib/request-context";
import { applySecurityHeaders } from "@/src/lib/security-headers";

const LOCAL_ONLY_MESSAGE =
  "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.";

const INTERNAL_AUTH_HEADER = "X-Integrations-Hub-Internal-Secret";

const internalAuthSecret = () =>
  process.env.INTEGRATIONS_HUB_INTERNAL_SECRET?.trim() ||
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  "";

const hasApiKeyCredential = (request: NextRequest) => {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  return (
    Boolean(request.headers.get("x-api-key")?.trim()) ||
    authorization.toLowerCase().startsWith("bearer ")
  );
};

const requiresDashboardSession = (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  if (
    path === "/api/user/key" ||
    path === "/api/user/agent-key" ||
    path === "/api/admin/key" ||
    path === "/api/oauth/connections" ||
    path === "/api/notifications" ||
    path === "/api/permission-profiles" ||
    path.startsWith("/api/permission-profiles/") ||
    path.startsWith("/api/case-by-case-approvals") ||
    (path.startsWith("/api/oauth/") && path.endsWith("/start")) ||
    (path.startsWith("/api/integrations") &&
      path !== "/api/integrations/managed-connectors" &&
      path !== "/api/integrations/oauth-provider-catalog")
  ) {
    return true;
  }

  if (
    path.startsWith("/api/admin/") &&
    path !== "/api/admin/key" &&
    !hasApiKeyCredential(request)
  ) {
    return true;
  }

  if (path.startsWith("/api/managed-connectors") && method !== "GET") {
    return true;
  }

  return path.startsWith("/api/agent-classes/");
};

const isHttpsRequest = (request: NextRequest) =>
  (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "")) ===
  "https";

export async function proxy(request: NextRequest) {
  const isHttps = isHttpsRequest(request);

  if (!isAuthDisabled() || isAllowedWhenAuthDisabled(request.headers)) {
    if (!requiresDashboardSession(request) || isAuthDisabled()) {
      return applySecurityHeaders(NextResponse.next(), { isHttps });
    }

    const secret = internalAuthSecret();
    if (!secret) {
      return applySecurityHeaders(
        NextResponse.json({ detail: "Dashboard API authentication is not configured." }, { status: 503 }),
        { isHttps },
      );
    }

    const token = await getToken({ req: request, secret, secureCookie: isHttps });
    const ownerId = (token?.email ?? token?.name ?? token?.sub ?? "").trim().toLowerCase();
    if (!ownerId) {
      return applySecurityHeaders(
        NextResponse.json({ detail: "Sign in to the dashboard before using this endpoint." }, { status: 401 }),
        { isHttps },
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("X-Owner-Id", ownerId);
    requestHeaders.set(INTERNAL_AUTH_HEADER, secret);
    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), {
      isHttps,
    });
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.json({ detail: LOCAL_ONLY_MESSAGE }, { status: 403 }), {
      isHttps,
    });
  }

  return applySecurityHeaders(
    new NextResponse(LOCAL_ONLY_MESSAGE, {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
    { isHttps },
  );
}

export const config = {
  matcher: ["/:path*"],
};

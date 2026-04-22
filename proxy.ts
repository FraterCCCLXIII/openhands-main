import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAuthDisabled } from "@/src/lib/auth-config";
import { isAllowedWhenAuthDisabled } from "@/src/lib/request-context";
import { applySecurityHeaders } from "@/src/lib/security-headers";

const LOCAL_ONLY_MESSAGE =
  "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.";

const isHttpsRequest = (request: NextRequest) =>
  (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "")) ===
  "https";

export function proxy(request: NextRequest) {
  const isHttps = isHttpsRequest(request);

  if (!isAuthDisabled() || isAllowedWhenAuthDisabled(request.headers)) {
    return applySecurityHeaders(NextResponse.next(), { isHttps });
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

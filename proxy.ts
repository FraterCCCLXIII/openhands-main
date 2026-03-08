import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAuthDisabled } from "@/src/lib/auth-config";
import { isAllowedWhenAuthDisabled } from "@/src/lib/request-context";

const LOCAL_ONLY_MESSAGE =
  "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.";

export function proxy(request: NextRequest) {
  if (!isAuthDisabled() || isAllowedWhenAuthDisabled(request.headers)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ detail: LOCAL_ONLY_MESSAGE }, { status: 403 });
  }

  return new NextResponse(LOCAL_ONLY_MESSAGE, {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/:path*"],
};

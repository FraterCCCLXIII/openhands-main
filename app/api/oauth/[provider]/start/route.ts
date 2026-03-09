import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { createOAuthStateExpiry, getOAuthProvider } from "@/src/lib/oauth/providers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await params;
  const provider = getOAuthProvider(providerParam);

  if (!provider) {
    return NextResponse.json(
      { detail: `Unknown OAuth provider '${providerParam}'.` },
      { status: 404 },
    );
  }

  const { ownerId } = await getCurrentUserIdentity();
  const url = new URL(request.url);
  const integrationKey = url.searchParams.get("integrationKey")?.trim() || provider.slug;
  const redirectTo =
    url.searchParams.get("redirectTo")?.trim() ||
    `/admin?section=integrations&showIntegrationWizard=1&builtIn=${encodeURIComponent(
      integrationKey,
    )}`;
  const state = randomBytes(24).toString("base64url");
  const redirectUri = `${url.origin}/api/oauth/${provider.slug}/callback`;
  const start = provider.startAuth({ state, redirectUri });

  await getContextLayerService().saveOAuthState({
    state,
    ownerId,
    integrationKey,
    provider: provider.slug,
    codeVerifier: start.codeVerifier,
    redirectTo,
    expiresAt: createOAuthStateExpiry(),
  });

  return NextResponse.redirect(start.authorizationUrl);
}

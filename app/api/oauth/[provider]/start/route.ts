import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { getOAuthCallbackUrl } from "@/src/lib/auth-config";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import {
  getContextLayerRepository,
  getContextLayerService,
} from "@/src/lib/core/runtime";
import { createOAuthStateExpiry } from "@/src/lib/oauth/providers";
import { normalizeSafeRedirectTarget } from "@/src/lib/oauth/redirect-targets";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";
import { logRouteInfo, summarizeRouteError } from "@/src/lib/route-logging";

const buildRedirect = (
  requestUrl: string,
  redirectTo: string,
  params: Record<string, string>,
) => {
  const destination = new URL(redirectTo, requestUrl);
  for (const [key, value] of Object.entries(params)) {
    destination.searchParams.set(key, value);
  }
  return NextResponse.redirect(destination);
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const url = new URL(request.url);
  const { provider: providerParam } = await params;
  const provider = await resolveOAuthProvider(
    getContextLayerRepository(),
    providerParam,
  );

  if (!provider) {
    logRouteInfo("/api/oauth/[provider]/start", "oauth_start_unknown_provider", {
      provider: providerParam,
    });
    return NextResponse.json(
      { detail: `Unknown OAuth provider '${providerParam}'.` },
      { status: 404 },
    );
  }

  const defaultRedirectTo = buildAdminSectionHref("integrations", {
    showIntegrationWizard: "1",
    managedConnector: provider.slug,
  });
  const redirectTo = normalizeSafeRedirectTarget(
    request.url,
    url.searchParams.get("redirectTo"),
    defaultRedirectTo,
  );

  let ownerId: string | null = null;
  const integrationKey = url.searchParams.get("integrationKey")?.trim() || provider.slug;

  try {
    ({ ownerId } = await getCurrentUserIdentity());
    logRouteInfo("/api/oauth/[provider]/start", "oauth_start_requested", {
      ownerId,
      provider: provider.slug,
      integrationKey,
    });

    const state = randomBytes(24).toString("base64url");
    const callbackUrl = `${url.origin}/api/oauth/${provider.slug}/callback`;
    const redirectUri = getOAuthCallbackUrl(provider.slug);
    const start = provider.startAuth({ state, redirectUri });

    await getContextLayerService().saveOAuthState({
      state,
      ownerId,
      integrationKey,
      provider: provider.slug,
      codeVerifier: start.codeVerifier,
      redirectTo,
      redirectUri,
      callbackUrl: redirectUri === callbackUrl ? undefined : callbackUrl,
      expiresAt: createOAuthStateExpiry(),
    });

    logRouteInfo("/api/oauth/[provider]/start", "oauth_start_redirected", {
      ownerId,
      provider: provider.slug,
      integrationKey,
    });

    return NextResponse.redirect(start.authorizationUrl);
  } catch (error) {
    logRouteInfo("/api/oauth/[provider]/start", "oauth_start_failed", {
      ownerId,
      provider: provider.slug,
      integrationKey,
      ...summarizeRouteError(error),
    });
    const message =
      error instanceof Error ? error.message : "OAuth connection could not start.";
    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "error",
      oauth_error: message,
    });
  }
}

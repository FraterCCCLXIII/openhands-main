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
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";

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
    return NextResponse.json(
      { detail: `Unknown OAuth provider '${providerParam}'.` },
      { status: 404 },
    );
  }

  const redirectTo =
    url.searchParams.get("redirectTo")?.trim() ||
    buildAdminSectionHref("integrations", {
      showIntegrationWizard: "1",
      managedConnector: provider.slug,
    });

  try {
    const { ownerId } = await getCurrentUserIdentity();
    const integrationKey =
      url.searchParams.get("integrationKey")?.trim() || provider.slug;
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

    return NextResponse.redirect(start.authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth connection could not start.";
    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "error",
      oauth_error: message,
    });
  }
}

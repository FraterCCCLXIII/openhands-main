import { NextResponse } from "next/server";

import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { getOAuthProvider } from "@/src/lib/oauth/providers";

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
  const service = getContextLayerService();
  const url = new URL(request.url);
  const { provider: providerParam } = await params;
  const provider = getOAuthProvider(providerParam);

  if (!provider) {
    return NextResponse.json(
      { detail: `Unknown OAuth provider '${providerParam}'.` },
      { status: 404 },
    );
  }

  const state = url.searchParams.get("state")?.trim() || "";
  const error = url.searchParams.get("error")?.trim();
  const errorDescription = url.searchParams.get("error_description")?.trim();
  const code = url.searchParams.get("code")?.trim();

  if (!state) {
    return NextResponse.json({ detail: "Missing OAuth state." }, { status: 400 });
  }

  let redirectTo = "/admin?section=integrations&showIntegrationWizard=1";

  try {
    const stateRecord = await service.consumeOAuthState(state, provider.slug);
    redirectTo = stateRecord.redirectTo;

    if (error) {
      return buildRedirect(request.url, redirectTo, {
        oauth_provider: provider.slug,
        oauth_status: "error",
        oauth_error: errorDescription || error,
      });
    }

    if (!code) {
      throw new ContextLayerError("Missing OAuth authorization code.", 400);
    }

    const redirectUri = `${url.origin}/api/oauth/${provider.slug}/callback`;
    const exchange = await provider.exchangeCode({
      code,
      redirectUri,
      codeVerifier: stateRecord.codeVerifier,
    });

    await service.saveOAuthConnection(
      stateRecord.ownerId,
      stateRecord.integrationKey,
      provider.slug,
      {
        accessToken: exchange.accessToken,
        refreshToken: exchange.refreshToken,
      },
      {
        authStrategy: "oauth2",
        tokenType: exchange.tokenType,
        scopes: exchange.scopes,
        expiresAt: exchange.expiresAt,
        externalAccountId: exchange.externalAccountId,
        externalWorkspaceId: exchange.externalWorkspaceId,
        displayName: exchange.displayName,
        metadata: exchange.metadata,
      },
    );

    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "connected",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth connection failed.";
    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "error",
      oauth_error: message,
    });
  }
}

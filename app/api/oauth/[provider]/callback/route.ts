import { NextResponse } from "next/server";

import { getOAuthCallbackUrl } from "@/src/lib/auth-config";
import { ContextLayerError } from "@/src/lib/core/errors";
import {
  getContextLayerRepository,
  getContextLayerService,
} from "@/src/lib/core/runtime";
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

const buildCallbackRedirect = (requestUrl: string, callbackUrl: string) => {
  const source = new URL(requestUrl);
  const destination = new URL(callbackUrl);
  for (const [key, value] of source.searchParams.entries()) {
    destination.searchParams.append(key, value);
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

  const state = url.searchParams.get("state")?.trim() || "";
  const error = url.searchParams.get("error")?.trim();
  const errorDescription = url.searchParams.get("error_description")?.trim();
  const code = url.searchParams.get("code")?.trim();

  if (!state) {
    return NextResponse.json({ detail: "Missing OAuth state." }, { status: 400 });
  }

  let redirectTo = "/admin?section=integrations&showIntegrationWizard=1";

  try {
    const requestCallbackUrl = `${url.origin}/api/oauth/${provider.slug}/callback`;
    const proxyCallbackUrl = getOAuthCallbackUrl(provider.slug);
    const stateRecord = await service.getOAuthState(state, provider.slug);
    redirectTo = stateRecord.redirectTo;

    if (
      stateRecord.callbackUrl &&
      stateRecord.callbackUrl !== requestCallbackUrl &&
      proxyCallbackUrl === requestCallbackUrl
    ) {
      return buildCallbackRedirect(request.url, stateRecord.callbackUrl);
    }

    await service.consumeOAuthState(state, provider.slug);

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

    const redirectUri = stateRecord.redirectUri ?? proxyCallbackUrl;
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

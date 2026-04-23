import { NextResponse } from "next/server";

import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { getOAuthCallbackUrl } from "@/src/lib/auth-config";
import { ContextLayerError } from "@/src/lib/core/errors";
import {
  getContextLayerRepository,
  getContextLayerService,
} from "@/src/lib/core/runtime";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";
import { normalizeSafeRedirectTarget } from "@/src/lib/oauth/redirect-targets";
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
    logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_unknown_provider", {
      provider: providerParam,
    });
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
    logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_missing_state", {
      provider: provider.slug,
    });
    return NextResponse.json({ detail: "Missing OAuth state." }, { status: 400 });
  }

  const defaultRedirectTo = buildAdminSectionHref("integrations", {
    showIntegrationWizard: "1",
  });
  let redirectTo = defaultRedirectTo;
  let ownerId: string | null = null;
  let integrationKey: string | null = null;

  try {
    const requestCallbackUrl = `${url.origin}/api/oauth/${provider.slug}/callback`;
    const proxyCallbackUrl = getOAuthCallbackUrl(provider.slug);
    const stateRecord = await service.getOAuthState(state, provider.slug);
    ownerId = stateRecord.ownerId;
    integrationKey = stateRecord.integrationKey;
    redirectTo = normalizeSafeRedirectTarget(
      request.url,
      stateRecord.redirectTo,
      defaultRedirectTo,
    );

    if (
      stateRecord.callbackUrl &&
      stateRecord.callbackUrl !== requestCallbackUrl &&
      proxyCallbackUrl === requestCallbackUrl
    ) {
      logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_proxy_redirect", {
        ownerId,
        integrationKey,
        provider: provider.slug,
      });
      return buildCallbackRedirect(request.url, stateRecord.callbackUrl);
    }

    await service.consumeOAuthState(state, provider.slug);

    if (error) {
      logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_provider_error", {
        ownerId,
        integrationKey,
        provider: provider.slug,
        errorMessage: errorDescription || error,
      });
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

    logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_connected", {
      ownerId,
      integrationKey,
      provider: provider.slug,
      tokenType: exchange.tokenType,
      scopeCount: exchange.scopes.length,
      expiresAt: exchange.expiresAt ?? null,
    });

    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "connected",
    });
  } catch (error) {
    logRouteInfo("/api/oauth/[provider]/callback", "oauth_callback_failed", {
      ownerId,
      integrationKey,
      provider: provider.slug,
      ...summarizeRouteError(error),
    });
    const message =
      error instanceof Error ? error.message : "OAuth connection failed.";
    return buildRedirect(request.url, redirectTo, {
      oauth_provider: provider.slug,
      oauth_status: "error",
      oauth_error: message,
    });
  }
}

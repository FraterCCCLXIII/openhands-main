import { createHash, randomBytes } from "node:crypto";

import type { ContextRepository } from "@/src/lib/core/repository";
import { ContextLayerError } from "@/src/lib/core/errors";
import { normalizeManagedConnectorRecord } from "@/src/lib/integrations/managed-connectors";
import {
  encryptManagedOAuthClient,
  readManagedOAuthClient,
  registerManagedOAuthClient,
  requireManagedOAuthClient,
  usesDynamicOAuthClientRegistration,
} from "@/src/lib/oauth/managed-oauth-client";
import type {
  OAuthProviderDefinition,
  OAuthStartContext,
  OAuthStartResult,
  OAuthTokenExchangeResult,
} from "@/src/lib/oauth/providers";
import type { ManagedConnectorRecord } from "@/src/types/context-layer";

const encodeBasicAuth = (clientId: string, clientSecret: string) =>
  Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const resolveExpiresAt = (expiresIn: number | undefined) =>
  typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : undefined;

const createPkceVerifier = () => randomBytes(32).toString("base64url");

const createPkceChallenge = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url");

const fetchJson = async <T,>(
  input: string,
  init: RequestInit,
  label: string,
): Promise<T> => {
  const response = await fetch(input, init);
  const body = await response.text();
  if (!response.ok) {
    throw new ContextLayerError(
      `${label} failed (${response.status}): ${body || response.statusText}`,
      502,
    );
  }

  return JSON.parse(body) as T;
};

const splitScopes = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/[ ,]+/).filter(Boolean);
  }

  return [];
};

const joinScopes = (scopes: string[], separator: "space" | "comma" | undefined) =>
  scopes.join(separator === "comma" ? "," : " ");

const getOptionalAuthorizationScopes = (connector: ManagedConnectorRecord) => {
  const oauthConfig = connector.oauthConfig;
  if (!oauthConfig) {
    return [];
  }

  if ((oauthConfig.optionalScopes?.length ?? 0) > 0) {
    return oauthConfig.optionalScopes ?? [];
  }

  return splitScopes(oauthConfig.additionalAuthorizationParams?.optional_scope);
};

const getRequestedAuthorizationScopes = (connector: ManagedConnectorRecord) => {
  const oauthConfig = connector.oauthConfig;
  if (!oauthConfig) {
    return [];
  }

  return [...new Set([...oauthConfig.scopes, ...getOptionalAuthorizationScopes(connector)])];
};

const ensureDynamicManagedOAuthClient = async (
  repository: ContextRepository,
  connector: ManagedConnectorRecord,
): Promise<ManagedConnectorRecord> => {
  if (!usesDynamicOAuthClientRegistration(connector.oauthConfig)) {
    return connector;
  }

  const storedClient = readManagedOAuthClient(connector);
  if (storedClient?.clientId && !storedClient.clientSecret) {
    return connector;
  }

  const registeredClient = await registerManagedOAuthClient({
    connectorName: connector.name,
    slug: connector.slug,
    oauthConfig: connector.oauthConfig!,
  });

  return repository.upsertManagedConnector({
    ...connector,
    encryptedOAuthClient: encryptManagedOAuthClient(registeredClient),
    updatedAt: new Date().toISOString(),
  });
};

const buildGenericOAuthProvider = (
  connector: ManagedConnectorRecord,
): OAuthProviderDefinition | null => {
  if (connector.authStrategy !== "oauth2" || !connector.oauthConfig) {
    return null;
  }

  return {
    slug: connector.slug,
    name: connector.name,
    clientIdEnv: `managed:${connector.slug}:clientId`,
    clientSecretEnv: `managed:${connector.slug}:clientSecret`,
    startAuth({ state, redirectUri }: OAuthStartContext): OAuthStartResult {
      const { clientId } = requireManagedOAuthClient(connector);
      const authorizationUrl = new URL(connector.oauthConfig!.authorizationUrl);
      authorizationUrl.searchParams.set("client_id", clientId);
      authorizationUrl.searchParams.set("redirect_uri", redirectUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("state", state);

      if (connector.oauthConfig!.scopes.length > 0) {
        authorizationUrl.searchParams.set(
          "scope",
          joinScopes(connector.oauthConfig!.scopes, connector.oauthConfig!.scopeSeparator),
        );
      }

      const optionalScopes = getOptionalAuthorizationScopes(connector);
      if (optionalScopes.length > 0) {
        authorizationUrl.searchParams.set(
          "optional_scope",
          joinScopes(optionalScopes, connector.oauthConfig!.scopeSeparator),
        );
      }

      for (const [key, value] of Object.entries(
        connector.oauthConfig!.additionalAuthorizationParams ?? {},
      )) {
        if (key === "scope" && connector.oauthConfig!.scopes.length > 0) {
          continue;
        }
        if (key === "optional_scope" && optionalScopes.length > 0) {
          continue;
        }
        authorizationUrl.searchParams.set(key, value);
      }

      if (connector.oauthConfig!.pkce) {
        const codeVerifier = createPkceVerifier();
        authorizationUrl.searchParams.set(
          "code_challenge",
          createPkceChallenge(codeVerifier),
        );
        authorizationUrl.searchParams.set("code_challenge_method", "S256");
        return {
          authorizationUrl: authorizationUrl.toString(),
          codeVerifier,
        };
      }

      return {
        authorizationUrl: authorizationUrl.toString(),
      };
    },
    async exchangeCode({ code, redirectUri, codeVerifier }) {
      const { clientId, clientSecret } = requireManagedOAuthClient(connector);
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      });

      if (connector.oauthConfig?.clientAuthentication === "body") {
        body.set("client_id", clientId);
        body.set("client_secret", clientSecret ?? "");
      }

      if (connector.oauthConfig?.clientAuthentication === "none") {
        body.set("client_id", clientId);
      }

      if (connector.oauthConfig?.pkce && codeVerifier) {
        body.set("code_verifier", codeVerifier);
      }

      for (const [key, value] of Object.entries(
        connector.oauthConfig?.additionalTokenParams ?? {},
      )) {
        body.set(key, value);
      }

      const response = await fetchJson<Record<string, unknown>>(
        connector.oauthConfig!.tokenUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(connector.oauthConfig?.clientAuthentication === "body" ||
            connector.oauthConfig?.clientAuthentication === "none"
              ? {}
              : {
                  Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret ?? "")}`,
                }),
          },
          body: body.toString(),
        },
        `${connector.name} token exchange`,
      );

      return {
        accessToken: String(response.access_token ?? ""),
        refreshToken:
          typeof response.refresh_token === "string"
            ? response.refresh_token
            : undefined,
        tokenType:
          typeof response.token_type === "string" ? response.token_type : undefined,
        scopes:
          splitScopes(response.scope).length > 0
            ? splitScopes(response.scope)
            : getRequestedAuthorizationScopes(connector),
        expiresAt: resolveExpiresAt(
          typeof response.expires_in === "number" ? response.expires_in : undefined,
        ),
        displayName: connector.name,
        metadata: response,
      } satisfies OAuthTokenExchangeResult;
    },
    async refreshToken({ refreshToken }) {
      const { clientId, clientSecret } = requireManagedOAuthClient(connector);
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });

      if (connector.oauthConfig?.clientAuthentication === "body") {
        body.set("client_id", clientId);
        body.set("client_secret", clientSecret ?? "");
      }

      if (connector.oauthConfig?.clientAuthentication === "none") {
        body.set("client_id", clientId);
      }

      for (const [key, value] of Object.entries(
        connector.oauthConfig?.additionalTokenParams ?? {},
      )) {
        body.set(key, value);
      }

      const response = await fetchJson<Record<string, unknown>>(
        connector.oauthConfig!.tokenUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(connector.oauthConfig?.clientAuthentication === "body" ||
            connector.oauthConfig?.clientAuthentication === "none"
              ? {}
              : {
                  Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret ?? "")}`,
                }),
          },
          body: body.toString(),
        },
        `${connector.name} token refresh`,
      );

      return {
        accessToken: String(response.access_token ?? ""),
        refreshToken:
          typeof response.refresh_token === "string"
            ? response.refresh_token
            : refreshToken,
        tokenType:
          typeof response.token_type === "string" ? response.token_type : undefined,
        scopes:
          splitScopes(response.scope).length > 0
            ? splitScopes(response.scope)
            : getRequestedAuthorizationScopes(connector),
        expiresAt: resolveExpiresAt(
          typeof response.expires_in === "number" ? response.expires_in : undefined,
        ),
        displayName: connector.name,
        metadata: response,
      } satisfies OAuthTokenExchangeResult;
    },
  };
};

export const resolveOAuthProvider = async (
  repository: ContextRepository,
  provider: string,
): Promise<OAuthProviderDefinition | null> => {
  const connector = await repository.getManagedConnector(provider);
  if (!connector?.enabled) {
    return null;
  }

  const normalizedConnector = normalizeManagedConnectorRecord(connector);
  const resolvedConnector = await ensureDynamicManagedOAuthClient(
    repository,
    normalizedConnector,
  );
  return buildGenericOAuthProvider(resolvedConnector);
};

export const isOAuthProviderResolvedAndConfigured = async (
  repository: ContextRepository,
  provider: string,
) => Boolean(await resolveOAuthProvider(repository, provider));

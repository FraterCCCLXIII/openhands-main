import { createHash, randomBytes } from "node:crypto";

import { addMinutes, nowIso } from "@/src/lib/core/date";
import { ContextLayerError } from "@/src/lib/core/errors";

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

export interface OAuthStartContext {
  state: string;
  redirectUri: string;
}

export interface OAuthStartResult {
  authorizationUrl: string;
  codeVerifier?: string;
}

export interface OAuthTokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  displayName?: string;
  metadata: Record<string, unknown>;
}

export interface OAuthProviderDefinition {
  slug: string;
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  startAuth(context: OAuthStartContext): OAuthStartResult;
  exchangeCode(args: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<OAuthTokenExchangeResult>;
  refreshToken(args: {
    refreshToken: string;
  }): Promise<OAuthTokenExchangeResult>;
}

const notionDefinition: OAuthProviderDefinition = {
  slug: "notion",
  name: "Notion",
  clientIdEnv: "NOTION_CLIENT_ID",
  clientSecretEnv: "NOTION_CLIENT_SECRET",
  startAuth({ state, redirectUri }) {
    const clientId = process.env.NOTION_CLIENT_ID?.trim();
    if (!clientId) {
      throw new ContextLayerError("NOTION_CLIENT_ID is not configured.", 500);
    }

    const authorizationUrl = new URL("https://api.notion.com/v1/oauth/authorize");
    authorizationUrl.searchParams.set("owner", "user");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("state", state);

    return {
      authorizationUrl: authorizationUrl.toString(),
    };
  },
  async exchangeCode({ code, redirectUri }) {
    const clientId = process.env.NOTION_CLIENT_ID?.trim();
    const clientSecret = process.env.NOTION_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ContextLayerError(
        "NOTION_CLIENT_ID and NOTION_CLIENT_SECRET must be configured.",
        500,
      );
    }

    const response = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      workspace_name?: string;
      workspace_id?: string;
      workspace_icon?: string;
      bot_id?: string;
      duplicated_template_id?: string | null;
      owner?: Record<string, unknown>;
      request_id?: string;
      expires_in?: number;
    }>(
      "https://api.notion.com/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      },
      "Notion token exchange",
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      scopes: [],
      expiresAt: resolveExpiresAt(response.expires_in),
      externalAccountId: response.bot_id,
      externalWorkspaceId: response.workspace_id,
      displayName: response.workspace_name || "Notion workspace",
      metadata: {
        owner: response.owner ?? {},
        workspaceIcon: response.workspace_icon ?? null,
        requestId: response.request_id ?? null,
        duplicatedTemplateId: response.duplicated_template_id ?? null,
      },
    };
  },
  async refreshToken({ refreshToken }) {
    const clientId = process.env.NOTION_CLIENT_ID?.trim();
    const clientSecret = process.env.NOTION_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ContextLayerError(
        "NOTION_CLIENT_ID and NOTION_CLIENT_SECRET must be configured.",
        500,
      );
    }

    const response = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      workspace_name?: string;
      workspace_id?: string;
      workspace_icon?: string;
      bot_id?: string;
      owner?: Record<string, unknown>;
      request_id?: string;
      expires_in?: number;
    }>(
      "https://api.notion.com/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
      "Notion token refresh",
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? refreshToken,
      tokenType: response.token_type,
      scopes: [],
      expiresAt: resolveExpiresAt(response.expires_in),
      externalAccountId: response.bot_id,
      externalWorkspaceId: response.workspace_id,
      displayName: response.workspace_name || "Notion workspace",
      metadata: {
        owner: response.owner ?? {},
        workspaceIcon: response.workspace_icon ?? null,
        requestId: response.request_id ?? null,
      },
    };
  },
};

const FIGMA_DEFAULT_SCOPES = [
  "current_user:read",
  "file_content:read",
  "file_metadata:read",
  "projects:read",
];

const figmaDefinition: OAuthProviderDefinition = {
  slug: "figma",
  name: "Figma",
  clientIdEnv: "FIGMA_CLIENT_ID",
  clientSecretEnv: "FIGMA_CLIENT_SECRET",
  startAuth({ state, redirectUri }) {
    const clientId = process.env.FIGMA_CLIENT_ID?.trim();
    if (!clientId) {
      throw new ContextLayerError("FIGMA_CLIENT_ID is not configured.", 500);
    }

    const codeVerifier = createPkceVerifier();
    const authorizationUrl = new URL("https://www.figma.com/oauth");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("scope", FIGMA_DEFAULT_SCOPES.join(","));
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set(
      "code_challenge",
      createPkceChallenge(codeVerifier),
    );
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    return {
      authorizationUrl: authorizationUrl.toString(),
      codeVerifier,
    };
  },
  async exchangeCode({ code, redirectUri, codeVerifier }) {
    const clientId = process.env.FIGMA_CLIENT_ID?.trim();
    const clientSecret = process.env.FIGMA_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ContextLayerError(
        "FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET must be configured.",
        500,
      );
    }

    const body = new URLSearchParams({
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    });
    if (codeVerifier) {
      body.set("code_verifier", codeVerifier);
    }

    const response = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      user_id_string?: string;
      scope?: string;
    }>(
      "https://api.figma.com/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
      "Figma token exchange",
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      scopes:
        response.scope?.split(/[ ,]+/).filter(Boolean) ?? FIGMA_DEFAULT_SCOPES,
      expiresAt: resolveExpiresAt(response.expires_in),
      externalAccountId: response.user_id_string,
      displayName: response.user_id_string
        ? `Figma account ${response.user_id_string}`
        : "Figma account",
      metadata: {
        scope: response.scope ?? FIGMA_DEFAULT_SCOPES.join(","),
      },
    };
  },
  async refreshToken({ refreshToken }) {
    const clientId = process.env.FIGMA_CLIENT_ID?.trim();
    const clientSecret = process.env.FIGMA_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ContextLayerError(
        "FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET must be configured.",
        500,
      );
    }

    const response = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    }>(
      "https://api.figma.com/v1/oauth/refresh",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ refresh_token: refreshToken }).toString(),
      },
      "Figma token refresh",
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? refreshToken,
      tokenType: response.token_type,
      scopes:
        response.scope?.split(/[ ,]+/).filter(Boolean) ?? FIGMA_DEFAULT_SCOPES,
      expiresAt: resolveExpiresAt(response.expires_in),
      displayName: "Figma account",
      metadata: {
        scope: response.scope ?? FIGMA_DEFAULT_SCOPES.join(","),
      },
    };
  },
};

const oauthProviders: Record<string, OAuthProviderDefinition> = {
  figma: figmaDefinition,
  notion: notionDefinition,
};

export const listOAuthProviders = () => Object.values(oauthProviders);

export const getOAuthProvider = (provider: string) => oauthProviders[provider] ?? null;

export const isOAuthProviderConfigured = (provider: string) => {
  const definition = getOAuthProvider(provider);
  if (!definition) {
    return false;
  }

  return Boolean(
    process.env[definition.clientIdEnv]?.trim() &&
      process.env[definition.clientSecretEnv]?.trim(),
  );
};

export const createOAuthStateExpiry = () => addMinutes(nowIso(), 10);

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContextRepository } from "@/src/lib/core/repository";
import { ContextLayerError } from "@/src/lib/core/errors";
import { encryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  isOAuthProviderResolvedAndConfigured,
  resolveOAuthProvider,
} from "@/src/lib/oauth/provider-resolver";
import type { ManagedConnectorRecord } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

const createManagedConnector = (
  overrides: Partial<ManagedConnectorRecord> = {},
): ManagedConnectorRecord => {
  const defaultOAuthConfig = {
    authorizationUrl: "https://auth.acme.test/authorize",
    tokenUrl: "https://auth.acme.test/token",
    scopes: ["contacts.read", "contacts.write"],
    scopeSeparator: "space" as const,
    clientAuthentication: "basic" as const,
    pkce: false,
  };
  const hasOAuthConfigOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    "oauthConfig",
  );
  const oauthConfig = hasOAuthConfigOverride
    ? overrides.oauthConfig
      ? { ...defaultOAuthConfig, ...overrides.oauthConfig }
      : undefined
    : defaultOAuthConfig;

  return {
    slug: "acme-crm",
    name: "Acme CRM",
    description: "Configurable CRM connector",
    categories: ["CRM"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    provider: "http",
    oauthConfigured: true,
    credentialLabel: "Connect Acme CRM",
    credentialPlaceholder: "Connect Acme CRM",
    credentialHelp: "Use OAuth to connect Acme CRM.",
    apiBaseUrl: "https://api.acme.test",
    openApiUrl: "https://api.acme.test/openapi.json",
    encryptedOAuthClient: encryptCredentials({
      clientId: "acme-client-id",
      clientSecret: "acme-client-secret",
    }),
    tools: [],
    enabled: true,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
    ...overrides,
    oauthConfig,
  };
};

beforeEach(async () => {
  vi.stubEnv("POSTGRES_URL", "pglite://provider-resolver-test");
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("AUTH_URL", "https://context.test");

  const ctx = await createTestRepository();
  testRepo = ctx.repository;
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  await testCleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("resolveOAuthProvider", () => {
  it("builds a generic OAuth provider from a managed connector record", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        provider: "mcp",
        serverUrl: "https://mcp.acme.test/mcp",
        oauthConfig: {
          authorizationUrl: "https://auth.acme.test/authorize",
          tokenUrl: "https://auth.acme.test/token",
          scopes: ["contacts.read", "contacts.write"],
          scopeSeparator: "space",
          clientAuthentication: "body",
          pkce: true,
        },
      }),
    );

    const provider = await resolveOAuthProvider(repository, "acme-crm");
    expect(provider).toBeTruthy();

    const start = provider!.startAuth({
      state: "state-123",
      redirectUri: "https://context.test/api/oauth/acme-crm/callback",
    });
    const authorizationUrl = new URL(start.authorizationUrl);

    expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(
      "https://auth.acme.test/authorize",
    );
    expect(authorizationUrl.searchParams.get("client_id")).toBe("acme-client-id");
    expect(authorizationUrl.searchParams.get("scope")).toBe(
      "contacts.read contacts.write",
    );
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(start.codeVerifier).toBeTruthy();

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "access-123",
          refresh_token: "refresh-123",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "contacts.read contacts.write",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const exchange = await provider!.exchangeCode({
      code: "code-123",
      redirectUri: "https://context.test/api/oauth/acme-crm/callback",
      codeVerifier: start.codeVerifier,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://auth.acme.test/token");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(String(init.body)).toContain("grant_type=authorization_code");
    expect(String(init.body)).toContain("client_id=acme-client-id");
    expect(String(init.body)).toContain("client_secret=acme-client-secret");
    expect(String(init.body)).toContain("code_verifier=");
    expect(exchange).toMatchObject({
      accessToken: "access-123",
      refreshToken: "refresh-123",
      tokenType: "Bearer",
      scopes: ["contacts.read", "contacts.write"],
      displayName: "Acme CRM",
    });
  });

  it("backfills body client authentication for legacy HubSpot connectors during token exchange", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        slug: "hubspot",
        name: "HubSpot",
        oauthConfig: {
          authorizationUrl: "https://app.hubspot.com/oauth/authorize",
          tokenUrl: "https://api.hubapi.com/oauth/v1/token",
          scopes: ["oauth", "crm.objects.contacts.read"],
          optionalScopes: ["crm.objects.contacts.write"],
          scopeSeparator: "space",
          clientAuthentication: undefined,
        },
      }),
    );

    const provider = await resolveOAuthProvider(repository, "hubspot");
    expect(provider).toBeTruthy();

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "hubspot-access",
          refresh_token: "hubspot-refresh",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "oauth crm.objects.contacts.read crm.objects.contacts.write",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const exchange = await provider!.exchangeCode({
      code: "hubspot-code",
      redirectUri: "https://context.test/api/oauth/hubspot/callback",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.hubapi.com/oauth/v1/token");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(String(init.body)).toContain("client_id=acme-client-id");
    expect(String(init.body)).toContain("client_secret=acme-client-secret");
    expect(exchange).toMatchObject({
      accessToken: "hubspot-access",
      refreshToken: "hubspot-refresh",
      tokenType: "Bearer",
      scopes: ["oauth", "crm.objects.contacts.read", "crm.objects.contacts.write"],
      displayName: "HubSpot",
    });
  });


  it("adds comma-separated required and optional scopes with custom auth params", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        oauthConfig: {
          authorizationUrl: "https://auth.acme.test/authorize",
          tokenUrl: "https://auth.acme.test/token",
          scopes: ["contacts.read", "contacts.write"],
          optionalScopes: ["contacts.admin"],
          scopeSeparator: "comma",
          clientAuthentication: "basic",
          additionalAuthorizationParams: {
            audience: "api://acme",
            prompt: "consent",
          },
        },
      }),
    );

    const provider = await resolveOAuthProvider(repository, "acme-crm");
    const start = provider!.startAuth({
      state: "state-456",
      redirectUri: "https://context.test/api/oauth/acme-crm/callback",
    });
    const authorizationUrl = new URL(start.authorizationUrl);

    expect(start.codeVerifier).toBeUndefined();
    expect(authorizationUrl.searchParams.get("scope")).toBe(
      "contacts.read,contacts.write",
    );
    expect(authorizationUrl.searchParams.get("optional_scope")).toBe(
      "contacts.admin",
    );
    expect(authorizationUrl.searchParams.get("audience")).toBe("api://acme");
    expect(authorizationUrl.searchParams.get("prompt")).toBe("consent");
    expect(authorizationUrl.searchParams.get("code_challenge")).toBeNull();
  });

  it("uses basic auth for confidential client exchange and refreshes with fallbacks", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        oauthConfig: {
          authorizationUrl: "https://auth.acme.test/authorize",
          tokenUrl: "https://auth.acme.test/token",
          scopes: ["contacts.read", "contacts.write"],
          optionalScopes: ["contacts.admin"],
          clientAuthentication: "basic",
          additionalTokenParams: {
            resource: "contacts",
          },
        },
      }),
    );

    const fetchMock = vi
      .fn(async () =>
        new Response(
          JSON.stringify({
            access_token: "access-basic",
            refresh_token: "refresh-basic",
            token_type: "Bearer",
            scope: ["contacts.read", "contacts.write", "contacts.admin"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            access_token: "access-basic",
            refresh_token: "refresh-basic",
            token_type: "Bearer",
            scope: ["contacts.read", "contacts.write", "contacts.admin"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            access_token: "access-refreshed",
            token_type: "Bearer",
            scope: 42,
            expires_in: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const provider = await resolveOAuthProvider(repository, "acme-crm");
    const exchange = await provider!.exchangeCode({
      code: "code-basic",
      redirectUri: "https://context.test/api/oauth/acme-crm/callback",
    });
    const refreshed = await provider!.refreshToken({ refreshToken: "refresh-basic" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [exchangeUrl, exchangeInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(exchangeUrl).toBe("https://auth.acme.test/token");
    expect((exchangeInit.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("acme-client-id:acme-client-secret").toString("base64")}`,
    );
    expect(String(exchangeInit.body)).toContain("resource=contacts");
    expect(String(exchangeInit.body)).not.toContain("client_id=");
    expect(exchange).toMatchObject({
      accessToken: "access-basic",
      refreshToken: "refresh-basic",
      scopes: ["contacts.read", "contacts.write", "contacts.admin"],
    });

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(refreshUrl).toBe("https://auth.acme.test/token");
    expect((refreshInit.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("acme-client-id:acme-client-secret").toString("base64")}`,
    );
    expect(String(refreshInit.body)).toContain("grant_type=refresh_token");
    expect(String(refreshInit.body)).toContain("refresh_token=refresh-basic");
    expect(String(refreshInit.body)).toContain("resource=contacts");
    expect(refreshed).toMatchObject({
      accessToken: "access-refreshed",
      refreshToken: "refresh-basic",
      tokenType: "Bearer",
      scopes: ["contacts.read", "contacts.write", "contacts.admin"],
      displayName: "Acme CRM",
      expiresAt: undefined,
    });
  });

  it("reuses previously registered public OAuth clients and refreshes without basic auth", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        slug: "webflow",
        name: "Webflow",
        provider: "mcp",
        serverUrl: "https://mcp.webflow.com/mcp",
        oauthConfig: {
          authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
          tokenUrl: "https://mcp.webflow.com/oauth/token",
          registrationUrl: "https://mcp.webflow.com/oauth/register",
          scopes: ["cms:read"],
          clientAuthentication: "none",
          pkce: false,
        },
        encryptedOAuthClient: encryptCredentials({
          clientId: "webflow-public-client",
        }),
      }),
    );

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "wf-access-456",
          scope: "cms:read,cms:write",
          expires_in: 1800,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = await resolveOAuthProvider(repository, "webflow");
    const refreshed = await provider!.refreshToken({ refreshToken: "wf-refresh-existing" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://mcp.webflow.com/oauth/token");
    expect(init.headers).toEqual({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(String(init.body)).toContain("client_id=webflow-public-client");
    expect(String(init.body)).not.toContain("client_secret=");
    expect(refreshed).toMatchObject({
      accessToken: "wf-access-456",
      refreshToken: "wf-refresh-existing",
      scopes: ["cms:read", "cms:write"],
      displayName: "Webflow",
    });
  });

  it("dynamically registers public MCP OAuth clients and exchanges tokens without basic auth", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(
      createManagedConnector({
        slug: "webflow",
        name: "Webflow",
        description: "Managed Webflow MCP",
        categories: ["CMS", "Marketing"],
        provider: "mcp",
        serverUrl: "https://mcp.webflow.com/mcp",
        oauthConfig: {
          authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
          tokenUrl: "https://mcp.webflow.com/oauth/token",
          registrationUrl: "https://mcp.webflow.com/oauth/register",
          scopes: [],
          clientAuthentication: "none",
          pkce: true,
        },
        encryptedOAuthClient: encryptCredentials({
          clientId: "old-webflow-client-id",
          clientSecret: "old-webflow-client-secret",
        }),
      }),
    );

    const fetchMock = vi
      .fn(async () =>
        new Response(
          JSON.stringify({
            client_id: "webflow-mcp-client-id",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            client_id: "webflow-mcp-client-id",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            access_token: "wf-access-123",
            refresh_token: "wf-refresh-123",
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const provider = await resolveOAuthProvider(repository, "webflow");
    expect(provider).toBeTruthy();

    const start = provider!.startAuth({
      state: "state-123",
      redirectUri: "https://context.test/api/oauth/webflow/callback",
    });
    const authorizationUrl = new URL(start.authorizationUrl);
    expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(
      "https://mcp.webflow.com/oauth/authorize",
    );
    expect(authorizationUrl.searchParams.get("client_id")).toBe(
      "webflow-mcp-client-id",
    );
    expect(authorizationUrl.searchParams.get("scope")).toBeNull();
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");

    const exchange = await provider!.exchangeCode({
      code: "code-123",
      redirectUri: "https://context.test/api/oauth/webflow/callback",
      codeVerifier: start.codeVerifier,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [registrationUrl, registrationInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(registrationUrl).toBe("https://mcp.webflow.com/oauth/register");
    expect(String(registrationInit.body)).toContain(
      '"token_endpoint_auth_method":"none"',
    );

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(tokenUrl).toBe("https://mcp.webflow.com/oauth/token");
    expect(tokenInit.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect((tokenInit.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(String(tokenInit.body)).toContain("client_id=webflow-mcp-client-id");
    expect(String(tokenInit.body)).not.toContain("client_secret=");
    expect(exchange).toMatchObject({
      accessToken: "wf-access-123",
      refreshToken: "wf-refresh-123",
      displayName: "Webflow",
    });
  });

  it("normalizes upstream token exchange failures into context layer errors", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(createManagedConnector());

    const fetchMock = vi.fn(async () =>
      new Response("provider denied", {
        status: 401,
        statusText: "Unauthorized",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = await resolveOAuthProvider(repository, "acme-crm");

    await expect(
      provider!.exchangeCode({
        code: "bad-code",
        redirectUri: "https://context.test/api/oauth/acme-crm/callback",
      }),
    ).rejects.toThrowError(
      new ContextLayerError("Acme CRM token exchange failed (401): provider denied", 502),
    );
  });

  it("returns null when the connector is disabled, missing, or not OAuth-enabled", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector(createManagedConnector());
    await repository.upsertManagedConnector(
      createManagedConnector({
        slug: "notion",
        name: "Notion",
        provider: "mcp",
        serverUrl: "https://mcp.notion.com/mcp",
        enabled: false,
      }),
    );
    await repository.upsertManagedConnector(
      createManagedConnector({
        slug: "slack-token",
        name: "Slack token",
        authModes: ["bearer"],
        authStrategy: "bearer",
        oauthConfigured: false,
        oauthConfig: undefined,
        credentialLabel: "Slack token",
        credentialPlaceholder: "Slack token",
        credentialHelp: "Use a bearer token.",
      }),
    );

    await expect(resolveOAuthProvider(repository, "notion")).resolves.toBeNull();
    await expect(resolveOAuthProvider(repository, "slack-token")).resolves.toBeNull();
    await expect(resolveOAuthProvider(repository, "github")).resolves.toBeNull();
    await expect(isOAuthProviderResolvedAndConfigured(repository, "acme-crm")).resolves.toBe(
      true,
    );
    await expect(
      isOAuthProviderResolvedAndConfigured(repository, "slack-token"),
    ).resolves.toBe(false);
  });
});

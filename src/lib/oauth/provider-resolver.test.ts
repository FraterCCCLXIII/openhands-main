import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContextRepository } from "@/src/lib/core/repository";
import { encryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://provider-resolver-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testRepo = ctx.repository;
  testCleanup = ctx.cleanup;
});
afterEach(async () => {
  await testCleanup();
  vi.unstubAllGlobals();
});

describe("resolveOAuthProvider", () => {
  it("builds a generic OAuth provider from a managed connector record", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector({
      slug: "acme-crm",
      name: "Acme CRM",
      description: "Configurable CRM connector",
      categories: ["CRM"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Connect Acme CRM",
      credentialPlaceholder: "Connect Acme CRM",
      credentialHelp: "Use OAuth to connect Acme CRM.",
      serverUrl: "https://mcp.acme.test/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.acme.test/authorize",
        tokenUrl: "https://auth.acme.test/token",
        scopes: ["contacts.read", "contacts.write"],
        scopeSeparator: "space",
        clientAuthentication: "body",
        pkce: true,
      },
      encryptedOAuthClient: encryptCredentials({
        clientId: "acme-client-id",
        clientSecret: "acme-client-secret",
      }),
      tools: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

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

  it("dynamically registers public MCP OAuth clients and exchanges tokens without basic auth", async () => {
    const repository = testRepo;
    await repository.upsertManagedConnector({
      slug: "webflow",
      name: "Webflow",
      description: "Managed Webflow MCP",
      categories: ["CMS", "Marketing"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Connect Webflow",
      credentialPlaceholder: "Connect Webflow",
      credentialHelp: "Use OAuth to connect Webflow.",
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
      tools: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

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
    const [registrationUrl, registrationInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
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


  it("returns null when no enabled managed OAuth connector exists for the provider", async () => {
    const repository = testRepo;

    await repository.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Managed Notion MCP",
      categories: ["Knowledge base"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: false,
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Use OAuth to connect Notion.",
      serverUrl: "https://mcp.notion.com/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.managed-notion.test/authorize",
        tokenUrl: "https://auth.managed-notion.test/token",
        scopes: ["workspace.read"],
      },
      tools: [],
      enabled: false,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    await expect(resolveOAuthProvider(repository, "notion")).resolves.toBeNull();
    await expect(resolveOAuthProvider(repository, "github")).resolves.toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { encryptCredentials } from "@/src/lib/credential-crypto";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveOAuthProvider", () => {
  it("builds a generic OAuth provider from a managed connector record", async () => {
    const repository = new MemoryRepository();
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
      functions: [],
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

  it("prefers an enabled managed connector over a static provider with the same slug", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Managed Notion MCP",
      categories: ["Knowledge base"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Use OAuth to connect Notion.",
      serverUrl: "https://mcp.notion.com/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.managed-notion.test/authorize",
        tokenUrl: "https://auth.managed-notion.test/token",
        scopes: ["workspace.read"],
      },
      encryptedOAuthClient: encryptCredentials({
        clientId: "managed-notion-client-id",
        clientSecret: "managed-notion-client-secret",
      }),
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    const provider = await resolveOAuthProvider(repository, "notion");
    expect(provider).toBeTruthy();

    const start = provider!.startAuth({
      state: "state-456",
      redirectUri: "https://context.test/api/oauth/notion/callback",
    });
    const authorizationUrl = new URL(start.authorizationUrl);

    expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(
      "https://auth.managed-notion.test/authorize",
    );
    expect(authorizationUrl.searchParams.get("client_id")).toBe("managed-notion-client-id");
    expect(authorizationUrl.searchParams.get("scope")).toBe("workspace.read");
  });
});

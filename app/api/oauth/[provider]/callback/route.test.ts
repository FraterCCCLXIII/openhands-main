import { afterEach, describe, expect, it, vi } from "vitest";

import { encryptCredentials } from "@/src/lib/credential-crypto";
import { MemoryRepository } from "@/src/lib/db/memory-repository";

const resetRuntimeService = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const setRuntimeRepository = (repository: MemoryRepository) => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  runtime.contextLayerRepository = repository;
  delete runtime.contextLayerService;
};

const seedManagedNotion = async (repository: MemoryRepository) => {
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
};

const saveOAuthState = async (repository: MemoryRepository) => {
  await seedManagedNotion(repository);
  await repository.saveOAuthState({
    state: "state-123",
    ownerId: "dev@localhost",
    integrationKey: "notion",
    provider: "notion",
    redirectTo: "/admin?section=integrations",
    redirectUri: "https://openhands-context-layer.vercel.app/api/oauth/notion/callback",
    callbackUrl: "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback",
    createdAt: "2026-03-09T00:00:00.000Z",
    expiresAt: "2999-03-09T00:10:00.000Z",
  });
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  resetRuntimeService();
});

describe("GET /api/oauth/[provider]/callback", () => {
  it("proxies stable-domain callbacks back to the preview deployment callback URL", async () => {
    vi.stubEnv(
      "AUTH_REDIRECT_PROXY_URL",
      "https://openhands-context-layer.vercel.app/api/auth",
    );

    const repository = new MemoryRepository();
    await saveOAuthState(repository);
    setRuntimeRepository(repository);

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "https://openhands-context-layer.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
    );
    expect(await repository.getOAuthState("state-123")).toMatchObject({
      callbackUrl: "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback",
    });
  });

  it("exchanges the code with the stable redirect URI after the preview callback resumes", async () => {
    vi.stubEnv(
      "AUTH_REDIRECT_PROXY_URL",
      "https://openhands-context-layer.vercel.app/api/auth",
    );

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "access-123",
          token_type: "Bearer",
          scope: "workspace.read",
          workspace_name: "Team Notion",
          workspace_id: "workspace-123",
          bot_id: "bot-123",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const repository = new MemoryRepository();
    await saveOAuthState(repository);
    setRuntimeRepository(repository);

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/admin?section=integrations&oauth_provider=notion&oauth_status=connected",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://auth.managed-notion.test/token");
    expect(String(init.body)).toContain("code=code-123");
    expect(String(init.body)).toContain(
      "redirect_uri=https%3A%2F%2Fopenhands-context-layer.vercel.app%2Fapi%2Foauth%2Fnotion%2Fcallback",
    );
    expect(String(init.body)).not.toContain("client_id=");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: expect.stringMatching(/^Basic\s+/),
    });
    expect(await repository.getOAuthState("state-123")).toBeNull();
  });
});

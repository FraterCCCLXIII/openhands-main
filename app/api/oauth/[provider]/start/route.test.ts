import { afterEach, describe, expect, it, vi } from "vitest";

import { encryptCredentials } from "@/src/lib/credential-crypto";
import { MemoryRepository } from "@/src/lib/db/memory-repository";

const { getCurrentUserIdentityMock } = vi.hoisted(() => ({
  getCurrentUserIdentityMock: vi.fn(async () => ({
    ownerId: "dev@localhost",
    user: {
      email: "dev@localhost",
      name: "Local Dev User",
    },
  })),
}));

vi.mock("@/src/lib/current-user", () => ({
  getCurrentUserIdentity: getCurrentUserIdentityMock,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
  getCurrentUserIdentityMock.mockClear();
});

describe("GET /api/oauth/[provider]/start", () => {
  it("redirects back to the admin UI with an error when OAuth is not configured", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    vi.stubEnv("NOTION_CLIENT_ID", "");
    vi.stubEnv("NOTION_CLIENT_SECRET", "");

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/oauth/notion/start?integrationKey=notion&redirectTo=%2Fadmin%3Fsection%3Dintegrations%26showIntegrationWizard%3D1%26builtIn%3Dnotion",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain(
      "/admin?section=integrations&showIntegrationWizard=1&builtIn=notion",
    );
    expect(location).toContain("oauth_provider=notion");
    expect(location).toContain("oauth_status=error");
    expect(new URL(location ?? "http://localhost").searchParams.get("oauth_error")).toBe(
      "NOTION_CLIENT_ID is not configured.",
    );
  });

  it("uses the stable redirect proxy domain for service OAuth callbacks on preview deployments", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    vi.stubEnv("NOTION_CLIENT_ID", "notion-client-id");
    vi.stubEnv("AUTH_REDIRECT_PROXY_URL", "https://openhands-context-layer.vercel.app/api/auth");
    vi.stubEnv("VERCEL_URL", "context-layer-git-feature.vercel.app");

    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://context-layer-git-feature.vercel.app/api/oauth/notion/start?integrationKey=notion"),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    expect(new URL(location ?? "http://localhost").searchParams.get("redirect_uri")).toBe(
      "https://openhands-context-layer.vercel.app/api/oauth/notion/callback",
    );
  });

  it("prefers a managed connector over the static Notion provider when starting OAuth", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    vi.stubEnv("NOTION_CLIENT_ID", "");
    vi.stubEnv("NOTION_CLIENT_SECRET", "");

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

    const runtime = globalThis as typeof globalThis & {
      contextLayerRepository?: unknown;
      contextLayerService?: unknown;
    };
    runtime.contextLayerRepository = repository;
    delete runtime.contextLayerService;

    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost:3000/api/oauth/notion/start?integrationKey=notion"),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    expect(location).toContain("https://auth.managed-notion.test/authorize");
    expect(new URL(location ?? "http://localhost").searchParams.get("client_id")).toBe(
      "managed-notion-client-id",
    );
  });
});

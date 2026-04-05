import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContextRepository } from "@/src/lib/core/repository";
import { encryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

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

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://oauth-start-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testRepo = ctx.repository;
  testCleanup = ctx.cleanup;
});

const setRuntimeRepository = (repository?: ContextRepository) => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };

  if (repository) {
    runtime.contextLayerRepository = repository;
  } else {
    delete runtime.contextLayerRepository;
  }
  delete runtime.contextLayerService;
};

const seedManagedNotion = async () => {
  const repository = testRepo;
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
    tools: [],
    enabled: true,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
  });

  setRuntimeRepository(repository);
  return repository;
};

afterEach(async () => {
  vi.resetModules();
  setRuntimeRepository();
  getCurrentUserIdentityMock.mockClear();
  await testCleanup();
});

describe("GET /api/oauth/[provider]/start", () => {
  it("returns 404 when no managed OAuth connector exists for the provider", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/oauth/notion/start?integrationKey=notion&redirectTo=%2Fintegrations%3FshowIntegrationWizard%3D1%26builtIn%3Dnotion",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Unknown OAuth provider 'notion'.",
    });
  });

  it("uses the stable redirect proxy domain for managed service OAuth callbacks on preview deployments", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    vi.stubEnv(
      "AUTH_REDIRECT_PROXY_URL",
      "https://openhands-context-layer.vercel.app/api/auth",
    );
    vi.stubEnv("VERCEL_URL", "context-layer-git-feature.vercel.app");
    await seedManagedNotion();

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "https://context-layer-git-feature.vercel.app/api/oauth/notion/start?integrationKey=notion",
      ),
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

  it("starts OAuth using the managed connector configuration", async () => {
    vi.stubEnv("DISABLE_AUTH", "true");
    await seedManagedNotion();

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

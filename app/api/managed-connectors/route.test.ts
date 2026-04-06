import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET as getBuiltInConnectors } from "@/app/api/integrations/built-in-connectors/route";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import { GET, POST } from "./route";

let testCleanup: () => Promise<void>;
beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://managed-connectors-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const createManagedConnectorRequest = () =>
  new Request("http://localhost:3000/api/managed-connectors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug: "acme-crm",
      name: "Acme CRM",
      description: "Configurable CRM connector",
      categories: ["CRM"],
      authStrategy: "oauth2",
      provider: "mcp",
      credentialLabel: "Connect Acme CRM",
      credentialPlaceholder: "Connect Acme CRM",
      credentialHelp: "Use OAuth to connect Acme CRM.",
      serverUrl: "https://mcp.acme.test/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.acme.test/authorize",
        tokenUrl: "https://auth.acme.test/token",
        scopes: ["contacts.read"],
      },
      oauthClientId: "acme-client-id",
      oauthClientSecret: "acme-client-secret",
      tools: [],
    }),
  });

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  resetRuntime();
  await testCleanup();
});

describe("/api/managed-connectors", () => {
  it("stores a managed connector for allowlisted app administrators and exposes it through the built-in catalog", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");

    const response = await POST(createManagedConnectorRequest());

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      slug: string;
      provider?: string;
      serverUrl?: string;
      oauthConfigured?: boolean;
      encryptedOAuthClient?: string;
    };
    expect(body).toMatchObject({
      slug: "acme-crm",
      provider: "mcp",
      serverUrl: "https://mcp.acme.test/mcp",
      oauthConfigured: true,
    });
    expect(body.encryptedOAuthClient).toBeUndefined();

    const listResponse = await GET();
    const connectors = (await listResponse.json()) as Array<{ slug: string }>;
    expect(connectors.some((connector) => connector.slug === "acme-crm")).toBe(true);

    const builtInResponse = await getBuiltInConnectors();
    const builtIns = (await builtInResponse.json()) as Array<{
      slug: string;
      oauthConfigured?: boolean;
    }>;
    expect(builtIns).toContainEqual(
      expect.objectContaining({
        slug: "acme-crm",
        oauthConfigured: true,
      }),
    );
  });

  it("rejects managed connector registration for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await POST(createManagedConnectorRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can register managed connectors.",
    });
  });


  it("rejects registration in production when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");

    const response = await POST(createManagedConnectorRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Managed connector registration requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
    });
  });

});

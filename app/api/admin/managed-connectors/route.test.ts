import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET, POST } from "./route";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

let testCleanup: () => Promise<void>;

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-managed-connectors-test");
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

const createManagedConnectorRequest = (apiKey: string) =>
  new Request("http://localhost:3000/api/admin/managed-connectors", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
      functions: [],
    }),
  });

describe("/api/admin/managed-connectors", () => {
  it("stores and lists managed connectors for authenticated admin API keys", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await POST(createManagedConnectorRequest(apiKey));

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

    const listResponse = await GET(
      new Request("http://localhost:3000/api/admin/managed-connectors", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );
    const connectors = (await listResponse.json()) as Array<{ slug: string }>;
    expect(connectors.some((connector) => connector.slug === "acme-crm")).toBe(true);
  });

  it("rejects requests without an admin API key", async () => {
    const response = await GET(new Request("http://localhost:3000/api/admin/managed-connectors"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Provide a valid admin API key in the Authorization bearer header or X-API-Key.",
    });
  });
});

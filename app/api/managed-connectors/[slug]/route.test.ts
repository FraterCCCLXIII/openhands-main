import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { POST } from "@/app/api/managed-connectors/route";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import { DELETE } from "./route";

let testCleanup: () => Promise<void>;
beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://managed-slug-test"); });
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

describe("DELETE /api/managed-connectors/[slug]", () => {
  it("deletes a managed connector for allowlisted app administrators", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");

    await POST(createManagedConnectorRequest());

    const response = await DELETE(new Request("http://localhost:3000/api/managed-connectors/acme-crm", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ slug: "acme-crm" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deleted: true,
      slug: "acme-crm",
    });
  });

  it("rejects deletion for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await DELETE(new Request("http://localhost:3000/api/managed-connectors/acme-crm", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ slug: "acme-crm" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can delete managed connectors.",
    });
  });
});

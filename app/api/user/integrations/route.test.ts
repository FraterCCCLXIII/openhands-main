import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET, POST } from "./route";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationSpec } from "@/src/types/context-layer";

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-integrations-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

const integration: IntegrationSpec = {
  key: "slack",
  name: "Slack",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: {
    managedConnectorSlug: "slack",
  },
  credentials: {},
  tools: {
    send_message: {
      name: "send_message",
      description: "Send a message",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["chat:write"],
      executionMode: "provider",
      config: {},
    },
  },
};

describe("/api/user/integrations", () => {
  it("lists integrations for the authenticated user", async () => {
    const service = getContextLayerService();
    await service.registerOwnerIntegration("owner@example.com", integration);
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await GET(
      new Request("http://localhost/api/user/integrations", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      {
        key: "slack",
      },
    ]);
  });

  it("creates or updates an integration for the authenticated user", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await POST(
      new Request("http://localhost/api/user/integrations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(integration),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      key: "slack",
    });
    await expect(service.listOwnerIntegrations("owner@example.com")).resolves.toMatchObject([
      {
        key: "slack",
      },
    ]);
  });

  it("rejects non-admin user API attempts to save raw connector endpoints", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await POST(
      new Request("http://localhost/api/user/integrations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "custom-http",
          name: "Custom HTTP",
          kind: "api",
          provider: "http",
          authStrategy: "none",
          enabled: true,
          fineGrainedPermissions: true,
          config: {
            apiBaseUrl: "https://tenant-controlled.example/api",
          },
          credentials: {},
          tools: {},
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Only app administrators can install integrations from arbitrary connector URLs. Use a managed connector instead.",
    });
  });

  it("allows admin users to save raw connector endpoints via user API", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    const { apiKey } = await service.rotateUserApiKey("admin@example.com");

    const response = await POST(
      new Request("http://localhost/api/user/integrations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "custom-http",
          name: "Custom HTTP",
          kind: "api",
          provider: "http",
          authStrategy: "none",
          enabled: true,
          fineGrainedPermissions: true,
          config: {
            apiBaseUrl: "https://internal.example/api",
          },
          credentials: {},
          tools: {},
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      key: "custom-http",
      config: { apiBaseUrl: "https://internal.example/api" },
    });
  });

});

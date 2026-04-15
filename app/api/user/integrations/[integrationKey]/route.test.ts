import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { DELETE } from "./route";

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-integration-delete-route-test");
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
  config: {},
  credentials: {},
  tools: {},
};

describe("DELETE /api/user/integrations/[integrationKey]", () => {
  it("deletes an integration for the authenticated user", async () => {
    const service = getContextLayerService();
    await service.registerOwnerIntegration("owner@example.com", integration);
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await DELETE(
      new Request("http://localhost/api/user/integrations/slack", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
      {
        params: Promise.resolve({ integrationKey: "slack" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      deleted: true,
      key: "slack",
    });
    await expect(service.listOwnerIntegrations("owner@example.com")).resolves.toEqual([]);
  });
});

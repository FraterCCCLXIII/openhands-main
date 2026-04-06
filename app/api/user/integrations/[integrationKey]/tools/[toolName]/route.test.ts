import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { PATCH } from "./route";

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-integration-route-test");
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

describe("PATCH /api/user/integrations/[integrationKey]/tools/[toolName]", () => {
  it("updates the authenticated user's tool access mode", async () => {
    const service = getContextLayerService();
    await service.registerOwnerIntegration("owner@example.com", integration);
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await PATCH(
      new Request("http://localhost/api/user/integrations/slack/tools/send_message", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessMode: "approval_required" }),
      }),
      {
        params: Promise.resolve({
          integrationKey: "slack",
          toolName: "send_message",
        }),
      },
    );
    const body = (await response.json()) as {
      accessMode: string;
      enabled: boolean;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      accessMode: "approval_required",
      enabled: true,
    });
    await expect(
      service.listOwnerIntegrations("owner@example.com"),
    ).resolves.toMatchObject([
      {
        tools: {
          send_message: {
            accessMode: "approval_required",
          },
        },
      },
    ]);
  });

  it("rejects revoked user API keys immediately", async () => {
    const service = getContextLayerService();
    await service.registerOwnerIntegration("owner@example.com", integration);
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");
    await service.revokeUserApiKey("owner@example.com");

    const response = await PATCH(
      new Request("http://localhost/api/user/integrations/slack/tools/send_message", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessMode: "disabled" }),
      }),
      {
        params: Promise.resolve({
          integrationKey: "slack",
          toolName: "send_message",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer realm="context-layer-user-api"',
    );
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Provide a valid user API key in the Authorization bearer header or X-API-Key.",
    });
  });
});

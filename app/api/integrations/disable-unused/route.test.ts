import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { POST } from "./route";

import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationSpec } from "@/src/types/context-layer";

let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://disable-unused-route-test");
});

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

const createIntegration = (
  overrides: Partial<IntegrationSpec> &
    Pick<
      IntegrationSpec,
      "key" | "name" | "kind" | "provider" | "authStrategy"
    >,
): IntegrationSpec => ({
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {},
  ...overrides,
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  resetRuntime();
  await testCleanup();
});

describe("POST /api/integrations/disable-unused", () => {
  it("disables only enabled functions whose tracked usage is older than the cutoff", async () => {
    const repository = getContextLayerRepository();

    await repository.upsertOwnerIntegration(
      "user@example.com",
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        functions: {
          staleRead: {
            name: "staleRead",
            description: "Stale function",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:read"],
            executionMode: "provider",
            config: {},
          },
          recentWrite: {
            name: "recentWrite",
            description: "Recent function",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:write"],
            executionMode: "provider",
            config: {},
          },
          alreadyDisabled: {
            name: "alreadyDisabled",
            description: "Disabled function",
            enabled: false,
            accessMode: "disabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      }),
    );

    await repository.createToolInvocation({
      id: "stale-invocation",
      ownerId: "user@example.com",
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      functionName: "staleRead",
      scopes: ["repo:read"],
      provider: "mcp",
      kind: "mcp",
      authStrategy: "bearer",
      outcome: "success",
      invokedAt: "2026-01-01T00:00:00.000Z",
      durationMs: 10,
      payloadKeys: [],
    });
    await repository.createToolInvocation({
      id: "recent-invocation",
      ownerId: "user@example.com",
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      functionName: "recentWrite",
      scopes: ["repo:write"],
      provider: "mcp",
      kind: "mcp",
      authStrategy: "bearer",
      outcome: "success",
      invokedAt: "2026-03-25T00:00:00.000Z",
      durationMs: 10,
      payloadKeys: [],
    });

    vi.setSystemTime(new Date("2026-03-29T00:00:00.000Z"));

    const response = await POST(
      new Request("http://localhost/api/integrations/disable-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thresholdValue: 30, thresholdUnit: "days" }),
      }),
    );
    const body = (await response.json()) as {
      disabledCount: number;
      disabledFunctions: Array<{ integrationKey: string; functionName: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.disabledCount).toBe(1);
    expect(body.disabledFunctions).toEqual([
      { integrationKey: "github", functionName: "staleRead", lastInvokedAt: "2026-01-01T00:00:00.000Z" },
    ]);

    const updated = await repository.getOwnerIntegration("user@example.com", "github");
    expect(updated?.functions.staleRead).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
    expect(updated?.functions.recentWrite).toMatchObject({
      accessMode: "enabled",
      enabled: true,
    });
    expect(updated?.functions.alreadyDisabled).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
  });
});

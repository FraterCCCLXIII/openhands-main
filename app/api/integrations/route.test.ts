import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET, POST } from "./route";

import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { getActiveSql, createTestRepository } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationSpec } from "@/src/types/context-layer";

let testCleanup: () => Promise<void>;
let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://integrations-route-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
  consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
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
  overrides: Partial<IntegrationSpec> & Pick<IntegrationSpec, "key" | "name" | "kind" | "provider" | "authStrategy">,
): IntegrationSpec => ({
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  tools: {},
  ...overrides,
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  consoleInfoSpy.mockRestore();
  resetRuntime();
  await testCleanup();
});

describe("GET /api/integrations", () => {
  it("returns only integrations installed for the current non-admin user", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const repository = getContextLayerRepository();

    await repository.upsertOwnerIntegration(
      "user@example.com",
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        tools: {
          listRepos: {
            name: "listRepos",
            description: "List repositories",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:read"],
            executionMode: "provider",
            config: {},
          },
        },
      }),
    );
    await repository.upsertOwnerIntegration(
      "user@example.com",
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
      }),
    );
    await repository.upsertOwnerIntegration(
      "user@example.com",
      createIntegration({
        key: "notion",
        name: "Notion",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: false,
      }),
    );
    await repository.createToolInvocation({
      id: "invoke-1",
      ownerId: "user@example.com",
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "listRepos",
      scopes: ["repo:read"],
      provider: "mcp",
      kind: "mcp",
      authStrategy: "bearer",
      outcome: "success",
      invokedAt: "2026-03-20T10:00:00.000Z",
      durationMs: 42,
      payloadKeys: ["limit"],
    });

    const response = await GET();
    const body = (await response.json()) as Array<{
      key: string;
      tools: Record<
        string,
        { lastInvokedAt?: string; invocationCount?: number; lastInvocationOutcome?: string }
      >;
    }>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject([
      expect.objectContaining({ key: "github" }),
      expect.objectContaining({ key: "notion" }),
      expect.objectContaining({ key: "slack" }),
    ]);
    expect(body.map((integration) => integration.key)).toEqual([
      "github",
      "notion",
      "slack",
    ]);
    expect(body[0]?.tools.listRepos).toMatchObject({
      invocationCount: 1,
      lastInvocationOutcome: "success",
      lastInvokedAt: "2026-03-20T10:00:00.000Z",
    });
  });

  it("returns the same personal integration view for app administrators", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
    const repository = getContextLayerRepository();

    await repository.upsertOwnerIntegration(
      "admin@example.com",
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
      }),
    );

    const response = await GET();
    const body = (await response.json()) as Array<{ key: string }>;

    expect(response.status).toBe(200);
    expect(body.map((integration) => integration.key)).toEqual(["github"]);
  });

  it("rejects non-admin attempts to save raw connector endpoints", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const response = await POST(
      new Request("http://localhost/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          createIntegration({
            key: "custom-mcp",
            name: "Custom MCP",
            kind: "mcp",
            provider: "mcp",
            authStrategy: "none",
            config: {
              serverUrl: "https://tenant-controlled.example/mcp",
            },
          }),
        ),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Only app administrators can install integrations from arbitrary connector URLs. Use a managed connector instead.",
    });
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      "[route]",
      expect.objectContaining({
        route: "/api/integrations",
        event: "create_failed",
        ownerId: "user@example.com",
        integrationKey: "custom-mcp",
        errorMessage:
          "Only app administrators can install integrations from arbitrary connector URLs. Use a managed connector instead.",
        statusCode: 403,
      }),
    );
  });

  it("allows admin users to save raw connector endpoints", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const response = await POST(
      new Request("http://localhost/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          createIntegration({
            key: "custom-mcp",
            name: "Custom MCP",
            kind: "mcp",
            provider: "mcp",
            authStrategy: "none",
            config: {
              serverUrl: "https://internal.example/mcp",
            },
          }),
        ),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      key: "custom-mcp",
      config: { serverUrl: "https://internal.example/mcp" },
    });
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      "[route]",
      expect.objectContaining({
        route: "/api/integrations",
        event: "create_succeeded",
        ownerId: "admin@example.com",
        integrationKey: "custom-mcp",
      }),
    );
  });

});

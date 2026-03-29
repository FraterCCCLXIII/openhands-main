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
  vi.stubEnv("POSTGRES_URL", "pglite://admin-function-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://admin-function-route-test");
  await testCleanup();
});

const integration: IntegrationSpec = {
  key: "github",
  name: "GitHub",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "bearer",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {
    create_issue: {
      name: "create_issue",
      description: "Create a GitHub issue",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["issues:write"],
      executionMode: "provider",
      config: {},
    },
  },
};

describe("PATCH /api/admin/integrations/[integrationKey]/functions/[functionName]", () => {
  it("rejects requests without an admin API key", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/integrations/github/functions/create_issue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessMode: "disabled" }),
      }),
      {
        params: Promise.resolve({
          integrationKey: "github",
          functionName: "create_issue",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain(
      "context-layer-admin-api",
    );
  });

  it("updates only the authenticated admin user's integration function access mode", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    await service.registerOwnerIntegration("admin@example.com", integration);
    await service.registerOwnerIntegration("other-admin@example.com", {
      ...integration,
      functions: {
        ...integration.functions,
        create_issue: {
          ...integration.functions.create_issue,
          accessMode: "disabled",
          enabled: false,
        },
      },
    });
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await PATCH(
      new Request("http://localhost/api/admin/integrations/github/functions/create_issue", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessMode: "approval_required" }),
      }),
      {
        params: Promise.resolve({
          integrationKey: "github",
          functionName: "create_issue",
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

    await expect(service.listOwnerIntegrations("admin@example.com")).resolves.toMatchObject([
      {
        key: "github",
        functions: {
          create_issue: {
            accessMode: "approval_required",
            enabled: true,
          },
        },
      },
    ]);
    await expect(
      service.listOwnerIntegrations("other-admin@example.com"),
    ).resolves.toMatchObject([
      {
        key: "github",
        functions: {
          create_issue: {
            accessMode: "disabled",
            enabled: false,
          },
        },
      },
    ]);
  });
});

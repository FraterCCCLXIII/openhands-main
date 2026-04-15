import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { PATCH } from "./route";

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

describe("PATCH /api/admin/integrations/[integrationKey]/tools/[toolName]", () => {
  it("rejects requests without an admin API key", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/integrations/github/tools/create_issue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessMode: "disabled" }),
      }),
      {
        params: Promise.resolve({
          integrationKey: "github",
          toolName: "create_issue",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain(
      "context-layer-admin-api",
    );
  });

  it("returns gone and directs callers to the user API", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await PATCH(
      new Request("http://localhost/api/admin/integrations/github/tools/create_issue", {
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
          toolName: "create_issue",
        }),
      },
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Admin API keys can no longer update self-scoped tool access. Use the user API key with /api/user/integrations/{integrationKey}/tools/{toolName} instead.",
    });
  });
});

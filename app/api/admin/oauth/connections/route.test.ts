import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET } from "./route";

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
  vi.stubEnv("POSTGRES_URL", "pglite://deprecated-admin-connections-route-test");
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

describe("GET /api/admin/oauth/connections", () => {
  it("returns gone and directs callers to the user API", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await GET(
      new Request("http://localhost/api/admin/oauth/connections", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Admin API keys can no longer read self-scoped OAuth connections. Use the user API key with /api/user/connections instead.",
    });
  });
});

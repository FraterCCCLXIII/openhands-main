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
  vi.stubEnv("POSTGRES_URL", "pglite://deprecated-admin-integrations-route-test");
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

describe("/api/admin/integrations", () => {
  it("returns gone for GET and directs callers to the user API", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await GET!(
      new Request("http://localhost/api/admin/integrations", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );
    if (!response) {
      throw new Error("Missing GET response");
    }

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Admin API keys can no longer manage self-scoped integrations. Use the user API key with /api/user/integrations instead.",
    });
  });

  it("returns gone for POST and directs callers to the user API", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await POST!(
      new Request("http://localhost/api/admin/integrations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "slack" }),
      }),
    );
    if (!response) {
      throw new Error("Missing POST response");
    }

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Admin API keys can no longer manage self-scoped integrations. Use the user API key with /api/user/integrations instead.",
    });
  });
});

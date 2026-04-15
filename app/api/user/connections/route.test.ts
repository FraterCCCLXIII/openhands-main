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
  vi.stubEnv("POSTGRES_URL", "pglite://user-connections-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

describe("GET /api/user/connections", () => {
  it("lists saved integration connection statuses for the authenticated user", async () => {
    const service = getContextLayerService();
    await service.saveOAuthConnection(
      "owner@example.com",
      "slack",
      "slack",
      {
        accessToken: "xoxp-secret-token",
        refreshToken: "refresh-secret-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["chat:write"],
        metadata: { team: { id: "T123", name: "Workspace" } },
      },
    );
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await GET(
      new Request("http://localhost/api/user/connections", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      {
        integrationKey: "slack",
        provider: "slack",
        tokenType: "Bearer",
        scopes: ["chat:write"],
      },
    ]);
  });
});

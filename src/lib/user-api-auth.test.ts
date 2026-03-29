import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  USER_API_ADMIN_REQUIRED_DETAIL,
  USER_API_UNAUTHORIZED_DETAIL,
  authenticateUserApiRequest,
} from "@/src/lib/user-api-auth";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-api-auth-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://user-api-auth-test");
  await testCleanup();
});

describe("user-api-auth", () => {
  it("authenticates valid user API keys", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    await expect(
      authenticateUserApiRequest(
        new Request("http://localhost/api/user/integrations", {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      ),
    ).resolves.toEqual({
      ownerId: "owner@example.com",
      email: "owner@example.com",
      isAdmin: false,
    });
  });

  it("rejects missing or invalid user API keys", async () => {
    await expect(
      authenticateUserApiRequest(
        new Request("http://localhost/api/user/integrations"),
      ),
    ).rejects.toMatchObject({
      message: USER_API_UNAUTHORIZED_DETAIL,
      statusCode: 401,
    });

    await expect(
      authenticateUserApiRequest(
        new Request("http://localhost/api/user/integrations", {
          headers: { Authorization: "Bearer not-a-real-user-key" },
        }),
      ),
    ).rejects.toMatchObject({
      message: USER_API_UNAUTHORIZED_DETAIL,
      statusCode: 401,
    });
  });

  it("enforces admin-only user API endpoints", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    const userKey = (await service.rotateUserApiKey("owner@example.com")).apiKey;
    const adminKey = (await service.rotateUserApiKey("admin@example.com")).apiKey;

    await expect(
      authenticateUserApiRequest(
        new Request("http://localhost/api/user/access-requests", {
          headers: { Authorization: `Bearer ${userKey}` },
        }),
        { requireAdmin: true },
      ),
    ).rejects.toMatchObject({
      message: USER_API_ADMIN_REQUIRED_DETAIL,
      statusCode: 403,
    });

    await expect(
      authenticateUserApiRequest(
        new Request("http://localhost/api/user/access-requests", {
          headers: { Authorization: `Bearer ${adminKey}` },
        }),
        { requireAdmin: true },
      ),
    ).resolves.toMatchObject({
      ownerId: "admin@example.com",
      isAdmin: true,
    });
  });
});

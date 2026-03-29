import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getCurrentUserIdentityMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<{ user: { email: string } } | null>>(
    async () => ({ user: { email: "admin@example.com" } }),
  ),
  getCurrentUserIdentityMock: vi.fn(async () => ({
    ownerId: "admin@example.com",
    user: { email: "admin@example.com", name: "Admin User" },
  })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

vi.mock("@/src/lib/current-user", () => ({
  getCurrentUserIdentity: getCurrentUserIdentityMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { DELETE, GET, POST } from "./route";

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
  vi.stubEnv("POSTGRES_URL", "pglite://admin-key-route-test");
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  getCurrentUserIdentityMock.mockReset();
  getCurrentUserIdentityMock.mockResolvedValue({
    ownerId: "admin@example.com",
    user: { email: "admin@example.com", name: "Admin User" },
  });
  resetRuntime();
  await testCleanup();
});

describe("/api/admin/key", () => {
  it("returns metadata plus the recoverable plaintext to the authenticated admin session", async () => {
    const service = getContextLayerService();
    const created = await service.rotateAdminApiKey("admin@example.com");

    const response = await GET();
    const body = (await response.json()) as {
      hasKey: boolean;
      key: { keyPrefix: string; keySuffix: string; createdAt: string; updatedAt: string } | null;
      apiKey: string | null;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      hasKey: true,
      key: created.key,
      apiKey: created.apiKey,
    });
  });

  it("creates or regenerates an admin API key for authenticated admin session use", async () => {
    const firstResponse = await POST();
    const firstBody = (await firstResponse.json()) as {
      apiKey: string;
      key: { keyPrefix: string; keySuffix: string; createdAt: string; updatedAt: string };
    };

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(firstBody.apiKey.startsWith("clad_")).toBe(true);
    expect(firstBody.key.keyPrefix).toBe(firstBody.apiKey.slice(0, 12));
    expect(firstBody.key.keySuffix).toBe(firstBody.apiKey.slice(-4));

    const secondResponse = await POST();
    const secondBody = (await secondResponse.json()) as typeof firstBody;
    const service = getContextLayerService();

    expect(secondBody.apiKey).not.toBe(firstBody.apiKey);
    expect(secondBody.key.createdAt).toBe(firstBody.key.createdAt);
    expect(await service.getStoredAdminApiKey(firstBody.apiKey)).toBeNull();
    expect(await service.getStoredAdminApiKey(secondBody.apiKey)).toMatchObject({
      ownerId: "admin@example.com",
    });
  });

  it("revokes the current admin user's key", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await DELETE();
    const body = (await response.json()) as { revoked: boolean };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ revoked: true });
    expect(await service.getStoredAdminApiKey(apiKey)).toBeNull();
  });

  it("rejects non-admin sessions", async () => {
    getCurrentUserIdentityMock.mockResolvedValue({
      ownerId: "user@example.com",
      user: { email: "user@example.com", name: "User" },
    });

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can manage admin API keys.",
    });
  });
});

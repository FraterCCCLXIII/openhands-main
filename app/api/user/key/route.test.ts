import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<{ user: { email: string } } | null>>(
    async () => ({ user: { email: "user@example.com" } }),
  ),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
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
  vi.stubEnv("POSTGRES_URL", "pglite://user-key-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  resetRuntime();
  await testCleanup();
});

describe("/api/user/key", () => {
  it("returns metadata without exposing plaintext", async () => {
    const service = getContextLayerService();
    const created = await service.rotateUserApiKey("user@example.com");

    const response = await GET();
    const body = (await response.json()) as {
      hasKey: boolean;
      key: { keyPrefix: string; createdAt: string; updatedAt: string } | null;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      hasKey: true,
      key: created.key,
    });
    expect(JSON.stringify(body)).not.toContain(created.apiKey);
  });

  it("creates or regenerates a user API key and only returns plaintext on rotate", async () => {
    const firstResponse = await POST();
    const firstBody = (await firstResponse.json()) as {
      apiKey: string;
      key: { keyPrefix: string; createdAt: string; updatedAt: string };
    };

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(firstBody.apiKey.startsWith("clu_")).toBe(true);
    expect(firstBody.key.keyPrefix).toBe(firstBody.apiKey.slice(0, 12));

    const secondResponse = await POST();
    const secondBody = (await secondResponse.json()) as typeof firstBody;
    const service = getContextLayerService();

    expect(secondBody.apiKey).not.toBe(firstBody.apiKey);
    expect(secondBody.key.createdAt).toBe(firstBody.key.createdAt);
    expect(await service.getStoredUserApiKey(firstBody.apiKey)).toBeNull();
    expect(await service.getStoredUserApiKey(secondBody.apiKey)).toMatchObject({
      ownerId: "user@example.com",
    });
  });

  it("revokes the current user's key", async () => {
    const service = getContextLayerService();
    const { apiKey } = await service.rotateUserApiKey("user@example.com");

    const response = await DELETE();
    const body = (await response.json()) as { revoked: boolean };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ revoked: true });
    expect(await service.getStoredUserApiKey(apiKey)).toBeNull();
  });

  it("requires an authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Authentication is required.",
    });
  });
});

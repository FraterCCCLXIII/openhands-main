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
  vi.stubEnv("POSTGRES_URL", "pglite://agent-key-route-test");
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

describe("/api/user/agent-key", () => {
  it("returns the current user's agent key to the authenticated session", async () => {
    const service = getContextLayerService();
    const created = await service.getOrCreateAgentApiKey("user@example.com");

    const response = await GET();
    const body = (await response.json()) as {
      ownerId: string;
      apiKey: string;
      createdAt: string;
      updatedAt: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual(created);
  });

  it("rotates the current user's agent key and invalidates the previous key", async () => {
    const service = getContextLayerService();
    const first = await service.getOrCreateAgentApiKey("user@example.com");

    const response = await POST();
    const body = (await response.json()) as typeof first;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.ownerId).toBe("user@example.com");
    expect(body.apiKey.startsWith("cla_")).toBe(true);
    expect(body.apiKey).not.toBe(first.apiKey);
    expect(body.createdAt).toBe(first.createdAt);
    expect(body.updatedAt).not.toBe(first.updatedAt);
    expect(await service.getStoredAgentApiKey(first.apiKey)).toBeNull();
    expect(await service.getStoredAgentApiKey(body.apiKey)).toMatchObject({
      ownerId: "user@example.com",
    });
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

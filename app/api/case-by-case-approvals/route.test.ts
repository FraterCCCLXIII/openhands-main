import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

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
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-route-test");
  resetRuntime();
  await testCleanup();
});

describe("/api/case-by-case-approvals", () => {
  it("rejects non-admin dashboard sessions", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can manage access requests.",
    });
  });

  it("lets allowlisted admins list existing access requests", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");
    const service = getContextLayerService();
    const created = await service.createAccessRequest({
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "delete_repo",
      scopes: ["repo:admin"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "owner@example.com" },
      justification: "Need repo cleanup access",
    });

    const listResponse = await GET();
    const listed = (await listResponse.json()) as Array<{ id: string; status: string }>;

    expect(listResponse.status).toBe(200);
    expect(listed).toContainEqual(
      expect.objectContaining({ id: created.id, status: "pending" }),
    );
  });
});

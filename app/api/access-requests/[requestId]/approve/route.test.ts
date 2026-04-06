import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { POST } from "./route";

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
  vi.stubEnv("POSTGRES_URL", "pglite://legacy-access-request-approve-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://legacy-access-request-approve-route-test");
  resetRuntime();
  await testCleanup();
});

describe("POST /api/access-requests/[requestId]/approve", () => {
  it("rejects non-admin dashboard sessions", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await POST(
      new Request("http://localhost/api/access-requests/req-1/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: 10 }),
      }),
      { params: Promise.resolve({ requestId: "req-1" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can manage access requests.",
    });
  });

  it("records the authenticated admin even when the client submits a spoofed approver", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "delete_repo",
      scopes: ["repo:admin"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: {},
      justification: "Need cleanup rights",
    });

    const response = await POST(
      new Request(`http://localhost/api/access-requests/${request.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approver: "mallory@example.com",
          durationMinutes: 10,
        }),
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );
    const grant = (await response.json()) as { grantedBy: string };

    expect(response.status).toBe(200);
    expect(grant.grantedBy).toBe("admin@example.com");
    await expect(service.listAccessRequests()).resolves.toMatchObject([
      expect.objectContaining({
        id: request.id,
        status: "approved",
        decidedBy: "admin@example.com",
      }),
    ]);
  });
});

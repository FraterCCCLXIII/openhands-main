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
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-reject-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-reject-route-test");
  resetRuntime();
  await testCleanup();
});

describe("POST /api/case-by-case-approvals/[requestId]/reject", () => {
  it("records the authenticated admin as the rejecting reviewer", async () => {
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
      new Request(`http://localhost/api/case-by-case-approvals/${request.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approver: "mallory@example.com" }),
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );
    const rejected = (await response.json()) as { decidedBy: string; status: string };

    expect(response.status).toBe(200);
    expect(rejected).toMatchObject({
      decidedBy: "admin@example.com",
      status: "rejected",
    });
  });
});

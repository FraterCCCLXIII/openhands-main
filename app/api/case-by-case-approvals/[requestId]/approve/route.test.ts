import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserIdentityMock } = vi.hoisted(() => ({
  getCurrentUserIdentityMock: vi.fn(async () => ({
    user: { email: "owner@example.com" },
    ownerId: "owner@example.com",
  })),
}));

vi.mock("@/src/lib/current-user", () => ({
  getCurrentUserIdentity: getCurrentUserIdentityMock,
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
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-approve-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  getCurrentUserIdentityMock.mockReset();
  getCurrentUserIdentityMock.mockResolvedValue({
    user: { email: "owner@example.com" },
    ownerId: "owner@example.com",
  });
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-approve-route-test");
  resetRuntime();
  await testCleanup();
});

describe("POST /api/case-by-case-approvals/[requestId]/approve", () => {
  it("approves the signed-in user's own request and derives the approver from the session", async () => {
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "delete_repo",
      scopes: ["repo:admin"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "owner@example.com" },
      justification: "Need cleanup rights",
    });

    const response = await POST(
      new Request(`http://localhost/api/case-by-case-approvals/${request.id}/approve`, {
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
    expect(grant.grantedBy).toBe("owner@example.com");
    await expect(service.listAccessRequests()).resolves.toMatchObject([
      expect.objectContaining({
        id: request.id,
        status: "approved",
        decidedBy: "owner@example.com",
      }),
    ]);
  });

  it("does not allow a user to approve another owner's request", async () => {
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-2",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "delete_repo",
      scopes: ["repo:admin"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "other@example.com" },
      justification: "Need cleanup rights",
    });

    const response = await POST(
      new Request(`http://localhost/api/case-by-case-approvals/${request.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: 10 }),
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      detail: `Unknown access request '${request.id}'.`,
    });
  });
});

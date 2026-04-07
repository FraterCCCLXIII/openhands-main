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
  getCurrentUserIdentityMock.mockReset();
  getCurrentUserIdentityMock.mockResolvedValue({
    user: { email: "owner@example.com" },
    ownerId: "owner@example.com",
  });
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://case-by-case-approvals-route-test");
  resetRuntime();
  await testCleanup();
});

describe("/api/case-by-case-approvals", () => {
  it("lists only the signed-in user's own case-by-case requests", async () => {
    const service = getContextLayerService();
    const ownRequest = await service.createAccessRequest({
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
    await service.createAccessRequest({
      agentId: "agent-2",
      agentClass: "assistant",
      integrationKey: "slack",
      toolName: "send_message",
      scopes: ["chat:write"],
      requestedMinutes: 15,
      channels: ["in_app"],
      notificationTargets: { in_app: "other@example.com" },
      justification: "Need to post updates",
    });

    const response = await GET();
    const listed = (await response.json()) as Array<{
      id: string;
      notificationTargets: { in_app?: string };
    }>;

    expect(response.status).toBe(200);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: ownRequest.id,
      notificationTargets: { in_app: "owner@example.com" },
    });
  });
});

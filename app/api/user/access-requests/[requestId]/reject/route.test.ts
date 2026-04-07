import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-reject-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://user-reject-route-test");
  await testCleanup();
});

describe("POST /api/user/access-requests/[requestId]/reject", () => {
  it("rejects the authenticated user's own request", async () => {
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "slack",
      toolName: "send_message",
      scopes: ["chat:write"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "owner@example.com" },
      justification: "Need to post updates",
    });
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await POST(
      new Request(`http://localhost/api/user/access-requests/${request.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );
    const rejected = (await response.json()) as { decidedBy: string; status: string };

    expect(response.status).toBe(200);
    expect(rejected).toMatchObject({
      decidedBy: "owner@example.com",
      status: "rejected",
    });
  });
});

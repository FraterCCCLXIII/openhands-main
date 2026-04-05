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
  vi.stubEnv("POSTGRES_URL", "pglite://admin-reject-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://admin-reject-route-test");
  await testCleanup();
});

describe("POST /api/admin/access-requests/[requestId]/reject", () => {
  it("rejects requests without an admin API key", async () => {
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "slack",
      toolName: "send_message",
      scopes: ["chat:write"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: {},
      justification: "Need to post updates",
    });

    const response = await POST(
      new Request(`http://localhost/api/admin/access-requests/${request.id}/reject`, {
        method: "POST",
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain(
      "context-layer-admin-api",
    );
  });

  it("rejects requests and records the authenticated admin API key owner as approver", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    const request = await service.createAccessRequest({
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "slack",
      toolName: "send_message",
      scopes: ["chat:write"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: {},
      justification: "Need to post updates",
    });
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await POST(
      new Request(`http://localhost/api/admin/access-requests/${request.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );
    const body = (await response.json()) as {
      id: string;
      status: string;
      decidedBy: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: request.id,
      status: "rejected",
      decidedBy: "admin@example.com",
    });

    await expect(service.listAccessRequests()).resolves.toMatchObject([
      {
        id: request.id,
        status: "rejected",
        decidedBy: "admin@example.com",
      },
    ]);
  });
});

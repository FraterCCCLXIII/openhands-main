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
  vi.stubEnv("POSTGRES_URL", "pglite://user-approval-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://user-approval-route-test");
  await testCleanup();
});

describe("POST /api/user/access-requests/[requestId]/approve", () => {
  it("requires an admin user API key", async () => {
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
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await POST(
      new Request(`http://localhost/api/user/access-requests/${request.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durationMinutes: 10 }),
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "This endpoint requires an admin user API key.",
    });
  });

  it("approves requests and records the authenticated admin as approver", async () => {
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
    const { apiKey } = await service.rotateUserApiKey("admin@example.com");

    const response = await POST(
      new Request(`http://localhost/api/user/access-requests/${request.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durationMinutes: 10 }),
      }),
      { params: Promise.resolve({ requestId: request.id }) },
    );
    const body = (await response.json()) as {
      grantedBy: string;
      expiresAt: string;
    };

    expect(response.status).toBe(200);
    expect(body.grantedBy).toBe("admin@example.com");
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());

    await expect(service.listAccessRequests()).resolves.toMatchObject([
      {
        id: request.id,
        status: "approved",
        decidedBy: "admin@example.com",
      },
    ]);
  });
});

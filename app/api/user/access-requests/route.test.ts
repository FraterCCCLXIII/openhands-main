import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
  vi.stubEnv("POSTGRES_URL", "pglite://user-access-requests-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  vi.unstubAllEnvs();
  vi.stubEnv("POSTGRES_URL", "pglite://user-access-requests-route-test");
  await testCleanup();
});

describe("GET /api/user/access-requests", () => {
  it("lists only access requests for the authenticated owner", async () => {
    const service = getContextLayerService();
    await service.createAccessRequest({
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
    const otherRequest = await service.createAccessRequest({
      agentId: "bot-2",
      agentClass: "researcher",
      integrationKey: "github",
      toolName: "delete_repo",
      scopes: ["repo:admin"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "other@example.com" },
      justification: "Need cleanup rights",
    });
    const { apiKey } = await service.rotateUserApiKey("owner@example.com");

    const response = await GET(
      new Request("http://localhost/api/user/access-requests", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );
    const body = (await response.json()) as Array<{ id: string }>;

    expect(response.status).toBe(200);
    expect(body.map((request) => request.id)).not.toContain(otherRequest.id);
    expect(body).toHaveLength(1);
  });
});

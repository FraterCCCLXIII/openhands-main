import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { DELETE } from "./route";

import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationConnectionRecord, IntegrationSpec } from "@/src/types/context-layer";

let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://integration-route-delete-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const createIntegration = (
  overrides: Partial<IntegrationSpec> &
    Pick<IntegrationSpec, "key" | "name" | "kind" | "provider" | "authStrategy">,
): IntegrationSpec => ({
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {},
  ...overrides,
});

const createConnection = (
  overrides: Partial<IntegrationConnectionRecord> &
    Pick<IntegrationConnectionRecord, "ownerId" | "integrationKey" | "provider" | "authStrategy">,
): IntegrationConnectionRecord => ({
  encryptedCredentials: "encrypted-token",
  scopes: [],
  metadata: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  resetRuntime();
  await testCleanup();
});

describe("DELETE /api/integrations/[integrationKey]", () => {
  it("removes the current user's installed integration and connection record", async () => {
    const repository = getContextLayerRepository();

    await repository.upsertOwnerIntegration(
      "user@example.com",
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
      }),
    );
    await repository.upsertIntegrationConnection(
      createConnection({
        ownerId: "user@example.com",
        integrationKey: "slack",
        provider: "slack",
        authStrategy: "oauth2",
      }),
    );

    const response = await DELETE(new Request("http://localhost/api/integrations/slack"), {
      params: Promise.resolve({ integrationKey: "slack" }),
    });
    const body = (await response.json()) as { deleted: boolean; key: string };

    expect(response.status).toBe(200);
    expect(body).toEqual({ deleted: true, key: "slack" });
    expect(await repository.getOwnerIntegration("user@example.com", "slack")).toBeNull();
    expect(await repository.getIntegrationConnection("user@example.com", "slack")).toBeNull();
  });
});

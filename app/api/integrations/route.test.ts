import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

import { GET } from "./route";

import { getContextLayerRepository } from "@/src/lib/core/runtime";
import type { IntegrationSpec } from "@/src/types/context-layer";

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const createIntegration = (
  overrides: Partial<IntegrationSpec> & Pick<IntegrationSpec, "key" | "name" | "kind" | "provider" | "authStrategy">,
): IntegrationSpec => ({
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {},
  ...overrides,
});

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  resetRuntime();
});

describe("GET /api/integrations", () => {
  it("returns only integrations active for the current non-admin user", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const repository = getContextLayerRepository();

    await repository.upsertIntegration(
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
      }),
    );
    await repository.upsertIntegration(
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
      }),
    );
    await repository.upsertIntegration(
      createIntegration({
        key: "notion",
        name: "Notion",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: false,
      }),
    );

    await repository.upsertIntegrationConnection({
      ownerId: "user@example.com",
      integrationKey: "slack",
      provider: "slack",
      authStrategy: "oauth2",
      encryptedCredentials: "encrypted",
      scopes: [],
      metadata: {},
      createdAt: "2026-03-13T00:00:00.000Z",
      updatedAt: "2026-03-13T00:00:00.000Z",
    });

    const response = await GET();
    const body = (await response.json()) as Array<{ key: string }>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject([
      expect.objectContaining({ key: "github" }),
      expect.objectContaining({ key: "slack" }),
    ]);
    expect(body.map((integration) => integration.key)).toEqual(["github", "slack"]);
  });

  it("returns the same personal integration view for app administrators", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
    const repository = getContextLayerRepository();

    await repository.upsertIntegration(
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
      }),
    );
    await repository.upsertIntegration(
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
      }),
    );

    const response = await GET();
    const body = (await response.json()) as Array<{ key: string }>;

    expect(response.status).toBe(200);
    expect(body.map((integration) => integration.key)).toEqual(["github"]);
  });
});

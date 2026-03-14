import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { DELETE, GET } from "./route";

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

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  resetRuntime();
});

describe("/api/admin/legacy-shared-oauth-credentials", () => {
  it("lists legacy shared OAuth credentials for allowlisted app administrators without exposing raw values", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");
    const repository = getContextLayerRepository();

    await repository.upsertIntegration(
      createIntegration({
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        credentials: {
          accessToken: "shared-token",
          refreshToken: "refresh-token",
        },
      }),
    );
    await repository.upsertIntegration(
      createIntegration({
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        credentials: {
          accessToken: "github-token",
        },
      }),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      count: 1,
      legacySharedOAuthCredentials: [
        {
          key: "slack",
          name: "Slack",
          kind: "mcp",
          provider: "mcp",
          credentialKeys: ["accessToken", "refreshToken"],
          credentialCount: 2,
        },
      ],
    });
  });

  it("scrubs legacy shared OAuth credentials for allowlisted app administrators", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");
    const repository = getContextLayerRepository();

    await repository.upsertIntegration(
      createIntegration({
        key: "notion",
        name: "Notion",
        kind: "api",
        provider: "http",
        authStrategy: "oauth2",
        credentials: {
          accessToken: "shared-token",
        },
      }),
    );

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      scrubbedCount: 1,
      scrubbedIntegrations: [
        {
          key: "notion",
          name: "Notion",
          kind: "api",
          provider: "http",
          credentialKeys: ["accessToken"],
          credentialCount: 1,
        },
      ],
    });
    await expect(repository.getIntegration("notion")).resolves.toMatchObject({
      credentials: {},
    });
  });

  it("rejects inspection for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can inspect or scrub legacy shared OAuth credentials.",
    });
  });
});

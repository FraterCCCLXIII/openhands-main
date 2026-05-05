import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET } from "./route";

import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  ADMIN_API_BEARER_CHALLENGE,
  ADMIN_API_UNAUTHORIZED_DETAIL,
} from "@/src/lib/admin-api-auth";

let testCleanup: () => Promise<void>;

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    integrationsHubRepository?: unknown;
    integrationsHubService?: unknown;
  };
  delete runtime.integrationsHubRepository;
  delete runtime.integrationsHubService;
};

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-connections-route-test");
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

describe("GET /api/admin/connections", () => {
  it("lists deployment-wide connection summaries and supports GitHub identity filtering", async () => {
    const service = getIntegrationsHubService();
    await service.saveOAuthConnection(
      "owner-a@example.com",
      "github",
      "github",
      {
        accessToken: "token-a",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-b@example.com",
      "github",
      "github",
      {
        accessToken: "token-b",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-c@example.com",
      "slack",
      "slack",
      {
        accessToken: "token-c",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["chat:write"],
        externalAccountId: "U123",
        displayName: "workspace-bot",
        metadata: { team: "Workspace" },
      },
    );
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await GET(
      new Request("http://localhost/api/admin/connections?provider=github&q=xingyaoww", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        ownerId: "owner-a@example.com",
        integrationKey: "github",
        provider: "github",
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
      }),
      expect.objectContaining({
        ownerId: "owner-b@example.com",
        integrationKey: "github",
        provider: "github",
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
      }),
    ]);
  });

  it("pushes exact-match filters to the repository layer and paginates results", async () => {
    const service = getIntegrationsHubService();
    await service.saveOAuthConnection(
      "owner-a@example.com",
      "github",
      "github",
      {
        accessToken: "token-a",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-b@example.com",
      "github",
      "github",
      {
        accessToken: "token-b",
      },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    const repository = Reflect.get(service, "repository") as {
      listAllIntegrationConnections: (filters?: {
        ownerId?: string;
        provider?: string;
        integrationKey?: string;
        limit?: number;
        offset?: number;
      }) => Promise<unknown>;
    };
    const listAllSpy = vi.spyOn(repository, "listAllIntegrationConnections");
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");

    const response = await GET(
      new Request("http://localhost/api/admin/connections?provider=GitHub&limit=1&offset=1", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(listAllSpy).toHaveBeenCalledWith({
      ownerId: undefined,
      provider: "github",
      integrationKey: undefined,
      limit: 1,
      offset: 1,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        ownerId: "owner-b@example.com",
        integrationKey: "github",
        provider: "github",
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
      }),
    ]);
  });


  it("returns a bearer challenge when the admin API key is missing", async () => {
    const response = await GET(new Request("http://localhost/api/admin/connections"));

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(ADMIN_API_BEARER_CHALLENGE);
    await expect(response.json()).resolves.toMatchObject({
      detail: ADMIN_API_UNAUTHORIZED_DETAIL,
    });
  });
});

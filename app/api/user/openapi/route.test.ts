import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { getContextLayerService } from "@/src/lib/core/runtime";
import type { ContextRepository } from "@/src/lib/core/repository";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  USER_API_BEARER_CHALLENGE,
  USER_API_UNAUTHORIZED_DETAIL,
} from "@/src/lib/user-api-auth";
import type { IntegrationSpec } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://user-openapi-test");
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testRepo = ctx.repository;
  testCleanup = ctx.cleanup;
});

const setRuntimeRepository = (repository?: ContextRepository) => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };

  if (repository) {
    runtime.contextLayerRepository = repository;
  } else {
    delete runtime.contextLayerRepository;
  }
  delete runtime.contextLayerService;
};

const githubIntegration: IntegrationSpec = {
  key: "github",
  name: "GitHub",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { serverUrl: "https://api.githubcopilot.com/mcp/" },
  credentials: {},
  tools: {
    search_repositories: {
      name: "search_repositories",
      description: "Search repositories",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["repo"],
      executionMode: "provider",
      config: { toolName: "search_repositories" },
    },
  },
};

const seedUserKey = async (ownerId: string) => {
  await testRepo.upsertOwnerIntegration(ownerId, githubIntegration);
  setRuntimeRepository(testRepo);
  const service = getContextLayerService();
  const rotated = await service.rotateUserApiKey(ownerId);
  return rotated.apiKey;
};

afterEach(async () => {
  setRuntimeRepository();
  await testCleanup();
});

describe("GET /api/user/openapi", () => {
  it("returns a user OpenAPI document and includes admin-only paths for admins", async () => {
    const apiKey = await seedUserKey("admin@example.com");

    const response = await GET(
      new Request("http://localhost:3000/api/user/openapi", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      openapi: string;
      servers: Array<{ url: string }>;
      paths: Record<string, { get?: unknown; patch?: unknown; post?: unknown; delete?: unknown }>;
      components: {
        securitySchemes: Record<string, unknown>;
        schemas: Record<string, unknown>;
      };
    };

    expect(body.openapi).toBe("3.0.3");
    expect(body.servers).toEqual([{ url: "http://localhost:3000" }]);
    expect(body.paths["/api/user/integrations"]?.get).toBeTruthy();
    expect(body.paths["/api/user/integrations"]?.post).toBeTruthy();
    expect(body.paths["/api/user/integrations/{integrationKey}"]?.delete).toBeTruthy();
    expect(
      body.paths["/api/user/integrations/{integrationKey}/tools/{toolName}"]
        ?.patch,
    ).toBeTruthy();
    expect(body.paths["/api/user/connections"]?.get).toBeTruthy();
    expect(body.paths["/api/user/access-requests"]?.get).toBeTruthy();
    expect(body.paths["/api/user/access-requests/{requestId}/approve"]?.post).toBeTruthy();
    expect(body.paths["/api/user/access-requests/{requestId}/reject"]?.post).toBeTruthy();
    expect(body.components.securitySchemes.UserApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(body.components.schemas.IntegrationSpec).toBeTruthy();
    expect(body.components.schemas.ToolSpec).toBeTruthy();
    expect(body.components.schemas.AccessRequest).toBeTruthy();
    expect(body.components.schemas.TemporaryGrant).toBeTruthy();
  });

  it("includes owner-scoped access request paths for non-admin users", async () => {
    const apiKey = await seedUserKey("user@example.com");

    const response = await GET(
      new Request("http://localhost:3000/api/user/openapi", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      paths: Record<string, { get?: unknown; patch?: unknown; post?: unknown; delete?: unknown }>;
      tags: Array<{ name: string }>;
    };

    expect(body.paths["/api/user/integrations"]?.get).toBeTruthy();
    expect(body.paths["/api/user/integrations"]?.post).toBeTruthy();
    expect(body.paths["/api/user/integrations/{integrationKey}"]?.delete).toBeTruthy();
    expect(body.paths["/api/user/connections"]?.get).toBeTruthy();
    expect(body.paths["/api/user/access-requests"]?.get).toBeTruthy();
    expect(body.paths["/api/user/access-requests/{requestId}/approve"]?.post).toBeTruthy();
    expect(body.paths["/api/user/access-requests/{requestId}/reject"]?.post).toBeTruthy();
    expect(body.tags.map((tag) => tag.name)).toContain("Case-by-case approvals");
  });

  it("returns a bearer challenge when the user API key is missing", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/user/openapi"),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      USER_API_BEARER_CHALLENGE,
    );
    await expect(response.json()).resolves.toMatchObject({
      detail: USER_API_UNAUTHORIZED_DETAIL,
    });
  });
});

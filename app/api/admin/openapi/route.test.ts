import { createHash } from "node:crypto";

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { getContextLayerService } from "@/src/lib/core/runtime";
import type { ContextRepository } from "@/src/lib/core/repository";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  ADMIN_API_BEARER_CHALLENGE,
  ADMIN_API_UNAUTHORIZED_DETAIL,
} from "@/src/lib/admin-api-auth";
import type { IntegrationSpec } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-openapi-test");
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
  functions: {
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

const seedAdminKey = async (ownerId: string) => {
  await testRepo.upsertOwnerIntegration(ownerId, githubIntegration);
  setRuntimeRepository(testRepo);
  const service = getContextLayerService();
  const rotated = await service.rotateAdminApiKey(ownerId);
  return rotated.apiKey;
};

afterEach(async () => {
  setRuntimeRepository();
  await testCleanup();
});

describe("GET /api/admin/openapi", () => {
  it("returns an admin OpenAPI document with admin QA routes", async () => {
    const apiKey = await seedAdminKey("admin@example.com");

    const response = await GET(
      new Request("http://localhost:3000/api/admin/openapi", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      openapi: string;
      servers: Array<{ url: string }>;
      paths: Record<string, { get?: unknown; post?: unknown; patch?: unknown; delete?: unknown }>;
      components: {
        securitySchemes: Record<string, unknown>;
        schemas: Record<string, unknown>;
      };
    };

    expect(body.openapi).toBe("3.0.3");
    expect(body.servers).toEqual([{ url: "http://localhost:3000" }]);
    expect(body.paths["/api/admin/integrations"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/integrations"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/integrations/discover"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/managed-connectors"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/managed-connectors"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/access-requests/{requestId}/approve"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/notifications"]?.get).toBeTruthy();
    expect(body.components.securitySchemes.AdminApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(body.components.schemas.ManagedConnector).toBeTruthy();
    expect(body.components.schemas.IntegrationSpec).toBeTruthy();
    expect(body.components.schemas.AccessRequest).toBeTruthy();
  });

  it("rejects admin keys for users who are no longer allowlisted", async () => {
    const apiKey = "clad_deallowlisted_user_key_value";
    await testRepo.saveAdminApiKey({
      ownerId: "user@example.com",
      apiKeyHash: createHash("sha256").update(apiKey).digest("hex"),
      keyPrefix: apiKey.slice(0, 12),
      keySuffix: apiKey.slice(-4),
      encryptedApiKey: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setRuntimeRepository(testRepo);

    const response = await GET(
      new Request("http://localhost:3000/api/admin/openapi", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(ADMIN_API_BEARER_CHALLENGE);
    await expect(response.json()).resolves.toMatchObject({
      detail: ADMIN_API_UNAUTHORIZED_DETAIL,
    });
  });

  it("returns a bearer challenge when the admin API key is missing", async () => {
    const response = await GET(new Request("http://localhost:3000/api/admin/openapi"));

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(ADMIN_API_BEARER_CHALLENGE);
    await expect(response.json()).resolves.toMatchObject({
      detail: ADMIN_API_UNAUTHORIZED_DETAIL,
    });
  });
});

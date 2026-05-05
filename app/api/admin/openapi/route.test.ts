import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import type { ContextRepository } from "@/src/lib/core/repository";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import {
  ADMIN_API_BEARER_CHALLENGE,
  ADMIN_API_UNAUTHORIZED_DETAIL,
} from "@/src/lib/admin-api-auth";

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
    integrationsHubRepository?: unknown;
    integrationsHubService?: unknown;
  };

  if (repository) {
    runtime.integrationsHubRepository = repository;
  } else {
    delete runtime.integrationsHubRepository;
  }
  delete runtime.integrationsHubService;
};

const seedAdminKey = async (ownerId: string) => {
  setRuntimeRepository(testRepo);
  const service = getIntegrationsHubService();
  const rotated = await service.rotateAdminApiKey(ownerId);
  return rotated.apiKey;
};

afterEach(async () => {
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
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
    expect(body.paths["/api/admin/integrations/discover"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/integrations/managed-connectors"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/integrations/oauth-provider-catalog"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/managed-connectors"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/managed-connectors"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/access-requests/{requestId}/approve"]?.post).toBeTruthy();
    expect(body.paths["/api/admin/notifications"]?.get).toBeTruthy();
    const adminConnectionsPath = body.paths["/api/admin/connections"]?.get;
    expect(adminConnectionsPath).toBeTruthy();
    expect((adminConnectionsPath as { parameters?: Array<{ name?: string }> }).parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "q" }),
        expect.objectContaining({ name: "limit" }),
        expect.objectContaining({ name: "offset" }),
      ]),
    );
    expect(body.paths["/api/admin/overview"]?.get).toBeTruthy();
    expect(body.paths["/api/admin/integrations"]).toBeUndefined();
    expect(body.paths["/api/admin/oauth/connections"]).toBeUndefined();
    expect(body.components.securitySchemes.AdminApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(body.components.schemas.ManagedConnector).toBeTruthy();
    expect(body.components.schemas.IntegrationSpec).toBeTruthy();
    expect(body.components.schemas.AccessRequest).toBeTruthy();
  });

  it("rejects admin keys for users who are no longer allowlisted", async () => {
    const apiKey = await seedAdminKey("admin@example.com");
    vi.stubEnv("APP_ADMIN_EMAILS", "other-admin@example.com");

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

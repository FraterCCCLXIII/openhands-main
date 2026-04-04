import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import type { ContextRepository } from "@/src/lib/core/repository";
import { encryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationSpec } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://openapi-test"); });
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
    get_self: {
      name: "get_self",
      description: "Get the current authenticated user",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: { toolName: "get_self" },
    },
  },
};

const notionIntegration: IntegrationSpec = {
  key: "notion",
  name: "Notion",
  kind: "api",
  provider: "http",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { apiBaseUrl: "https://api.notion.com/v1" },
  credentials: {},
  functions: {
    search_pages: {
      name: "search_pages",
      description: "Search pages",
      enabled: true,
      accessMode: "approval_required",
      fineGrainedPermissions: true,
      defaultScopes: ["workspace.read"],
      executionMode: "provider",
      config: { request: { method: "POST", path: "/search" } },
    },
  },
};

const disabledIntegration: IntegrationSpec = {
  key: "linear",
  name: "Linear",
  kind: "api",
  provider: "http",
  authStrategy: "bearer",
  enabled: false,
  fineGrainedPermissions: true,
  config: { apiBaseUrl: "https://api.linear.app" },
  credentials: { accessToken: "linear-token" },
  functions: {
    list_issues: {
      name: "list_issues",
      description: "List issues",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: { request: { method: "GET", path: "/issues" } },
    },
  },
};

const partiallyDisabledIntegration: IntegrationSpec = {
  key: "slack",
  name: "Slack",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { serverUrl: "https://mcp.slack.com" },
  credentials: {},
  functions: {
    list_channels: {
      name: "list_channels",
      description: "List channels",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["channels:read"],
      executionMode: "provider",
      config: { toolName: "list_channels" },
    },
    delete_message: {
      name: "delete_message",
      description: "Delete message",
      enabled: false,
      accessMode: "disabled",
      fineGrainedPermissions: true,
      defaultScopes: ["chat:write"],
      executionMode: "provider",
      config: { toolName: "delete_message" },
    },
  },
};

const seedRepository = async () => {
  const repository = testRepo;
  await repository.saveAgentApiKey({
    ownerId: "dev@localhost",
    apiKey: "context-key",
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  });
  await repository.upsertOwnerIntegration("dev@localhost", githubIntegration);
  await repository.upsertOwnerIntegration("dev@localhost", notionIntegration);
  await repository.upsertOwnerIntegration("dev@localhost", disabledIntegration);
  await repository.upsertOwnerIntegration("dev@localhost", partiallyDisabledIntegration);
  await repository.upsertIntegrationConnection({
    ownerId: "dev@localhost",
    integrationKey: "github",
    provider: "github",
    authStrategy: "oauth2",
    encryptedCredentials: encryptCredentials({ accessToken: "github-user-token" }),
    scopes: ["repo"],
    metadata: {},
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  });

  await repository.upsertIntegrationConnection({
    ownerId: "dev@localhost",
    integrationKey: "slack",
    provider: "slack",
    authStrategy: "oauth2",
    encryptedCredentials: encryptCredentials({ accessToken: "slack-user-token" }),
    scopes: ["channels:read"],
    metadata: {},
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  });
  setRuntimeRepository(repository);
};

afterEach(async () => {
  setRuntimeRepository();
  await testCleanup();
});

describe("GET /api/context/openapi", () => {
  it("returns an OpenAPI document for tools available to the authenticated user", async () => {
    await seedRepository();

    const response = await GET(
      new Request("http://localhost:3000/api/context/openapi", {
        headers: {
          Authorization: "Bearer context-key",
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      openapi: string;
      servers: Array<{ url: string }>;
      paths: Record<
        string,
        {
          post?: {
            summary?: string;
            description?: string;
            requestBody?: {
              content?: {
                "application/json"?: {
                  examples?: {
                    default?: {
                      value?: {
                        scopes?: string[];
                        payload?: Record<string, unknown>;
                      };
                    };
                  };
                };
              };
            };
          };
        }
      >;
      components: {
        securitySchemes: Record<string, unknown>;
        schemas: Record<string, unknown>;
      };
    };

    expect(body.openapi).toBe("3.0.3");
    expect(body.servers).toEqual([{ url: "http://localhost:3000" }]);
    expect(body.paths["/api/context/github/search_repositories"]?.post).toMatchObject({
      summary: "Search repositories",
    });
    expect(body.paths["/api/context/github/get_self"]?.post).toMatchObject({
      summary: "Get the current authenticated user",
    });
    expect(
      body.paths["/api/context/github/get_self"]?.post?.requestBody?.content?.[
        "application/json"
      ]?.examples?.default?.value,
    ).toEqual({
      scopes: [],
      payload: {},
    });
    expect(body.paths["/api/context/github/get_self"]?.post?.description).toContain(
      "Invocation identity is optional; agentId and agentClass default to null when omitted.",
    );
    expect(body.paths["/api/context/github/get_self"]?.post?.description).toContain(
      "Enabled tools are callable by default unless you configure an agent-class policy to narrow access",
    );
    expect(body.paths["/api/context/slack/list_channels"]?.post).toMatchObject({
      summary: "List channels",
    });
    expect(body.paths["/api/context/notion/search_pages"]).toBeUndefined();
    expect(body.paths["/api/context/linear/list_issues"]).toBeUndefined();
    expect(body.paths["/api/context/slack/delete_message"]).toBeUndefined();
    expect(body.components.securitySchemes.ContextApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(body.components.schemas.ContextInvokeRequest).toBeTruthy();
    expect(body.components.schemas.ContextInvocationResult).toBeTruthy();
    expect(body.components.schemas.ErrorResponse).toBeTruthy();
  });

  it("returns a bearer challenge when the personal API key is missing", async () => {
    await seedRepository();

    const response = await GET(
      new Request("http://localhost:3000/api/context/openapi"),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(
      'Bearer realm="agent-context-layer"',
    );
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Provide a valid personal context-layer API key in the Authorization bearer header or X-API-Key.",
    });
  });
});

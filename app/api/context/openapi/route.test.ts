import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

import { encryptCredentials } from "@/src/lib/credential-crypto";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import type { IntegrationSpec } from "@/src/types/context-layer";

const setRuntimeRepository = (repository?: MemoryRepository) => {
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
  credentials: { accessToken: "shared-token" },
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
  const repository = new MemoryRepository();
  await repository.saveAgentApiKey({
    ownerId: "dev@localhost",
    apiKey: "context-key",
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  });
  await repository.upsertIntegration(githubIntegration);
  await repository.upsertIntegration(notionIntegration);
  await repository.upsertIntegration(disabledIntegration);
  await repository.upsertIntegration(partiallyDisabledIntegration);
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

afterEach(() => {
  setRuntimeRepository();
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
      paths: Record<string, { post?: { summary?: string } }>;
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

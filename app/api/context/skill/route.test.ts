import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import type { ContextRepository } from "@/src/lib/core/repository";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import type { IntegrationSpec } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://context-skill-test");
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
  name: "GitHub MCP",
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

const otherOwnerIntegration: IntegrationSpec = {
  key: "slack",
  name: "Slack",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { serverUrl: "https://mcp.slack.com/mcp" },
  credentials: {},
  functions: {
    slack_search_public: {
      name: "slack_search_public",
      description: "Search public Slack messages",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
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
  await repository.upsertOwnerIntegration("other@localhost", otherOwnerIntegration);
  setRuntimeRepository(repository);
};

afterEach(async () => {
  setRuntimeRepository();
  await testCleanup();
});

describe("GET /api/context/skill", () => {
  it("returns a generated SKILL.md document for authenticated callers", async () => {
    await seedRepository();

    const response = await GET(
      new Request("https://context-layer.example.com/api/context/skill", {
        headers: {
          Authorization: "Bearer context-key",
          "x-forwarded-host": "context-layer.example.com",
          "x-forwarded-proto": "https",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("content-disposition")).toContain("SKILL.md");

    const body = await response.text();
    expect(body).toContain(
      "POST https://context-layer.example.com/api/context/github/search_repositories",
    );
    expect(body).toContain("Generated tool catalog for the current OpenHands Context Layer profile.");
    expect(body).not.toContain("slack.slack_search_public");
  });

  it("rejects requests without a valid personal API key", async () => {
    await seedRepository();

    const response = await GET(
      new Request("https://context-layer.example.com/api/context/skill"),
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

  it("returns a 503 until a dashboard visit provisions the first API key", async () => {
    setRuntimeRepository(testRepo);

    const response = await GET(
      new Request("https://context-layer.example.com/api/context/skill"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Open the dashboard once to provision a personal context-layer API key before agents call /api/context.",
    });
  });
});

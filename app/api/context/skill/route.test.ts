import { afterEach, describe, expect, it } from "vitest";

import { MemoryRepository } from "@/src/lib/db/memory-repository";
import type { IntegrationSpec } from "@/src/types/context-layer";

import { GET } from "./route";

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const setRuntimeRepository = (repository: MemoryRepository) => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  runtime.contextLayerRepository = repository;
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

const seedRepository = async () => {
  const repository = new MemoryRepository();
  await repository.saveAgentApiKey({
    ownerId: "dev@localhost",
    apiKey: "context-key",
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  });
  await repository.upsertIntegration(githubIntegration);
  setRuntimeRepository(repository);
  return repository;
};

afterEach(() => {
  resetRuntime();
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
    await expect(response.text()).resolves.toContain(
      "POST https://context-layer.example.com/api/context/github/search_repositories",
    );
  });

  it("rejects requests without a valid personal API key", async () => {
    await seedRepository();

    const response = await GET(
      new Request("https://context-layer.example.com/api/context/skill"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Provide a valid personal context-layer API key in the Authorization bearer header or X-API-Key.",
    });
  });
});

import { describe, expect, it } from "vitest";

import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import type { IntegrationSpec } from "@/src/types/context-layer";

const githubIntegration: IntegrationSpec = {
  key: "github",
  name: "GitHub MCP",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { serverUrl: "https://api.githubcopilot.com/mcp/" },
  credentials: { accessToken: "secret" },
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

describe("agent-connection", () => {
  it("uses the first available integration and function in examples", () => {
    const guide = buildAgentConnectionGuide({
      baseUrl: "http://localhost:12000",
      apiKey: "context-key",
      integrations: [githubIntegration],
    });

    expect(guide.endpoint).toBe(
      "http://localhost:12000/api/context/github/search_repositories",
    );
    expect(guide.curlExample).toContain("Authorization: Bearer context-key");
    expect(guide.requestBody).toContain('"scopes": [\n    "repo"\n  ]');
  });

  it("falls back to placeholders before any integrations are created", () => {
    const guide = buildAgentConnectionGuide({
      baseUrl: "http://localhost:12000/",
      apiKey: "context-key",
      integrations: [],
    });

    expect(guide.endpoint).toBe(
      "http://localhost:12000/api/context/your-integration/your-function",
    );
    expect(guide.fetchExample).toContain("your-function");
  });
});

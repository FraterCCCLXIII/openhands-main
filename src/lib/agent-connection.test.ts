import { describe, expect, it } from "vitest";

import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import type { IntegrationSpec } from "@/src/types/context-layer";

const disabledIntegration: IntegrationSpec = {
  key: "disabled",
  name: "Disabled Integration",
  kind: "api",
  provider: "http",
  authStrategy: "bearer",
  enabled: false,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {
    hidden_tool: {
      name: "hidden_tool",
      description: "Should not be used in examples",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["hidden.read"],
      executionMode: "provider",
      config: {},
    },
  },
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
  it("uses the first available enabled integration and function in examples", () => {
    const guide = buildAgentConnectionGuide({
      baseUrl: "http://localhost:12000",
      apiKey: "context-key",
      integrations: [disabledIntegration, githubIntegration],
    });

    expect(guide.endpoint).toBe(
      "http://localhost:12000/api/context/github/search_repositories",
    );
    expect(guide.curlExample).toContain("Authorization: Bearer context-key");
    expect(guide.requestBody).toContain('"scopes": [\n    "repo"\n  ]');
    expect(guide.skillEndpoint).toBe("http://localhost:12000/api/context/skill");
    expect(guide.skillCurlExample).toContain("-o SKILL.md");
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
    expect(guide.skillEndpoint).toBe("http://localhost:12000/api/context/skill");
  });
});

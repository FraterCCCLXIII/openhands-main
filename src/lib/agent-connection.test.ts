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

const notionIntegration: IntegrationSpec = {
  key: "notion",
  name: "Notion",
  kind: "api",
  provider: "http",
  authStrategy: "oauth2",
  enabled: true,
  fineGrainedPermissions: true,
  config: { apiBaseUrl: "https://api.notion.com/v1" },
  credentials: { accessToken: "secret" },
  functions: {
    complete_file_upload: {
      name: "complete_file_upload",
      description: "Complete a file upload",
      enabled: true,
      accessMode: "approval_required",
      fineGrainedPermissions: true,
      defaultScopes: ["files.write"],
      executionMode: "provider",
      config: {
        request: {
          method: "POST",
          path: "/file_uploads/{{file_upload_id}}/complete",
          body: { body: "{{body}}" },
        },
      },
    },
    get_self: {
      name: "get_self",
      description: "Retrieve your token's bot user",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {
        request: {
          method: "GET",
          path: "/users/me",
        },
      },
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
    expect(guide.openApiSchemaEndpoint).toBe(
      "http://localhost:12000/api/context/openapi",
    );
    expect(guide.mcpEndpoint).toBe(
      "http://localhost:12000/api/mcp?agentId=research-bot-01&agentClass=researcher",
    );
    expect(guide.mcpToolName).toBe("github__search_repositories");
    expect(guide.curlExample).toContain("Authorization: Bearer context-key");
    expect(guide.openApiCurlExample).toContain(
      'curl -X GET "http://localhost:12000/api/context/openapi"',
    );
    expect(guide.requestBody).toContain('"scopes": [\n    "repo"\n  ]');
    expect(guide.permissionNote).toContain("agent class being allowed by policy");
    expect(guide.mcpConfigExample).toContain('"transport": "streamable-http"');
    expect(guide.mcpConfigExample).toContain(
      '"url": "http://localhost:12000/api/mcp?agentId=research-bot-01&agentClass=researcher"',
    );
  });

  it("prefers a non-approval function and omits fake payload placeholders", () => {
    const guide = buildAgentConnectionGuide({
      baseUrl: "http://localhost:12000",
      apiKey: "context-key",
      integrations: [notionIntegration],
    });

    expect(guide.endpoint).toBe("http://localhost:12000/api/context/notion/get_self");
    expect(guide.mcpToolName).toBe("notion__get_self");
    expect(guide.requestBody).toContain('"scopes": []');
    expect(guide.requestBody).toContain('"payload": {}');
    expect(guide.requestBody).not.toContain("scope.read");
    expect(guide.requestBody).not.toContain("replace with the arguments");
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
    expect(guide.openApiSchemaEndpoint).toBe(
      "http://localhost:12000/api/context/openapi",
    );
    expect(guide.mcpToolName).toBe("your-integration__your-function");
    expect(guide.fetchExample).toContain("your-function");
  });
});

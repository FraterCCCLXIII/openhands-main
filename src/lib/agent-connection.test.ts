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
  it("uses the first available enabled integration and function in examples", () => {
    const guide = buildAgentConnectionGuide({
      baseUrl: "http://localhost:12000",
      apiKey: "context-key",
      integrations: [disabledIntegration, githubIntegration],
    });

    expect(guide.endpoint).toBe(
      "http://localhost:12000/api/context/github/search_repositories",
    );
    expect(guide.openApiSchemaEndpoint).toBe(
      "http://localhost:12000/api/context/openapi",
    );
    expect(guide.mcpEndpoint).toBe("http://localhost:12000/api/mcp");
    expect(guide.mcpToolName).toBe("github__search_repositories");
    expect(guide.mcpSetAgentIdToolName).toBe("set_agent_id");
    expect(guide.mcpSetAgentClassToolName).toBe("set_agent_class");
    expect(guide.curlExample).toContain("Authorization: Bearer context-key");
    expect(guide.skillEndpoint).toBe("http://localhost:12000/api/context/skill");
    expect(guide.skillCurlExample).toContain('curl -L "http://localhost:12000/api/context/skill"');
    expect(guide.skillCurlExample).toContain("-o SKILL.md");
    expect(guide.openApiCurlExample).toContain(
      'curl -X GET "http://localhost:12000/api/context/openapi"',
    );
    expect(guide.requestBody).toContain('"scopes": [\n    "repo"\n  ]');
    expect(guide.permissionNote).toContain("Enabled tools are callable by default");
    expect(guide.mcpConfigExample).toContain('"transport": "streamable-http"');
    expect(guide.mcpConfigExample).toContain('"url": "http://localhost:12000/api/mcp"');
    expect(guide.mcpSessionSetupExample).toContain(
      "1. Connect your MCP client to http://localhost:12000/api/mcp.",
    );
    expect(guide.mcpSessionSetupExample).toContain(
      "2. Call github__search_repositories directly; if you omit agent identity, the session defaults to research-bot-01 (researcher).",
    );
    expect(guide.mcpSessionSetupExample).toContain(
      "3. Optionally call set_agent_id and set_agent_class to override the identity for the rest of the session.",
    );
    expect(guide.mcpSessionSetupExample).toContain(
      "4. You can also pass contextAgentId and contextAgentClass per tool call when you need a one-off override.",
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
    expect(guide.skillEndpoint).toBe("http://localhost:12000/api/context/skill");
    expect(guide.mcpSessionSetupExample).toContain("defaults to research-bot-01 (researcher)");
    expect(guide.mcpSessionSetupExample).toContain("set_agent_id");
    expect(guide.mcpSessionSetupExample).toContain("set_agent_class");
  });
});

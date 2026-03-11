import { describe, expect, it } from "vitest";

import { buildAgentSkillMarkdown } from "@/src/lib/agent-skill";
import type { IntegrationSpec } from "@/src/types/context-layer";

const integrations: IntegrationSpec[] = [
  {
    key: "github",
    name: "GitHub MCP",
    kind: "mcp",
    provider: "mcp",
    authStrategy: "oauth2",
    enabled: true,
    fineGrainedPermissions: true,
    config: {},
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
        config: {},
      },
      delete_repository: {
        name: "delete_repository",
        description: "Delete a repository",
        enabled: true,
        accessMode: "approval_required",
        fineGrainedPermissions: true,
        defaultScopes: ["repo:admin"],
        executionMode: "provider",
        config: {},
      },
      hidden_tool: {
        name: "hidden_tool",
        description: "Should not appear",
        enabled: false,
        accessMode: "disabled",
        fineGrainedPermissions: true,
        defaultScopes: [],
        executionMode: "provider",
        config: {},
      },
    },
  },
  {
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
        description: "Should stay hidden",
        enabled: true,
        accessMode: "enabled",
        fineGrainedPermissions: true,
        defaultScopes: ["hidden.read"],
        executionMode: "provider",
        config: {},
      },
    },
  },
];

describe("agent-skill", () => {
  it("renders a SKILL.md document for enabled tools only", () => {
    const markdown = buildAgentSkillMarkdown({
      baseUrl: "https://context-layer.example.com/",
      integrations,
    });

    expect(markdown).toContain("name: context-layer-profile-tools");
    expect(markdown).toContain(
      "Endpoint pattern: `POST https://context-layer.example.com/api/context/{integrationKey}/{functionName}`",
    );
    expect(markdown).toContain("## Available tools (2)");
    expect(markdown).toContain("#### `github.search_repositories`");
    expect(markdown).toContain("#### `github.delete_repository`");
    expect(markdown).toContain("- Access: approval required");
    expect(markdown).not.toContain("Disabled Integration");
    expect(markdown).not.toContain("Should stay hidden");
    expect(markdown).not.toContain("Should not appear");
  });

  it("renders an empty-state skill when no tools are enabled", () => {
    const markdown = buildAgentSkillMarkdown({
      baseUrl: "https://context-layer.example.com",
      integrations: [
        {
          ...integrations[0],
          enabled: false,
        },
      ],
    });

    expect(markdown).toContain("## Available tools (0)");
    expect(markdown).toContain("No enabled tools are available yet.");
  });
});

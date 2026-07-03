export const AGENT_CONNECTION_PAGE_COPY = {
  apiKeysTitle: "API keys",
  apiKeysDescription:
    "Choose a permission profile for agent access, then copy or rotate the keys your agents and automations should use.",
  connectionDetailsTitle: "Connection details",
  connectionDetailsDescription:
    "Endpoints, OpenAPI schemas, and starter prompts for MCP and REST integrations.",
  connectionDetailsLink: "View connection details",
  connectionDetailsModalAriaLabel: "Connection details",
  profilesCountLabel: "Profiles",
  permissionProfileLabel: "Permission profile",
  profileAgentKeyTitle: (profileName: string) => `${profileName} agent key`,
  profileAgentKeyDescription:
    "Give this key to agents that should use this permission profile.",
  agentKeyTitle: "Agent key",
  agentKeyDescription: "Give this key to your agent.",
  userAutomationKeyTitle: "User automation key",
  userAutomationKeyDescription:
    "Use this key to programmatically manage user-scoped integrations-hub settings.",
  userAutomationKeyBadge: "User",
  adminAutomationKeyTitle: "Admin automation key",
  adminAutomationKeyDescription:
    "Use this key for admin-only QA and operational automation surfaces.",
  adminAutomationKeyBadge: "Admin",
  noAgentKey: "No agent key available yet.",
  noUserAutomationKey:
    "No user automation key yet. Reveal or copy to create one.",
  noAdminAutomationKey:
    "No admin automation key yet. Reveal or copy to create one.",
  noProfileAgentKey:
    "No agent key has been provisioned for this profile yet.",
  agentMcpTitle: "Agent MCP",
  agentMcpDescription:
    "Connect your MCP client to the streamable HTTP endpoint below and authenticate with the agent key.",
  endpointLabel: "Endpoint",
  exampleToolLabel: "Example tool",
  mcpConfigExampleTitle: "MCP config example",
  agentRestApiTitle: "Agent REST API",
  agentRestApiDescription:
    "Give your agent the agent key and the OpenAPI schema for the tool surface.",
  openapiSchemaLabel: "OpenAPI schema",
  exampleAgentPromptTitle: "Example agent prompt",
  userRestApiTitle: "User REST API",
  userRestApiDescription:
    "Use the user automation key with the dashboard-equivalent OpenAPI schema.",
  adminRestApiTitle: "Admin REST API",
  adminRestApiDescription:
    "Use the admin automation key with the admin-only OpenAPI schema for connector, discovery, and approval QA.",
} as const;

export function permissionProfilesCountAriaLabel(count: number): string {
  return `${count} profile${count === 1 ? "" : "s"}`;
}

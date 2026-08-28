export const AGENT_CONNECTION_PAGE_COPY = {
  apiKeysTitle: "API keys",
  apiKeysDescription:
    "Copy or rotate the keys your agents and automations should use.",
  profileKeysTitle: "Permission profiles",
  profileKeysDescription:
    "Saved permission sets and the agent key bound to each profile. Load a profile to apply it, or give the matching key to agents that should use it.",
  newProfileButton: "New profile",
  automationKeysTitle: "Automation keys",
  automationKeysDescription:
    "Account-scoped keys that are not tied to a permission profile.",
  connectionDetailsTitle: "Connection details",
  connectionDetailsDescription:
    "Endpoints, OpenAPI schemas, and starter prompts for MCP and REST integrations.",
  connectionDetailsLink: "View connection details",
  connectionDetailsModalAriaLabel: "Connection details",
  permissionProfileLabel: "Permission profile",
  profileAgentKeyTitle: (profileName: string) => `${profileName} agent key`,
  profileAgentKeyDescription:
    "Give this key to agents that should use this permission profile.",
  agentKeyTitle: "Agent key",
  agentKeyDescription: "Give this key to your agent.",
  userAutomationKeyTitle: "User automation key",
  userAutomationKeyDescription:
    "Use this key to programmatically manage user-scoped integrations-hub settings.",
  adminAutomationKeyTitle: "Admin automation key",
  adminAutomationKeyDescription:
    "Use this key for admin-only QA and operational automation surfaces.",
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

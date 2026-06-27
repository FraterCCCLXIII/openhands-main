const INTEGRATIONS_HUB_MCP_TOOL_SEPARATOR = "__";
export const INTEGRATIONS_HUB_MCP_SET_AGENT_ID_TOOL_NAME = "set_agent_id";
export const INTEGRATIONS_HUB_MCP_SET_AGENT_CLASS_TOOL_NAME = "set_agent_class";
export const INTEGRATIONS_HUB_MCP_SET_AGENT_DATA_TOOL_NAME = "set_agent_data";

export const buildIntegrationsHubMcpToolName = (
  integrationKey: string,
  toolName: string,
) => `${integrationKey}${INTEGRATIONS_HUB_MCP_TOOL_SEPARATOR}${toolName}`;

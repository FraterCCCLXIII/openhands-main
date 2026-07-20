import {
  buildIntegrationsHubMcpToolName,
} from "@/src/shared/mcp-tool-names";
import {
  listExampleTools,
  selectExampleIntegration,
} from "@/src/lib/tool-examples";
import type { IntegrationSpec } from "@/src/types/integrations-hub";
import { apiUrl } from "@/src/shared/paths";

export const OPENHANDS_AGENT_KEY_ENV = "$OPENHANDS_AGENT_KEY";

interface AgentConnectionGuide {
  mcpEndpoint: string;
  mcpToolName: string;
  mcpConfigExample: string;
  openApiSchemaEndpoint: string;
}

/**
 * Builds the agent-facing MCP examples shown on the Agent Connection page.
 * Keep these examples aligned with the live runtime defaults and generated OpenAPI docs.
 */
export const buildAgentConnectionGuide = ({
  baseUrl,
  apiKey,
  integrations,
}: {
  baseUrl: string;
  apiKey: string;
  integrations: IntegrationSpec[];
}): AgentConnectionGuide => {
  const sampleIntegrationSelection = selectExampleIntegration(integrations);
  const sampleIntegration = sampleIntegrationSelection?.integration ?? integrations[0];
  const sampleTool = sampleIntegrationSelection
    ? sampleIntegrationSelection.tools[0]
    : sampleIntegration
      ? listExampleTools(sampleIntegration)[0] ?? Object.values(sampleIntegration.tools)[0]
      : undefined;
  const integrationKey = sampleIntegration?.key ?? "your-integration";
  const toolName = sampleTool?.name ?? "your-tool";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const mcpEndpoint = apiUrl(normalizedBaseUrl, "/api/mcp");
  const mcpToolName = buildIntegrationsHubMcpToolName(integrationKey, toolName);
  const mcpConfigExample = JSON.stringify(
    {
      mcpServers: {
        "integrations-hub": {
          transport: "streamable-http",
          url: mcpEndpoint,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );
  const openApiSchemaEndpoint = apiUrl(normalizedBaseUrl, "/api/agent/openapi");

  return {
    mcpEndpoint,
    mcpToolName,
    mcpConfigExample,
    openApiSchemaEndpoint,
  };
};

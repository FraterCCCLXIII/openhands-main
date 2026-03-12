import {
  buildContextLayerMcpToolName,
  CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME,
  CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME,
} from "@/src/lib/mcp/context-layer-server";
import {
  buildExamplePayload,
  buildPermissionNote,
  listExampleFunctions,
  selectExampleIntegration,
} from "@/src/lib/tool-examples";
import type { IntegrationSpec } from "@/src/types/context-layer";

export interface AgentConnectionGuide {
  endpoint: string;
  integrationKey: string;
  functionName: string;
  mcpEndpoint: string;
  mcpToolName: string;
  mcpSetAgentIdToolName: string;
  mcpSetAgentClassToolName: string;
  requestBody: string;
  curlExample: string;
  fetchExample: string;
  openApiSchemaEndpoint: string;
  openApiCurlExample: string;
  mcpConfigExample: string;
  mcpSessionSetupExample: string;
  permissionNote: string;
}

const DEFAULT_AGENT_ID = "research-bot-01";
const DEFAULT_AGENT_CLASS = "researcher";

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
  const sampleFunction = sampleIntegrationSelection
    ? sampleIntegrationSelection.functions[0]
    : sampleIntegration
      ? listExampleFunctions(sampleIntegration)[0] ?? Object.values(sampleIntegration.functions)[0]
      : undefined;
  const integrationKey = sampleIntegration?.key ?? "your-integration";
  const functionName = sampleFunction?.name ?? "your-function";
  const defaultScopes = sampleFunction?.defaultScopes ?? [];
  const requestPayload = {
    agentId: DEFAULT_AGENT_ID,
    agentClass: DEFAULT_AGENT_CLASS,
    scopes: defaultScopes,
    payload: sampleFunction ? buildExamplePayload(sampleFunction) : {},
  };
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const endpoint = `${normalizedBaseUrl}/api/context/${integrationKey}/${functionName}`;
  const openApiSchemaEndpoint = `${normalizedBaseUrl}/api/context/openapi`;
  const mcpEndpoint = `${normalizedBaseUrl}/api/mcp`;
  const mcpToolName = buildContextLayerMcpToolName(integrationKey, functionName);
  const mcpSetAgentIdToolName = CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME;
  const mcpSetAgentClassToolName = CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME;
  const requestBody = JSON.stringify(requestPayload, null, 2);
  const escapedRequestBody = requestBody.replace(/'/g, "'\\''");
  const curlExample = [
    `curl -X POST \"${endpoint}\"`,
    `  -H \"Authorization: Bearer ${apiKey}\"`,
    '  -H "Content-Type: application/json"',
    `  -d '${escapedRequestBody}'`,
  ].join("\\n");
  const fetchExample = `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${requestBody}),
});

const result = await response.json();`;
  const openApiCurlExample = [
    `curl -X GET \"${openApiSchemaEndpoint}\"`,
    `  -H \"Authorization: Bearer ${apiKey}\"`,
    '  -H "Accept: application/json"',
  ].join("\\n");
  const mcpConfigExample = JSON.stringify(
    {
      mcpServers: {
        "context-layer": {
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
  const mcpSessionSetupExample = [
    `1. Connect your MCP client to ${mcpEndpoint}.`,
    `2. Call ${mcpSetAgentIdToolName} once at the start of the session to set the agent ID.`,
    `3. Call ${mcpSetAgentClassToolName} once at the start of the session to set the agent class.`,
    `4. Then call ${mcpToolName} like any other MCP tool.`,
  ].join("\n");

  return {
    endpoint,
    integrationKey,
    functionName,
    mcpEndpoint,
    mcpToolName,
    mcpSetAgentIdToolName,
    mcpSetAgentClassToolName,
    requestBody,
    curlExample,
    fetchExample,
    openApiSchemaEndpoint,
    openApiCurlExample,
    mcpConfigExample,
    mcpSessionSetupExample,
    permissionNote: buildPermissionNote(sampleFunction),
  };
};

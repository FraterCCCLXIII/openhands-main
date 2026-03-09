import type { IntegrationSpec } from "@/src/types/context-layer";

export interface AgentConnectionGuide {
  endpoint: string;
  integrationKey: string;
  functionName: string;
  requestBody: string;
  curlExample: string;
  fetchExample: string;
}

const buildDefaultPayload = (functionName: string) => ({
  example: `replace with the arguments for ${functionName}`,
});

export const buildAgentConnectionGuide = ({
  baseUrl,
  apiKey,
  integrations,
}: {
  baseUrl: string;
  apiKey: string;
  integrations: IntegrationSpec[];
}): AgentConnectionGuide => {
  const sampleIntegration = integrations[0];
  const sampleFunction = sampleIntegration
    ? Object.values(sampleIntegration.functions)[0]
    : undefined;
  const integrationKey = sampleIntegration?.key ?? "your-integration";
  const functionName = sampleFunction?.name ?? "your-function";
  const defaultScopes = sampleFunction?.defaultScopes ?? [];
  const requestPayload = {
    agentId: "research-bot-01",
    agentClass: "researcher",
    scopes: defaultScopes.length > 0 ? defaultScopes : ["scope.read"],
    payload: buildDefaultPayload(functionName),
  };
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/context/${integrationKey}/${functionName}`;
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

  return {
    endpoint,
    integrationKey,
    functionName,
    requestBody,
    curlExample,
    fetchExample,
  };
};

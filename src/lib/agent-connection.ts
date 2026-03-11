import type { FunctionSpec, IntegrationSpec } from "@/src/types/context-layer";

export const OPENHANDS_CONTEXT_KEY_ENV = "$OPENHANDS_CONTEXT_KEY";

export interface AgentConnectionGuide {
  endpoint: string;
  integrationKey: string;
  functionName: string;
  requestBody: string;
  curlExample: string;
  fetchExample: string;
  skillEndpoint: string;
  skillCurlExample: string;
}

const buildDefaultPayload = (functionName: string) => ({
  example: `replace with the arguments for ${functionName}`,
});

const isFunctionAvailable = (functionSpec: FunctionSpec) =>
  functionSpec.enabled && functionSpec.accessMode !== "disabled";

const getSampleFunction = (integrations: IntegrationSpec[]) => {
  for (const integration of integrations) {
    if (!integration.enabled) {
      continue;
    }

    const sampleFunction = Object.values(integration.functions).find(isFunctionAvailable);

    if (sampleFunction) {
      return {
        integration,
        functionSpec: sampleFunction,
      };
    }
  }

  return null;
};

export const buildAgentConnectionGuide = ({
  baseUrl,
  apiKey,
  integrations,
}: {
  baseUrl: string;
  apiKey: string;
  integrations: IntegrationSpec[];
}): AgentConnectionGuide => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const sample = getSampleFunction(integrations);
  const integrationKey = sample?.integration.key ?? "your-integration";
  const functionName = sample?.functionSpec.name ?? "your-function";
  const defaultScopes = sample?.functionSpec.defaultScopes ?? [];
  const requestPayload = {
    agentId: "research-bot-01",
    agentClass: "researcher",
    scopes: defaultScopes.length > 0 ? defaultScopes : ["scope.read"],
    payload: buildDefaultPayload(functionName),
  };
  const endpoint = `${normalizedBaseUrl}/api/context/${integrationKey}/${functionName}`;
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
  const skillEndpoint = `${normalizedBaseUrl}/api/context/skill`;
  const skillCurlExample = [
    `curl -L \"${skillEndpoint}\"`,
    `  -H \"Authorization: Bearer ${apiKey}\"`,
    "  -o SKILL.md",
  ].join("\\n");

  return {
    endpoint,
    integrationKey,
    functionName,
    requestBody,
    curlExample,
    fetchExample,
    skillEndpoint,
    skillCurlExample,
  };
};

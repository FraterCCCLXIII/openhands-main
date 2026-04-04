import { OPENHANDS_CONTEXT_KEY_ENV } from "@/src/lib/agent-connection";
import type {
  FunctionAccessMode,
  FunctionSpec,
  IntegrationSpec,
} from "@/src/types/context-layer";

const getFunctionAccessMode = (functionSpec: FunctionSpec): FunctionAccessMode =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

const isFunctionAvailable = (functionSpec: FunctionSpec) =>
  functionSpec.enabled && getFunctionAccessMode(functionSpec) !== "disabled";

const renderScopes = (scopes: string[]) =>
  scopes.length > 0 ? scopes.map((scope) => `\`${scope}\``).join(", ") : "none";

const renderAccessMode = (functionSpec: FunctionSpec) => {
  const accessMode = getFunctionAccessMode(functionSpec);

  if (accessMode === "approval_required") {
    return "approval required";
  }

  return accessMode;
};

/**
 * Generates the downloadable SKILL.md file for the authenticated owner profile.
 */
export const buildAgentSkillMarkdown = ({
  baseUrl,
  integrations,
}: {
  baseUrl: string;
  integrations: IntegrationSpec[];
}) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const availableIntegrations = integrations
    .filter((integration) => integration.enabled)
    .map((integration) => ({
      ...integration,
      availableFunctions: Object.values(integration.functions)
        .filter(isFunctionAvailable)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .filter((integration) => integration.availableFunctions.length > 0);
  const availableFunctionCount = availableIntegrations.reduce(
    (count, integration) => count + integration.availableFunctions.length,
    0,
  );

  const lines = [
    "---",
    "name: context-layer-profile-tools",
    "description: Generated skill for the current OpenHands Context Layer profile. Use it when an agent should call one of the registered tools through /api/context.",
    "---",
    "",
    "This generated skill lists the tools that are currently available through the OpenHands Context Layer profile.",
    "",
    "## Auth",
    "",
    `- Store the personal context-layer API key in ${OPENHANDS_CONTEXT_KEY_ENV}.`,
    `- Send \`Authorization: Bearer ${OPENHANDS_CONTEXT_KEY_ENV}\`.`,
    `- Base URL: \`${normalizedBaseUrl}\``,
    `- Endpoint pattern: \`POST ${normalizedBaseUrl}/api/context/{integrationKey}/{functionName}\``,
    "",
    "## Request body",
    "",
    "```json",
    JSON.stringify(
      {
        scopes: ["scope.read"],
        payload: {},
      },
      null,
      2,
    ),
    "```",
    "",
    `## Available tools (${availableFunctionCount})`,
    "",
  ];

  if (availableIntegrations.length === 0) {
    lines.push(
      "No enabled tools are available yet. Add integrations in the dashboard and keep the tool toggles enabled to populate this generated skill.",
    );
  } else {
    for (const integration of availableIntegrations) {
      lines.push(
        `### ${integration.name} (\`${integration.key}\`)`,
        "",
        `- Integration kind: \`${integration.kind}\``,
        `- Provider: \`${integration.provider}\``,
        "",
      );

      for (const functionSpec of integration.availableFunctions) {
        lines.push(
          `#### \`${integration.key}.${functionSpec.name}\``,
          "",
          `- Description: ${functionSpec.description || "No description provided."}`,
          `- Invoke with: \`POST ${normalizedBaseUrl}/api/context/${integration.key}/${functionSpec.name}\``,
          `- Default scopes: ${renderScopes(functionSpec.defaultScopes)}`,
          `- Access: ${renderAccessMode(functionSpec)}`,
          "",
        );
      }
    }
  }

  lines.push(
    "## Notes",
    "",
    "- Each tool call should pass provider-specific arguments inside `payload`.",
    "- Tools marked as `approval required` need a temporary grant before invocation succeeds.",
    "- Regenerate this file after changing integrations or function toggles so the tool list stays current.",
    "",
  );

  return lines.join("\n");
};

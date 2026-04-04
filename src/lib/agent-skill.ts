import { OPENHANDS_CONTEXT_KEY_ENV } from "@/src/lib/agent-connection";
import type {
  ToolAccessMode,
  ToolSpec,
  IntegrationSpec,
} from "@/src/types/context-layer";

const getToolAccessMode = (toolSpec: ToolSpec): ToolAccessMode =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

const isToolAvailable = (toolSpec: ToolSpec) =>
  toolSpec.enabled && getToolAccessMode(toolSpec) !== "disabled";

const renderScopes = (scopes: string[]) =>
  scopes.length > 0 ? scopes.map((scope) => `\`${scope}\``).join(", ") : "none";

const renderAccessMode = (toolSpec: ToolSpec) => {
  const accessMode = getToolAccessMode(toolSpec);

  if (accessMode === "approval_required") {
    return "approval required";
  }

  return accessMode;
};

/**
 * Generates the downloadable SKILL.md tool catalog for the authenticated owner profile.
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
      availableTools: Object.values(integration.functions)
        .filter(isToolAvailable)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .filter((integration) => integration.availableTools.length > 0);
  const availableToolCount = availableIntegrations.reduce(
    (count, integration) => count + integration.availableTools.length,
    0,
  );

  const lines = [
    "---",
    "name: context-layer-profile-tools",
    "description: Generated tool catalog for the current OpenHands Context Layer profile. Use it when an agent should call one of the registered tools through /api/context.",
    "---",
    "",
    "This generated tool catalog lists the tools that are currently available through the OpenHands Context Layer profile.",
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
    `## Available tools (${availableToolCount})`,
    "",
  ];

  if (availableIntegrations.length === 0) {
    lines.push(
      "No enabled tools are available yet. Add integrations in the dashboard and keep the tool toggles enabled to populate this generated tool catalog.",
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

      for (const toolSpec of integration.availableTools) {
        lines.push(
          `#### \`${integration.key}.${toolSpec.name}\``,
          "",
          `- Description: ${toolSpec.description || "No description provided."}`,
          `- Invoke with: \`POST ${normalizedBaseUrl}/api/context/${integration.key}/${toolSpec.name}\``,
          `- Default scopes: ${renderScopes(toolSpec.defaultScopes)}`,
          `- Access: ${renderAccessMode(toolSpec)}`,
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
    "- Regenerate this file after changing integrations or tool toggles so the tool list stays current.",
    "",
  );

  return lines.join("\n");
};

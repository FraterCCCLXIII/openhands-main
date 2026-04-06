import type { ToolSpec, GenericHttpRequestTemplate, IntegrationSpec } from "@/src/types/context-layer";

const TEMPLATE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const DEFAULT_PAYLOAD_EXAMPLE = "replace with the value for";

const getToolAccessMode = (toolSpec: ToolSpec) =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

const collectTemplateVariables = (template: unknown, target: Set<string>) => {
  if (typeof template === "string") {
    for (const match of template.matchAll(TEMPLATE)) {
      const variable = match[1]?.trim();
      if (variable) {
        target.add(variable);
      }
    }
    return;
  }

  if (Array.isArray(template)) {
    for (const entry of template) {
      collectTemplateVariables(entry, target);
    }
    return;
  }

  if (template && typeof template === "object") {
    for (const value of Object.values(template)) {
      collectTemplateVariables(value, target);
    }
  }
};

const setNestedExampleValue = (
  payload: Record<string, unknown>,
  variablePath: string,
  value: unknown,
) => {
  const segments = variablePath.split(".").filter(Boolean);
  if (segments.length === 0) {
    return;
  }

  let cursor: Record<string, unknown> = payload;
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }

  cursor[segments[segments.length - 1]] = value;
};

const getRequestTemplate = (toolSpec: ToolSpec) =>
  toolSpec.config.request as GenericHttpRequestTemplate | undefined;

export const buildExamplePayload = (toolSpec: ToolSpec) => {
  const requestTemplate = getRequestTemplate(toolSpec);
  if (!requestTemplate) {
    return {};
  }

  const variables = new Set<string>();
  collectTemplateVariables(requestTemplate, variables);

  const payload: Record<string, unknown> = {};
  for (const variable of [...variables].sort((left, right) => left.localeCompare(right))) {
    if (variable === "body") {
      payload.body = {
        example: "replace with the request body",
      };
      continue;
    }

    setNestedExampleValue(
      payload,
      variable,
      `${DEFAULT_PAYLOAD_EXAMPLE} ${variable}`,
    );
  }

  return payload;
};

const getExamplePriority = (toolSpec: ToolSpec) => {
  const accessMode = getToolAccessMode(toolSpec);
  const payloadVariableCount = Object.keys(buildExamplePayload(toolSpec)).length;

  return {
    accessModePriority: accessMode === "approval_required" ? 1 : 0,
    payloadVariableCount,
  };
};

const compareToolSpecs = (left: ToolSpec, right: ToolSpec) => {
  const leftPriority = getExamplePriority(left);
  const rightPriority = getExamplePriority(right);

  return (
    leftPriority.accessModePriority - rightPriority.accessModePriority ||
    leftPriority.payloadVariableCount - rightPriority.payloadVariableCount ||
    left.name.localeCompare(right.name)
  );
};

export const listExampleTools = (integration: IntegrationSpec) =>
  Object.values(integration.tools)
    .filter((toolSpec) => toolSpec.enabled && getToolAccessMode(toolSpec) !== "disabled")
    .sort(compareToolSpecs);

export const selectExampleIntegration = (integrations: IntegrationSpec[]) =>
  integrations
    .filter((integration) => integration.enabled)
    .map((integration) => ({ integration, tools: listExampleTools(integration) }))
    .filter(({ tools }) => tools.length > 0)
    .sort((left, right) => left.integration.key.localeCompare(right.integration.key))[0];

export const buildPermissionNote = (toolSpec?: ToolSpec) => {
  if (!toolSpec) {
    return "Enabled tools are callable by default unless you configure an agent-class policy to narrow access; case-by-case tools still need a temporary approval grant.";
  }

  if (getToolAccessMode(toolSpec) === "approval_required") {
    return "This sample tool is marked case-by-case, so it returns a permission prompt until a temporary approval grant is active for the chosen agent.";
  }

  return "Enabled tools are callable by default unless you configure an agent-class policy to narrow access for that agent class.";
};

export { getToolAccessMode };

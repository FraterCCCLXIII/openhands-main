import { collectHttpTemplateVariables } from "@/src/lib/http-request-template";
import { isRecord } from "@/src/lib/type-utils";
import type { ToolSpec, GenericHttpRequestTemplate, IntegrationSpec } from "@/src/types/context-layer";

const DEFAULT_PAYLOAD_EXAMPLE = "replace with the value for";

const isHttpRequestTemplate = (value: unknown): value is GenericHttpRequestTemplate =>
  isRecord(value) && typeof value.method === "string" && typeof value.path === "string";

const getToolAccessMode = (toolSpec: ToolSpec) =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

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
    if (!isRecord(existing)) {
      cursor[segment] = {};
    }

    const nextCursor = cursor[segment];
    if (!isRecord(nextCursor)) {
      return;
    }

    cursor = nextCursor;
  }

  const lastSegment = segments.at(-1);
  if (!lastSegment) {
    return;
  }

  cursor[lastSegment] = value;
};

const getRequestTemplate = (toolSpec: ToolSpec) => {
  const requestTemplate = toolSpec.config["request"];
  return isHttpRequestTemplate(requestTemplate) ? requestTemplate : undefined;
};

export const buildExamplePayload = (toolSpec: ToolSpec) => {
  const requestTemplate = getRequestTemplate(toolSpec);
  if (!requestTemplate) {
    return {};
  }

  const payload: Record<string, unknown> = {};
  for (const variable of [...collectHttpTemplateVariables(requestTemplate)].sort((left, right) =>
    left.localeCompare(right),
  )) {
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

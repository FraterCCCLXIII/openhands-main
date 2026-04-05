import { nowIso } from "@/src/lib/core/date";
import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  AccessDecision,
  AgentClassPolicy,
  ToolAccessMode,
  ToolSpec,
  IntegrationSpec,
  PolicyRule,
  TemporaryGrant,
  UnusedToolWindowUnit,
} from "@/src/types/context-layer";

const unique = (values: string[]) => [...new Set(values)];

export const normalizeScopes = (scopes: string[]) => [...scopes].sort();

export const sameScopes = (left: string[], right: string[]) => {
  const normalizedLeft = normalizeScopes(left);
  const normalizedRight = normalizeScopes(right);

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((scope, index) => scope === normalizedRight[index])
  );
};

export const getToolAccessMode = (
  toolSpec: ToolSpec,
): ToolAccessMode =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

export const normalizeToolSpec = (toolSpec: ToolSpec): ToolSpec => {
  const accessMode = getToolAccessMode(toolSpec);

  return {
    ...toolSpec,
    accessMode,
    enabled: accessMode !== "disabled",
  };
};

export const normalizeTools = (tools: Record<string, ToolSpec>) =>
  Object.fromEntries(
    Object.entries(tools).map(([name, toolSpec]) => [name, normalizeToolSpec(toolSpec)]),
  );

const permittedByRule = (
  rule: PolicyRule,
  toolName: string,
  requestedScopes: string[],
  fineGrained: boolean,
) => {
  if (!rule.enabled) {
    return false;
  }

  if (
    fineGrained &&
    rule.toolNames.length > 0 &&
    !rule.toolNames.includes(toolName)
  ) {
    return false;
  }

  if (
    rule.scopes.length > 0 &&
    !requestedScopes.every((scope) => rule.scopes.includes(scope))
  ) {
    return false;
  }

  return true;
};

export const resolveEffectiveScopes = (
  toolSpec: ToolSpec,
  requestedScopes: string[] = [],
) => unique(requestedScopes.length > 0 ? requestedScopes : toolSpec.defaultScopes);

const findActiveGrant = ({
  agentId,
  agentClass,
  integrationKey,
  toolName,
  effectiveScopes,
  temporaryGrants,
  currentTime = nowIso(),
}: {
  agentId: string | null;
  agentClass: string | null;
  integrationKey: string;
  toolName: string;
  effectiveScopes: string[];
  temporaryGrants: TemporaryGrant[];
  currentTime?: string;
}) =>
  temporaryGrants.find((grant) => {
    if (
      grant.agentId !== agentId ||
      grant.agentClass !== agentClass ||
      grant.integrationKey !== integrationKey ||
      grant.toolName !== toolName
    ) {
      return false;
    }

    if (grant.expiresAt <= currentTime) {
      return false;
    }

    return (
      grant.scopes.length === 0 ||
      effectiveScopes.every((scope) => grant.scopes.includes(scope))
    );
  });

export const getToolSpecOrThrow = (
  integration: IntegrationSpec,
  toolName: string,
) => {
  const toolSpec = integration.tools[toolName];
  if (!toolSpec) {
    throw new ContextLayerError(
      `Unknown tool '${toolName}' for integration '${integration.key}'.`,
      404,
    );
  }

  return toolSpec;
};

export const evaluateIntegrationAccess = ({
  agentId,
  agentClass,
  integration,
  toolName,
  requestedScopes = [],
  temporaryGrants,
  policy,
  currentTime,
}: {
  agentId: string | null;
  agentClass: string | null;
  integration: IntegrationSpec;
  toolName: string;
  requestedScopes?: string[];
  temporaryGrants: TemporaryGrant[];
  policy: AgentClassPolicy | null;
  currentTime?: string;
}): AccessDecision => {
  const toolSpec = getToolSpecOrThrow(integration, toolName);
  const effectiveScopes = resolveEffectiveScopes(toolSpec, requestedScopes);
  const accessMode = getToolAccessMode(toolSpec);

  if (!integration.enabled) {
    return {
      allowed: false,
      reason: "Integration disabled",
      effectiveScopes,
    };
  }

  if (!toolSpec.enabled || accessMode === "disabled") {
    return { allowed: false, reason: "Tool disabled", effectiveScopes };
  }

  const activeGrant = findActiveGrant({
    agentId,
    agentClass,
    integrationKey: integration.key,
    toolName,
    effectiveScopes,
    temporaryGrants,
    currentTime,
  });

  if (accessMode === "approval_required") {
    if (activeGrant) {
      return {
        allowed: true,
        reason: "Allowed by temporary approval",
        effectiveScopes,
      };
    }

    return { allowed: false, reason: "Permission required", effectiveScopes };
  }

  if (!policy) {
    return {
      allowed: true,
      reason: "Allowed by enabled tool default",
      effectiveScopes,
    };
  }

  for (const rule of policy.rules) {
    if (rule.integrationKey !== integration.key) {
      continue;
    }

    const fineGrained =
      integration.fineGrainedPermissions && toolSpec.fineGrainedPermissions;
    if (permittedByRule(rule, toolName, effectiveScopes, fineGrained)) {
      return {
        allowed: true,
        reason: "Allowed by agent class policy",
        effectiveScopes,
      };
    }
  }

  if (activeGrant) {
    return {
      allowed: true,
      reason: "Allowed by temporary approval",
      effectiveScopes,
    };
  }

  return { allowed: false, reason: "Permission required", effectiveScopes };
};

export const subtractUnusedWindow = (
  referenceIso: string,
  value: number,
  unit: UnusedToolWindowUnit,
) => {
  const reference = new Date(referenceIso);
  const next = new Date(reference);

  switch (unit) {
    case "weeks":
      next.setUTCDate(next.getUTCDate() - value * 7);
      break;
    case "months":
      next.setUTCMonth(next.getUTCMonth() - value);
      break;
    default:
      next.setUTCDate(next.getUTCDate() - value);
      break;
  }

  return next.toISOString();
};

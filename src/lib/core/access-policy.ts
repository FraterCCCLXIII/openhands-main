import { nowIso } from "@/src/lib/core/date";
import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  AccessDecision,
  AgentClassPolicy,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationSpec,
  PolicyRule,
  TemporaryGrant,
  UnusedFunctionWindowUnit,
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

export const getFunctionAccessMode = (
  functionSpec: FunctionSpec,
): FunctionAccessMode =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

export const normalizeFunctionSpec = (functionSpec: FunctionSpec): FunctionSpec => {
  const accessMode = getFunctionAccessMode(functionSpec);

  return {
    ...functionSpec,
    accessMode,
    enabled: accessMode !== "disabled",
  };
};

export const normalizeFunctions = (functions: Record<string, FunctionSpec>) =>
  Object.fromEntries(
    Object.entries(functions).map(([name, functionSpec]) => [
      name,
      normalizeFunctionSpec(functionSpec),
    ]),
  );

const permittedByRule = (
  rule: PolicyRule,
  functionName: string,
  requestedScopes: string[],
  fineGrained: boolean,
) => {
  if (!rule.enabled) {
    return false;
  }

  if (
    fineGrained &&
    rule.functionNames.length > 0 &&
    !rule.functionNames.includes(functionName)
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
  functionSpec: FunctionSpec,
  requestedScopes: string[] = [],
) => unique(requestedScopes.length > 0 ? requestedScopes : functionSpec.defaultScopes);

const findActiveGrant = ({
  agentId,
  agentClass,
  integrationKey,
  functionName,
  effectiveScopes,
  temporaryGrants,
  currentTime = nowIso(),
}: {
  agentId: string;
  agentClass: string;
  integrationKey: string;
  functionName: string;
  effectiveScopes: string[];
  temporaryGrants: TemporaryGrant[];
  currentTime?: string;
}) =>
  temporaryGrants.find((grant) => {
    if (
      grant.agentId !== agentId ||
      grant.agentClass !== agentClass ||
      grant.integrationKey !== integrationKey ||
      grant.functionName !== functionName
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

export const getFunctionSpecOrThrow = (
  integration: IntegrationSpec,
  functionName: string,
) => {
  const functionSpec = integration.functions[functionName];
  if (!functionSpec) {
    throw new ContextLayerError(
      `Unknown function '${functionName}' for integration '${integration.key}'.`,
      404,
    );
  }

  return functionSpec;
};

export const evaluateIntegrationAccess = ({
  agentId,
  agentClass,
  integration,
  functionName,
  requestedScopes = [],
  temporaryGrants,
  policy,
  currentTime,
}: {
  agentId: string;
  agentClass: string;
  integration: IntegrationSpec;
  functionName: string;
  requestedScopes?: string[];
  temporaryGrants: TemporaryGrant[];
  policy: AgentClassPolicy | null;
  currentTime?: string;
}): AccessDecision => {
  const functionSpec = getFunctionSpecOrThrow(integration, functionName);
  const effectiveScopes = resolveEffectiveScopes(functionSpec, requestedScopes);
  const accessMode = getFunctionAccessMode(functionSpec);

  if (!integration.enabled) {
    return {
      allowed: false,
      reason: "Integration disabled",
      effectiveScopes,
    };
  }

  if (!functionSpec.enabled || accessMode === "disabled") {
    return { allowed: false, reason: "Function disabled", effectiveScopes };
  }

  const activeGrant = findActiveGrant({
    agentId,
    agentClass,
    integrationKey: integration.key,
    functionName,
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
      reason: "Allowed by enabled function default",
      effectiveScopes,
    };
  }

  for (const rule of policy.rules) {
    if (rule.integrationKey !== integration.key) {
      continue;
    }

    const fineGrained =
      integration.fineGrainedPermissions && functionSpec.fineGrainedPermissions;
    if (permittedByRule(rule, functionName, effectiveScopes, fineGrained)) {
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
  unit: UnusedFunctionWindowUnit,
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

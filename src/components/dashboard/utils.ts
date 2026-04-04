import { approvalStatusLabel } from "@/src/lib/access-requests";
import {
  getFunctionAccessMode,
  matchesFunctionSearch,
} from "@/src/components/integrations/function-access-controls";
import type {
  AccessRequest,
  BuiltInConnectorOption,
  FunctionSpec,
  FunctionAccessMode,
  IntegrationSpec,
  UnusedFunctionWindowUnit,
} from "@/src/types/context-layer";

const POPULAR_INTEGRATION_SLUGS = [
  "github",
  "slack",
  "notion",
  "linear",
  "elevenlabs",
] as const;

export type ApprovalRequestFilter = "pending" | "approved" | "denied";

export const UNUSED_FUNCTION_WINDOW_OPTIONS: Array<{
  value: UnusedFunctionWindowUnit;
  label: string;
}> = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

export const subtractUnusedWindow = (
  reference: Date,
  amount: number,
  unit: UnusedFunctionWindowUnit,
) => {
  const next = new Date(reference);

  switch (unit) {
    case "weeks":
      next.setUTCDate(next.getUTCDate() - amount * 7);
      break;
    case "months":
      next.setUTCMonth(next.getUTCMonth() - amount);
      break;
    default:
      next.setUTCDate(next.getUTCDate() - amount);
      break;
  }

  return next;
};

export const formatTrackedUsage = (functionSpec: FunctionSpec) => {
  if (!functionSpec.lastInvokedAt) {
    return "No tracked usage yet";
  }

  const formatted = new Date(functionSpec.lastInvokedAt).toLocaleString();
  const count = functionSpec.invocationCount ?? 0;
  const outcomeLabel = functionSpec.lastInvocationOutcome
    ? functionSpec.lastInvocationOutcome.replace(/_/g, " ")
    : "unknown";

  return count > 0
    ? `Last tracked invocation: ${formatted} · ${count} total · ${outcomeLabel}`
    : `Last tracked invocation: ${formatted} · ${outcomeLabel}`;
};

export const matchesIntegrationSearch = (
  integration: IntegrationSpec,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    integration.name,
    integration.key,
    integration.provider,
    integration.kind,
    integration.authStrategy,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

export const matchesConnectorSearch = (
  connector: BuiltInConnectorOption,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    connector.name,
    connector.slug,
    connector.description,
    connector.authStrategy,
    ...connector.categories,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

export const approvalStatusTone = (status: AccessRequest["status"]) => {
  switch (approvalStatusLabel(status)) {
    case "approved":
      return "success" as const;
    case "denied":
      return "danger" as const;
    default:
      return "warning" as const;
  }
};

export const matchesAccessRequestFilter = (
  request: AccessRequest,
  filter: ApprovalRequestFilter,
) => approvalStatusLabel(request.status) === filter;

export const matchesAccessRequestSearch = (
  request: AccessRequest,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    request.agentId ?? "",
    request.agentClass ?? "",
    request.integrationKey,
    request.functionName,
    request.justification ?? "",
    request.agentData?.conversationLink ?? "",
    approvalStatusLabel(request.status),
    ...request.scopes,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

export const hasMissingApprovalIdentity = (request: AccessRequest) =>
  !request.agentId && !request.agentClass;

export const formatApprovalIdentityValue = (value: string | null) =>
  value ?? "Not provided";

export const countApprovalRequestsByStatus = (requests: AccessRequest[]) => ({
  pending: requests.filter((request) => approvalStatusLabel(request.status) === "pending")
    .length,
  approved: requests.filter((request) => approvalStatusLabel(request.status) === "approved")
    .length,
  denied: requests.filter((request) => approvalStatusLabel(request.status) === "denied")
    .length,
});

export const formatTimestamp = (value?: string) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
};

export const maskApiKey = (apiKey: string, revealed: boolean) => {
  const trimmed = apiKey.trim();

  if (revealed || !trimmed) {
    return trimmed;
  }

  if (trimmed.length <= 8) {
    return "•".repeat(trimmed.length);
  }

  return `${trimmed.slice(0, 4)}${"•".repeat(
    Math.max(12, trimmed.length - 8),
  )}${trimmed.slice(-4)}`;
};

export const maskStoredApiKey = (keyPrefix: string, keySuffix: string) => {
  const normalizedPrefix = keyPrefix.trim();
  const normalizedSuffix = keySuffix.trim();

  if (!normalizedPrefix && !normalizedSuffix) {
    return "";
  }

  return `${normalizedPrefix}${"•".repeat(12)}${normalizedSuffix}`;
};

export const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return;
  }

  throw new Error("Clipboard API unavailable");
};

export interface FilteredIntegrationEntry {
  integration: IntegrationSpec;
  functions: FunctionSpec[];
  visibleFunctions: FunctionSpec[];
}

export const filterIntegrationsForDisplay = ({
  integrations,
  integrationSearch,
  hideDisabledSkills,
}: {
  integrations: IntegrationSpec[];
  integrationSearch: string;
  hideDisabledSkills: boolean;
}): FilteredIntegrationEntry[] => {
  const normalizedSearch = integrationSearch.trim().toLowerCase();

  return [...integrations]
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.key.localeCompare(right.key),
    )
    .map((integration) => {
      const integrationMatchesSearch = matchesIntegrationSearch(
        integration,
        normalizedSearch,
      );
      const functions = Object.values(integration.functions).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const visibleFunctions = functions.filter((functionSpec) => {
        if (
          hideDisabledSkills &&
          getFunctionAccessMode(functionSpec) === "disabled"
        ) {
          return false;
        }

        return (
          !normalizedSearch ||
          integrationMatchesSearch ||
          matchesFunctionSearch(functionSpec.name, functionSpec, normalizedSearch)
        );
      });

      if (
        normalizedSearch &&
        !integrationMatchesSearch &&
        visibleFunctions.length === 0
      ) {
        return null;
      }

      return {
        integration,
        functions,
        visibleFunctions,
      };
    })
    .filter((value): value is FilteredIntegrationEntry => value !== null);
};

export const buildInstalledIntegrationKeys = (integrations: IntegrationSpec[]) =>
  new Set(
    integrations.flatMap((integration) => {
      const builtInSlug =
        typeof integration.config.builtInSlug === "string"
          ? integration.config.builtInSlug.trim()
          : "";

      return [integration.key, builtInSlug].filter(Boolean);
    }),
  );

export const buildMarketplaceConnectors = ({
  builtInConnectors,
  installedIntegrationKeys,
  search,
}: {
  builtInConnectors: BuiltInConnectorOption[];
  installedIntegrationKeys: Set<string>;
  search: string;
}) => {
  const normalizeRank = (connector: BuiltInConnectorOption) => {
    const explicitIndex = POPULAR_INTEGRATION_SLUGS.indexOf(
      connector.slug as (typeof POPULAR_INTEGRATION_SLUGS)[number],
    );
    return explicitIndex >= 0 ? explicitIndex : POPULAR_INTEGRATION_SLUGS.length + 1;
  };

  return [...builtInConnectors]
    .filter((connector) => !installedIntegrationKeys.has(connector.slug))
    .sort((left, right) => {
      const rankDelta = normalizeRank(left) - normalizeRank(right);
      return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
    })
    .filter((connector) => matchesConnectorSearch(connector, search))
    .slice(0, 5);
};

export const buildUnusedFunctionCandidates = ({
  integrations,
  cutoffDate,
}: {
  integrations: IntegrationSpec[];
  cutoffDate: Date;
}) =>
  integrations.flatMap((integration) =>
    Object.values(integration.functions)
      .filter((functionSpec) => getFunctionAccessMode(functionSpec) !== "disabled")
      .filter(
        (functionSpec) =>
          Boolean(functionSpec.lastInvokedAt) &&
          new Date(functionSpec.lastInvokedAt!).getTime() < cutoffDate.getTime(),
      )
      .map((functionSpec) => ({
        integrationKey: integration.key,
        functionName: functionSpec.name,
        lastInvokedAt: functionSpec.lastInvokedAt as string,
      })),
  );

export const buildConnectorMap = (connectors: BuiltInConnectorOption[]) =>
  new Map(connectors.map((connector) => [connector.slug, connector] as const));

export const resolveIntegrationLogoUrl = ({
  integration,
  connectorBySlug,
  getConnectorLogoUrl,
}: {
  integration: IntegrationSpec;
  connectorBySlug: Map<string, BuiltInConnectorOption>;
  getConnectorLogoUrl: (connector: { appUrl?: string }) => string | null;
}) => {
  const builtInSlug =
    typeof integration.config.builtInSlug === "string"
      ? integration.config.builtInSlug.trim()
      : "";
  const connector =
    connectorBySlug.get(builtInSlug) ?? connectorBySlug.get(integration.key.trim());

  if (connector) {
    return getConnectorLogoUrl(connector);
  }

  const appUrl =
    typeof integration.config.appUrl === "string"
      ? integration.config.appUrl.trim()
      : typeof integration.config.serverUrl === "string"
        ? integration.config.serverUrl.trim()
        : typeof integration.config.apiBaseUrl === "string"
          ? integration.config.apiBaseUrl.trim()
          : "";

  return getConnectorLogoUrl({ appUrl });
};

export const buildFunctionAccessPatch = (
  integrationKey: string,
  functionName: string,
  accessMode: FunctionAccessMode,
) => ({
  url: `/api/integrations/${integrationKey}/functions/${functionName}`,
  method: "PATCH",
  body: { accessMode },
});

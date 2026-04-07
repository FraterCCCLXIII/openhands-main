import {
  getToolAccessMode,
  matchesToolSearch,
} from "@/src/components/integrations/tool-access-controls";
import { approvalStatusLabel } from "@/src/lib/access-requests";
import {
  matchesSearchQuery,
  normalizeCaseInsensitiveText,
} from "@/src/lib/text-utils";
import type {
  AccessRequest,
  ManagedConnectorOption,
  ToolSpec,
  ToolAccessMode,
  IntegrationSpec,
  UnusedToolWindowUnit,
} from "@/src/types/context-layer";

const POPULAR_INTEGRATION_SLUGS = [
  "github",
  "slack",
  "notion",
  "linear",
  "elevenlabs",
] as const;

export type ApprovalRequestFilter = "pending" | "approved" | "denied";

export const UNUSED_TOOL_WINDOW_OPTIONS: Array<{
  value: UnusedToolWindowUnit;
  label: string;
}> = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

export const UNUSED_FUNCTION_WINDOW_OPTIONS = UNUSED_TOOL_WINDOW_OPTIONS;


export const subtractUnusedWindow = (
  reference: Date,
  amount: number,
  unit: UnusedToolWindowUnit,
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

export const formatTrackedUsage = (toolSpec: ToolSpec) => {
  if (!toolSpec.lastInvokedAt) {
    return "No tracked usage yet";
  }

  const formatted = new Date(toolSpec.lastInvokedAt).toLocaleString();
  const count = toolSpec.invocationCount ?? 0;
  const outcomeLabel = toolSpec.lastInvocationOutcome
    ? toolSpec.lastInvocationOutcome.replace(/_/g, " ")
    : "unknown";

  return count > 0
    ? `Last tracked invocation: ${formatted} · ${count} total · ${outcomeLabel}`
    : `Last tracked invocation: ${formatted} · ${outcomeLabel}`;
};

export const matchesIntegrationSearch = (
  integration: IntegrationSpec,
  query: string,
) =>
  matchesSearchQuery(
    [
      integration.name,
      integration.key,
      integration.provider,
      integration.kind,
      integration.authStrategy,
    ],
    query,
  );

export const matchesConnectorSearch = (
  connector: ManagedConnectorOption,
  query: string,
) =>
  matchesSearchQuery(
    [
      connector.name,
      connector.slug,
      connector.description,
      connector.authStrategy,
      ...connector.categories,
    ],
    query,
  );

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
) =>
  matchesSearchQuery(
    [
      request.agentId,
      request.agentClass,
      request.integrationKey,
      request.toolName,
      request.justification,
      request.agentData?.conversationLink,
      approvalStatusLabel(request.status),
      ...request.scopes,
    ],
    query,
  );

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

export interface FilteredIntegrationToolEntry {
  integration: IntegrationSpec;
  tools: ToolSpec[];
  visibleTools: ToolSpec[];
}

export const filterIntegrationsForDisplay = ({
  integrations,
  integrationSearch,
  hideDisabledTools,
}: {
  integrations: IntegrationSpec[];
  integrationSearch: string;
  hideDisabledTools: boolean;
}): FilteredIntegrationToolEntry[] => {
  const normalizedSearch = normalizeCaseInsensitiveText(integrationSearch);

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
      const tools = Object.values(integration.tools).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const visibleTools = tools.filter((toolSpec) => {
        if (
          hideDisabledTools &&
          getToolAccessMode(toolSpec) === "disabled"
        ) {
          return false;
        }

        return (
          !normalizedSearch ||
          integrationMatchesSearch ||
          matchesToolSearch(toolSpec.name, toolSpec, normalizedSearch)
        );
      });

      if (
        normalizedSearch &&
        !integrationMatchesSearch &&
        visibleTools.length === 0
      ) {
        return null;
      }

      return {
        integration,
        tools,
        visibleTools,
      };
    })
    .filter((value): value is FilteredIntegrationToolEntry => value !== null);
};

export const buildInstalledIntegrationKeys = (integrations: IntegrationSpec[]) =>
  new Set(
    integrations.flatMap((integration) => {
      const managedConnectorSlug =
        typeof integration.config.managedConnectorSlug === "string"
          ? integration.config.managedConnectorSlug.trim()
          : "";

      return [integration.key, managedConnectorSlug].filter(Boolean);
    }),
  );

export const buildMarketplaceConnectors = ({
  managedConnectors,
  installedIntegrationKeys,
  search,
}: {
  managedConnectors: ManagedConnectorOption[];
  installedIntegrationKeys: Set<string>;
  search: string;
}) => {
  const normalizeRank = (connector: ManagedConnectorOption) => {
    const explicitIndex = POPULAR_INTEGRATION_SLUGS.indexOf(
      connector.slug as (typeof POPULAR_INTEGRATION_SLUGS)[number],
    );
    return explicitIndex >= 0 ? explicitIndex : POPULAR_INTEGRATION_SLUGS.length + 1;
  };

  return [...managedConnectors]
    .filter((connector) => !installedIntegrationKeys.has(connector.slug))
    .sort((left, right) => {
      const rankDelta = normalizeRank(left) - normalizeRank(right);
      return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
    })
    .filter((connector) => matchesConnectorSearch(connector, search))
    .slice(0, 5);
};

export const buildUnusedToolCandidates = ({
  integrations,
  cutoffDate,
}: {
  integrations: IntegrationSpec[];
  cutoffDate: Date;
}) =>
  integrations.flatMap((integration) =>
    Object.values(integration.tools)
      .filter((toolSpec) => getToolAccessMode(toolSpec) !== "disabled")
      .filter(
        (toolSpec) =>
          Boolean(toolSpec.lastInvokedAt) &&
          new Date(toolSpec.lastInvokedAt!).getTime() < cutoffDate.getTime(),
      )
      .map((toolSpec) => ({
        integrationKey: integration.key,
        toolName: toolSpec.name,
        lastInvokedAt: toolSpec.lastInvokedAt as string,
      })),
  );

export const buildConnectorMap = (connectors: ManagedConnectorOption[]) =>
  new Map(connectors.map((connector) => [connector.slug, connector] as const));

export const resolveIntegrationLogoUrl = ({
  integration,
  connectorBySlug,
  getConnectorLogoUrl,
}: {
  integration: IntegrationSpec;
  connectorBySlug: Map<string, ManagedConnectorOption>;
  getConnectorLogoUrl: (connector: { appUrl?: string }) => string | null;
}) => {
  const managedConnectorSlug =
    typeof integration.config.managedConnectorSlug === "string"
      ? integration.config.managedConnectorSlug.trim()
      : "";
  const connector =
    connectorBySlug.get(managedConnectorSlug) ?? connectorBySlug.get(integration.key.trim());

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

export const buildToolAccessPatch = (
  integrationKey: string,
  toolName: string,
  accessMode: ToolAccessMode,
) => ({
  url: `/api/integrations/${integrationKey}/tools/${toolName}`,
  method: "PATCH",
  body: { accessMode },
});

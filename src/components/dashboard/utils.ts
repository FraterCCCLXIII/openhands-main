import {
  getToolAccessMode,
  matchesToolSearch,
} from "@/src/components/integrations/tool-access-controls";
import { approvalStatusLabel } from "@/src/lib/access-requests";
import { listIntegrationCatalogOptions } from "@/src/lib/integrations/integration-catalog";
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
} from "@/src/types/integrations-hub";

// Popularity ordering is sourced from @openhands/extensions (popularityRank on
// each catalog provider) so the hub keeps no provider-specific list.
const POPULARITY_RANK_BY_SLUG = new Map(
  listIntegrationCatalogOptions().map((provider) => [provider.slug, provider.popularityRank]),
);
const DEFAULT_POPULARITY_RANK = Number.MAX_SAFE_INTEGER;

export type ApprovalRequestFilter = "pending" | "approved" | "denied";

export const UNUSED_TOOL_WINDOW_OPTIONS: Array<{
  value: UnusedToolWindowUnit;
  label: string;
}> = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];


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

export const formatTimestampParts = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
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

const visibleApiKeyPrefix = (value: string) => {
  const underscoreIndex = value.indexOf("_");
  if (underscoreIndex >= 0) {
    return value.slice(0, underscoreIndex + 1);
  }
  return value.slice(0, 4);
};

export const maskApiKey = (apiKey: string, revealed: boolean) => {
  const trimmed = apiKey.trim();

  if (revealed || !trimmed) {
    return trimmed;
  }

  if (trimmed.length <= 8) {
    return "•".repeat(trimmed.length);
  }

  const visiblePrefix = visibleApiKeyPrefix(trimmed);
  return `${visiblePrefix}${"•".repeat(12)}${trimmed.slice(-4)}`;
};

export const maskStoredApiKey = (keyPrefix: string | null | undefined, keySuffix: string | null | undefined) => {
  const normalizedPrefix = (keyPrefix ?? "").trim();
  const normalizedSuffix = (keySuffix ?? "").trim();

  if (!normalizedPrefix && !normalizedSuffix) {
    return "";
  }

  return `${visibleApiKeyPrefix(normalizedPrefix)}${"•".repeat(12)}${normalizedSuffix}`;
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
  new Set(integrations.map((integration) => integration.key.trim()).filter(Boolean));

export const buildInstalledManagedConnectorSlugs = (integrations: IntegrationSpec[]) =>
  new Set(
    integrations
      .map((integration) =>
        typeof integration.config.managedConnectorSlug === "string"
          ? integration.config.managedConnectorSlug.trim()
          : "",
      )
      .filter(Boolean),
  );

export const buildSuggestedIntegrationKey = (
  baseKey: string,
  installedIntegrationKeys: Set<string>,
) => {
  const normalizedBaseKey = baseKey.trim() || "integration";
  if (!installedIntegrationKeys.has(normalizedBaseKey)) {
    return normalizedBaseKey;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalizedBaseKey}-${suffix}`;
    if (!installedIntegrationKeys.has(candidate)) {
      return candidate;
    }
  }

  return `${normalizedBaseKey}-${Date.now()}`;
};

export const buildMarketplaceConnectors = ({
  managedConnectors,
  search,
}: {
  managedConnectors: ManagedConnectorOption[];
  search: string;
}) => {
  const normalizeRank = (connector: ManagedConnectorOption) =>
    POPULARITY_RANK_BY_SLUG.get(connector.slug) ?? DEFAULT_POPULARITY_RANK;

  return [...managedConnectors]
    .sort((left, right) => {
      const rankDelta = normalizeRank(left) - normalizeRank(right);
      return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
    })
    .filter((connector) => matchesConnectorSearch(connector, search));
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

export type ConnectorLogoMetadata = {
  logoUrl: string | null;
  iconBg?: string | null;
  iconColor?: string | null;
};

const fallbackConnectorLogoInput = (integration: IntegrationSpec) => ({
  logoUrl:
    typeof integration.config.logoUrl === "string" ? integration.config.logoUrl.trim() : "",
  appUrl:
    typeof integration.config.appUrl === "string"
      ? integration.config.appUrl.trim()
      : typeof integration.config.serverUrl === "string"
        ? integration.config.serverUrl.trim()
        : typeof integration.config.apiBaseUrl === "string"
          ? integration.config.apiBaseUrl.trim()
          : "",
  iconBg:
    typeof integration.config.iconBg === "string" ? integration.config.iconBg.trim() : null,
  iconColor:
    typeof integration.config.iconColor === "string"
      ? integration.config.iconColor.trim()
      : null,
});

export const resolveIntegrationLogoMetadata = ({
  integration,
  connectorBySlug,
  getConnectorLogoUrl,
}: {
  integration: IntegrationSpec;
  connectorBySlug: Map<string, ManagedConnectorOption>;
  getConnectorLogoUrl: (connector: { logoUrl?: string; appUrl?: string }) => string | null;
}): ConnectorLogoMetadata => {
  const managedConnectorSlug =
    typeof integration.config.managedConnectorSlug === "string"
      ? integration.config.managedConnectorSlug.trim()
      : "";
  const connector =
    connectorBySlug.get(managedConnectorSlug) ?? connectorBySlug.get(integration.key.trim());

  if (connector) {
    return {
      logoUrl: getConnectorLogoUrl(connector),
      iconBg: connector.iconBg,
      iconColor: connector.iconColor,
    };
  }

  const fallback = fallbackConnectorLogoInput(integration);
  return {
    logoUrl: getConnectorLogoUrl(fallback),
    iconBg: fallback.iconBg,
    iconColor: fallback.iconColor,
  };
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

import {
  getToolAccessMode,
  matchesToolSearch,
} from "@/src/components/integrations/tool-access-controls";
import {
  matchesExactSearchQuery,
  normalizeCaseInsensitiveText,
} from "@/src/lib/text-utils";
import type {
  AuthStrategy,
  ManagedConnectorOption,
  ToolAccessMode,
  ToolSpec,
} from "@/src/types/integrations-hub";

export type IntegrationKind = "managed" | "mcp";
export type WizardFlow = "add" | "catalog";

export function getWizardFlow(searchParams: Pick<URLSearchParams, "get"> | null): WizardFlow {
  return searchParams?.get("managedConnector") ? "catalog" : "add";
}


type DiscoverFeedbackTone = "info" | "success" | "error";
export type ApiDebugDetails = Record<string, unknown>;

export interface DiscoverFeedback {
  tone: DiscoverFeedbackTone;
  message: string;
  debugDetails?: ApiDebugDetails;
}

export interface DiscoveryResponse {
  provider: "mcp" | "mock" | "http";
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  tools: Record<string, ToolSpec>;
}

export interface WizardDraft {
  kind: IntegrationKind | null;
  key: string;
  name: string;
  managedConnectorSlug: string;
  serverUrl: string;
  accessToken: string;
  apiKey: string;
  headerName: string;
  username: string;
  password: string;
  resourceId: string;
}

export const INITIAL_DRAFT: WizardDraft = {
  kind: null,
  key: "",
  name: "",
  managedConnectorSlug: "",
  serverUrl: "",
  accessToken: "",
  apiKey: "",
  headerName: "X-API-Key",
  username: "",
  password: "",
  resourceId: "",
};

export const integrationWizardInputClassName =
  "h-9 min-h-9 w-full rounded-md border border-[var(--oh-border)] bg-[var(--oh-bg-input)] px-4 py-0 text-sm leading-5 text-white outline-none transition-colors focus:border-[var(--oh-accent)]";

export const formatDebugDetails = (debugDetails: ApiDebugDetails) =>
  JSON.stringify(debugDetails, null, 2);

export const authStrategyLabel = (strategy: AuthStrategy) => {
  switch (strategy) {
    case "api_key":
      return "API key";
    case "oauth2":
      return "OAuth";
    case "bearer":
      return "Bearer token";
    case "basic":
      return "Basic auth";
    case "none":
      return "No auth";
    case "mcp_session":
      return "MCP session";
    default:
      return strategy;
  }
};

export const connectorOptionLabel = (connector: ManagedConnectorOption) =>
  `${connector.name} (${connector.slug})`;

export const findConnectorByQuery = (
  connectors: ManagedConnectorOption[],
  query: string,
) => {
  const normalizedQuery = normalizeCaseInsensitiveText(query);
  if (!normalizedQuery) {
    return null;
  }

  return (
    connectors.find((connector) =>
      matchesExactSearchQuery(
        [connectorOptionLabel(connector), connector.name, connector.slug],
        normalizedQuery,
      ),
    ) ?? null
  );
};

export const buildManagedConnectorCredentials = (
  draft: WizardDraft,
  connector: ManagedConnectorOption | null,
) => {
  switch (connector?.authStrategy) {
    case "oauth2":
    case "none":
      return {};
    case "api_key":
      return {
        headerName: connector.apiKeyHeaderName?.trim() || draft.headerName.trim(),
        secret: draft.apiKey.trim(),
      };
    case "basic":
      return {
        username: draft.username.trim(),
        password: draft.password.trim(),
      };
    case "bearer":
    default:
      return {
        accessToken: draft.accessToken.trim(),
      };
  }
};

export const hasManagedConnectorCredentialInput = (
  draft: WizardDraft,
  connector: ManagedConnectorOption | null,
) => {
  switch (connector?.authStrategy) {
    case "oauth2":
      return false;
    case "none":
      return true;
    case "api_key":
      return !!draft.apiKey.trim();
    case "basic":
      return !!draft.username.trim() && !!draft.password.trim();
    case "bearer":
    default:
      return !!draft.accessToken.trim();
  }
};

export const buildDiscoverPayload = (
  draft: WizardDraft,
  connector: ManagedConnectorOption | null,
  connection?: { connectionId?: string } | null,
) => {
  if (!draft.kind) {
    throw new Error("Select Managed connector or MCP first.");
  }

  if (draft.kind === "managed") {
    if (!draft.managedConnectorSlug.trim()) {
      throw new Error("Choose a managed connector first.");
    }

    return {
      key: draft.key.trim(),
      kind: "managed" as const,
      config: {
        managedConnectorSlug: draft.managedConnectorSlug.trim(),
        ...(connection?.connectionId
          ? { connectionId: connection.connectionId }
          : {}),
        ...(draft.resourceId.trim() ? { resourceId: draft.resourceId.trim() } : {}),
      },
      credentials: buildManagedConnectorCredentials(draft, connector),
    };
  }

  return {
    key: draft.key.trim(),
    kind: draft.kind,
    config: {
      serverUrl: draft.serverUrl.trim(),
    },
    credentials: {
      accessToken: draft.accessToken.trim(),
      headerName: draft.headerName.trim(),
      secret: draft.apiKey.trim(),
      username: draft.username.trim(),
      password: draft.password.trim(),
    },
  };
};

export const buildCreatePayload = (
  draft: WizardDraft,
  discovery: DiscoveryResponse,
  toolModes: Record<string, ToolAccessMode>,
  connector: ManagedConnectorOption | null,
) => {
  if (!draft.kind) {
    throw new Error("Select Managed connector or MCP first.");
  }

  const key = draft.key.trim();
  const draftName = draft.name.trim();
  const name =
    draft.kind === "managed"
      ? draftName && draftName !== key && draftName !== draft.managedConnectorSlug.trim()
        ? draftName
        : connector?.name || key
      : draftName || key;

  return {
    key,
    name,
    kind:
      draft.kind === "managed"
        ? discovery.provider === "http"
          ? "api"
          : "mcp"
        : draft.kind,
    provider: discovery.provider,
    authStrategy: discovery.authStrategy,
    enabled: true,
    fineGrainedPermissions: true,
    config:
      draft.kind === "managed"
        ? {
            managedConnectorSlug: draft.managedConnectorSlug.trim(),
            ...(typeof discovery.config.connectionId === "string"
              ? { connectionId: discovery.config.connectionId }
              : {}),
            ...(typeof discovery.config.resourceId === "string"
              ? { resourceId: discovery.config.resourceId }
              : {}),
          }
        : discovery.config,
    credentials: discovery.credentials,
    tools: Object.fromEntries(
      Object.entries(discovery.tools).map(([name, toolSpec]) => {
        const accessMode = toolModes[name] ?? getToolAccessMode(toolSpec);
        return [
          name,
          {
            ...toolSpec,
            accessMode,
            enabled: accessMode !== "disabled",
          },
        ];
      }),
    ),
  };
};

export const getReviewedTools = (discovery: DiscoveryResponse | null) =>
  Object.entries(discovery?.tools ?? {}).sort(([leftName], [rightName]) =>
    leftName.localeCompare(rightName),
  );

export const filterReviewedTools = ({
  toolSearch,
  reviewedTools,
}: {
  toolSearch: string;
  reviewedTools: Array<[string, ToolSpec]>;
}) =>
  reviewedTools.filter(([name, toolSpec]) =>
    matchesToolSearch(name, toolSpec, toolSearch),
  );

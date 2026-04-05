import {
  getToolAccessMode,
  matchesToolSearch,
} from "@/src/components/integrations/tool-access-controls";
import type {
  AuthStrategy,
  BuiltInConnectorOption,
  ToolAccessMode,
  ToolSpec,
} from "@/src/types/context-layer";

export type IntegrationKind = "built_in" | "mcp";
export type WizardStep = 1 | 2 | 3;
export type DiscoverFeedbackTone = "info" | "success" | "error";
export type ApiDebugDetails = Record<string, unknown>;

export interface DiscoverFeedback {
  tone: DiscoverFeedbackTone;
  message: string;
  debugDetails?: ApiDebugDetails;
}

export interface DiscoveryResponse {
  provider: "composio" | "mcp" | "mock" | "http";
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  tools: Record<string, ToolSpec>;
}

export interface WizardDraft {
  kind: IntegrationKind | null;
  key: string;
  name: string;
  builtInSlug: string;
  serverUrl: string;
  accessToken: string;
  apiKey: string;
  headerName: string;
  username: string;
  password: string;
}

export const INITIAL_DRAFT: WizardDraft = {
  kind: null,
  key: "",
  name: "",
  builtInSlug: "",
  serverUrl: "",
  accessToken: "",
  apiKey: "",
  headerName: "X-API-Key",
  username: "",
  password: "",
};

export const integrationWizardInputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]";

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

export const connectorOptionLabel = (connector: BuiltInConnectorOption) =>
  `${connector.name} (${connector.slug})`;

export const findConnectorByQuery = (
  connectors: BuiltInConnectorOption[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  return (
    connectors.find((connector) =>
      [connectorOptionLabel(connector), connector.name, connector.slug].some(
        (value) => value.toLowerCase() === normalizedQuery,
      ),
    ) ?? null
  );
};

export const buildBuiltInCredentials = (
  draft: WizardDraft,
  connector: BuiltInConnectorOption | null,
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

export const hasBuiltInCredentialInput = (
  draft: WizardDraft,
  connector: BuiltInConnectorOption | null,
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
  connector: BuiltInConnectorOption | null,
) => {
  if (!draft.kind) {
    throw new Error("Select Built-in connector or MCP first.");
  }

  if (draft.kind === "built_in") {
    if (!draft.builtInSlug.trim()) {
      throw new Error("Choose a built-in connector first.");
    }

    return {
      key: draft.key.trim(),
      kind: "built_in" as const,
      config: {
        builtInSlug: draft.builtInSlug.trim(),
      },
      credentials: buildBuiltInCredentials(draft, connector),
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
  connector: BuiltInConnectorOption | null,
) => {
  if (!draft.kind) {
    throw new Error("Select Built-in connector or MCP first.");
  }

  const key = draft.key.trim();
  const name =
    draft.kind === "built_in"
      ? (connector?.name ?? draft.name.trim()) || key
      : draft.name.trim() || key;

  return {
    key,
    name,
    kind:
      draft.kind === "built_in"
        ? discovery.provider === "http"
          ? "api"
          : "mcp"
        : draft.kind,
    provider: discovery.provider,
    authStrategy: discovery.authStrategy,
    enabled: true,
    fineGrainedPermissions: true,
    config: discovery.config,
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

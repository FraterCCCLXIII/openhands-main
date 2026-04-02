import {
  getFunctionAccessMode,
  matchesFunctionSearch,
} from "@/src/components/admin/function-access-controls";
import type {
  AuthStrategy,
  BuiltInConnectorOption,
  FunctionAccessMode,
  FunctionSpec,
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
  functions: Record<string, FunctionSpec>;
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
  functionModes: Record<string, FunctionAccessMode>,
) => {
  if (!draft.kind) {
    throw new Error("Select Built-in connector or MCP first.");
  }

  return {
    key: draft.key.trim(),
    name: draft.name.trim() || draft.key.trim(),
    kind: draft.kind,
    config:
      draft.kind === "built_in"
        ? {
            ...discovery.config,
            builtInSlug: draft.builtInSlug.trim(),
          }
        : discovery.config,
    credentials: discovery.credentials,
    functions: Object.fromEntries(
      Object.entries(discovery.functions).map(([name, functionSpec]) => [
        name,
        {
          ...functionSpec,
          accessMode: functionModes[name] ?? getFunctionAccessMode(functionSpec),
          enabled:
            (functionModes[name] ?? getFunctionAccessMode(functionSpec)) !==
            "disabled",
        },
      ]),
    ),
  };
};

export const getReviewedFunctions = (discovery: DiscoveryResponse | null) =>
  Object.entries(discovery?.functions ?? {}).sort(([leftName], [rightName]) =>
    leftName.localeCompare(rightName),
  );

export const filterReviewedFunctions = ({
  functionSearch,
  reviewedFunctions,
}: {
  functionSearch: string;
  reviewedFunctions: Array<[string, FunctionSpec]>;
}) =>
  reviewedFunctions.filter(([name, functionSpec]) =>
    matchesFunctionSearch(name, functionSpec, functionSearch),
  );

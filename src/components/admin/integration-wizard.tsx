"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  KeyRound,
  PlugZap,
  Waypoints,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { filterReadyBuiltInConnectors } from "@/src/lib/integrations/connector-readiness";
import { cn } from "@/src/lib/utils";
import type {
  AuthStrategy,
  BuiltInConnectorOption,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationConnectionStatus,
} from "@/src/types/context-layer";

type IntegrationKind = "built_in" | "mcp";
type WizardStep = 1 | 2 | 3;
type DiscoverFeedbackTone = "info" | "success" | "error";

interface IntegrationWizardProps {
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
}

type ApiDebugDetails = Record<string, unknown>;

interface DiscoverFeedback {
  tone: DiscoverFeedbackTone;
  message: string;
  debugDetails?: ApiDebugDetails;
}

interface DiscoveryResponse {
  provider: "composio" | "mcp" | "mock" | "http";
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  functions: Record<string, FunctionSpec>;
}

interface WizardDraft {
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

const INITIAL_DRAFT: WizardDraft = {
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

const inputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]";

class ApiRequestError extends Error {
  public readonly debugDetails?: ApiDebugDetails;

  constructor(message: string, debugDetails?: ApiDebugDetails) {
    super(message);
    this.name = "ApiRequestError";
    this.debugDetails = debugDetails;
  }
}

const fetchJson = async <T,>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
      debug?: ApiDebugDetails;
    } | null;
    throw new ApiRequestError(
      body?.detail ?? `Request failed with status ${response.status}`,
      body?.debug,
    );
  }

  return (await response.json()) as T;
};

const formatDebugDetails = (debugDetails: ApiDebugDetails) =>
  JSON.stringify(debugDetails, null, 2);

const authStrategyLabel = (strategy: AuthStrategy) => {
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

const accessModeLabel = (mode: FunctionAccessMode) => {
  switch (mode) {
    case "enabled":
      return "Enabled";
    case "disabled":
      return "Disabled";
    case "approval_required":
      return "Case-by-case";
  }
};

const getFunctionAccessMode = (functionSpec: FunctionSpec): FunctionAccessMode =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

const matchesFunctionSearch = (
  name: string,
  functionSpec: FunctionSpec,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    name,
    functionSpec.description,
    functionSpec.defaultScopes.join(" "),
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
};

const accessModeButtonClassName: Record<FunctionAccessMode, string> = {
  enabled:
    "border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.12)] text-[var(--color-success)] hover:bg-[color:rgba(165,231,94,0.18)]",
  approval_required:
    "border-[color:rgba(217,181,90,0.28)] bg-[color:rgba(217,181,90,0.12)] text-[var(--color-warning)] hover:bg-[color:rgba(217,181,90,0.18)]",
  disabled:
    "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--color-danger)] hover:bg-[color:rgba(231,106,94,0.18)]",
};

const accessModeSegmentClassName: Record<FunctionAccessMode, string> = {
  enabled:
    "bg-[color:rgba(165,231,94,0.16)] text-[var(--color-success)]",
  approval_required:
    "bg-[color:rgba(217,181,90,0.16)] text-[var(--color-warning)]",
  disabled:
    "bg-[color:rgba(231,106,94,0.16)] text-[var(--color-danger)]",
};

const accessModeOptions: Array<{
  value: FunctionAccessMode;
  label: string;
}> = [
  { value: "enabled", label: "Enabled" },
  { value: "approval_required", label: "Case-by-case" },
  { value: "disabled", label: "Disabled" },
];

const AccessModeSlider = ({
  functionName,
  mode,
  onChange,
}: {
  functionName: string;
  mode: FunctionAccessMode;
  onChange: (mode: FunctionAccessMode) => void;
}) => (
  <div
    className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-input)] p-1"
    role="group"
    aria-label={`Default access for ${functionName}`}
    data-access-mode={mode}
  >
    {accessModeOptions.map((option) => {
      const active = option.value === mode;
      return (
        <button
          key={option.value}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
            active
              ? accessModeSegmentClassName[option.value]
              : "text-[var(--color-text-base)] hover:bg-[var(--color-bg-active)] hover:text-white",
          )}
          aria-pressed={active}
          aria-label={`${accessModeLabel(option.value)} access for ${functionName}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const connectorOptionLabel = (connector: BuiltInConnectorOption) =>
  `${connector.name} (${connector.slug})`;

const findConnectorByQuery = (
  connectors: BuiltInConnectorOption[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  return (
    connectors.find((connector) =>
      [
        connectorOptionLabel(connector),
        connector.name,
        connector.slug,
      ].some((value) => value.toLowerCase() === normalizedQuery),
    ) ?? null
  );
};

const buildBuiltInCredentials = (
  draft: WizardDraft,
  connector: BuiltInConnectorOption | null,
) => {
  switch (connector?.authStrategy) {
    case "oauth2":
    case "none":
      return {};
    case "api_key":
      return {
        headerName:
          connector.apiKeyHeaderName?.trim() || draft.headerName.trim(),
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

const hasBuiltInCredentialInput = (
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

const buildDiscoverPayload = (
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

const buildCreatePayload = (
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
    functions: Object.fromEntries(
      Object.entries(discovery.functions).map(([name, functionSpec]) => {
        const accessMode = functionModes[name] ?? getFunctionAccessMode(functionSpec);
        return [
          name,
          {
            ...functionSpec,
            accessMode,
            enabled: accessMode !== "disabled",
          },
        ];
      }),
    ),
  };
};

const StepBadge = ({
  step,
  label,
  active,
  complete,
}: {
  step: WizardStep;
  label: string;
  active: boolean;
  complete: boolean;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3",
      active || complete
        ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
        : "border-[var(--color-border)] bg-[var(--color-surface-subtle)]",
    )}
  >
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
        complete
          ? "bg-[var(--color-accent)] text-white"
          : active
            ? "border border-[var(--color-accent)] text-[var(--color-accent)]"
            : "border border-[var(--color-border)] text-[var(--color-text-base)]",
      )}
    >
      {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
    <span className="text-sm font-medium text-white">{label}</span>
  </div>
);

export const IntegrationWizard = ({
  onCreated,
  onStatus,
}: IntegrationWizardProps) => {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [functionModes, setFunctionModes] = useState<
    Record<string, FunctionAccessMode>
  >({});
  const [selectedFunctions, setSelectedFunctions] = useState<
    Record<string, boolean>
  >({});
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({});
  const [connectorSearch, setConnectorSearch] = useState("");
  const [functionSearch, setFunctionSearch] = useState("");
  const [discoverFeedback, setDiscoverFeedback] =
    useState<DiscoverFeedback | null>(null);

  const builtInConnectorsQuery = useQuery({
    queryKey: ["built-in-connectors"],
    queryFn: () =>
      fetchJson<BuiltInConnectorOption[]>("/api/integrations/built-in-connectors"),
    enabled: draft.kind === "built_in" && step === 2,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const builtInConnectors = useMemo(
    () => filterReadyBuiltInConnectors(builtInConnectorsQuery.data ?? []),
    [builtInConnectorsQuery.data],
  );

  const selectedConnector = useMemo(
    () =>
      builtInConnectors.find((connector) => connector.slug === draft.builtInSlug) ??
      null,
    [builtInConnectors, draft.builtInSlug],
  );

  const connectionStatusesQuery = useQuery({
    queryKey: ["oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: draft.kind === "built_in" && step === 2,
    staleTime: 15_000,
  });

  const selectedConnection = useMemo(
    () =>
      connectionStatusesQuery.data?.find(
        (connection) =>
          connection.integrationKey === (draft.key.trim() || draft.builtInSlug),
      ) ?? null,
    [connectionStatusesQuery.data, draft.builtInSlug, draft.key],
  );


  useEffect(() => {
    const builtInSlug = searchParams.get("builtIn")?.trim();
    if (!builtInSlug) {
      return;
    }

    if (draft.kind == null) {
      setDraft((current) => ({
        ...current,
        kind: "built_in",
      }));
    }

    if (step === 1) {
      setStep(2);
    }
  }, [draft.kind, searchParams, step]);

  useEffect(() => {
    if (draft.kind !== "built_in") {
      return;
    }

    const builtInSlug = searchParams.get("builtIn")?.trim();
    if (!builtInSlug || draft.builtInSlug) {
      return;
    }

    const connector = builtInConnectors.find(
      (candidate) => candidate.slug === builtInSlug,
    );
    if (!connector) {
      return;
    }

    handleConnectorSelect(connector);
  }, [builtInConnectors, draft.builtInSlug, draft.kind, searchParams]);

  const discoverMutation = useMutation({
    mutationFn: async () =>
      fetchJson<DiscoveryResponse>("/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscoverPayload(draft, selectedConnector)),
      }),
    onMutate: () => {
      const providerName =
        selectedConnector?.name || draft.name.trim() || draft.key.trim();
      setDiscoverFeedback({
        tone: "info",
        message: `Discovering functions for ${providerName}… Loading the connector's available function catalog.`,
      });
      onStatus(null);
    },
    onSuccess: (result) => {
      setDiscovery(result);
      setFunctionModes(
        Object.fromEntries(
          Object.entries(result.functions).map(([name, functionSpec]) => [
            name,
            getFunctionAccessMode(functionSpec),
          ]),
        ),
      );
      setSelectedFunctions({});
      setExpandedFunctions({});
      setFunctionSearch("");
      setStep(3);
      const message = `Discovered ${Object.keys(result.functions).length} functions. Review their default access before saving.`;
      setDiscoverFeedback({
        tone: "success",
        message,
      });
      onStatus(message);
    },
    onError: (error: Error) => {
      const message = `Discover failed: ${error.message}`;
      setDiscoverFeedback({
        tone: "error",
        message,
        debugDetails:
          error instanceof ApiRequestError ? error.debugDetails : undefined,
      });
      onStatus(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildCreatePayload(
            draft,
            discovery as DiscoveryResponse,
            functionModes,
          ),
        ),
      }),
    onSuccess: async () => {
      const functionCount = discovery
        ? Object.keys(discovery.functions).length
        : 0;
      onStatus(
        `Created ${draft.name || draft.key} with ${functionCount} discovered functions.`,
      );
      await onCreated();
      setDraft(INITIAL_DRAFT);
      setDiscovery(null);
      setFunctionModes({});
      setSelectedFunctions({});
      setExpandedFunctions({});
      setConnectorSearch("");
      setFunctionSearch("");
      setDiscoverFeedback(null);
      setStep(1);
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const reviewedFunctions = useMemo(
    () =>
      Object.entries(discovery?.functions ?? {}).sort(([leftName], [rightName]) =>
        leftName.localeCompare(rightName),
      ),
    [discovery],
  );

  const filteredReviewedFunctions = useMemo(
    () =>
      reviewedFunctions.filter(([name, functionSpec]) =>
        matchesFunctionSearch(name, functionSpec, functionSearch),
      ),
    [functionSearch, reviewedFunctions],
  );

  const matchingFunctionNames = useMemo(
    () => filteredReviewedFunctions.map(([name]) => name),
    [filteredReviewedFunctions],
  );

  const selectedFunctionNames = useMemo(
    () => reviewedFunctions.map(([name]) => name).filter((name) => selectedFunctions[name]),
    [reviewedFunctions, selectedFunctions],
  );

  const selectedFunctionCount = selectedFunctionNames.length;
  const selectedMatchingCount = matchingFunctionNames.filter(
    (name) => selectedFunctions[name],
  ).length;
  const allMatchingSelected =
    matchingFunctionNames.length > 0 &&
    matchingFunctionNames.every((name) => selectedFunctions[name]);
  const hasMatchingFunctions = matchingFunctionNames.length > 0;

  const setAccessModeForFunctions = (
    names: string[],
    accessMode: FunctionAccessMode,
  ) => {
    if (names.length === 0) {
      return;
    }

    setFunctionModes((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, accessMode])),
    }));
  };

  const setSelectedStateForFunctions = (names: string[], selected: boolean) => {
    if (names.length === 0) {
      return;
    }

    setSelectedFunctions((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, selected])),
    }));
  };

  const toggleFunctionExpanded = (name: string) => {
    setExpandedFunctions((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  const builtInAuthStrategy = selectedConnector?.authStrategy ?? null;
  const requiresOAuthConnection = builtInAuthStrategy === "oauth2";
  const oauthConnectionEnabled =
    !requiresOAuthConnection || selectedConnector?.oauthConfigured !== false;

  const canDiscover =
    !!draft.kind &&
    !!draft.key.trim() &&
    !!draft.name.trim() &&
    (draft.kind === "built_in"
      ? !!draft.builtInSlug.trim() &&
        (requiresOAuthConnection
          ? oauthConnectionEnabled && !!selectedConnection
          : hasBuiltInCredentialInput(draft, selectedConnector))
      : !!draft.serverUrl.trim());

  const handleConnectorSelect = (connector: BuiltInConnectorOption) => {
    setDraft((current) => ({
      ...current,
      builtInSlug: connector.slug,
      key: connector.slug,
      name: connector.name,
      accessToken:
        current.builtInSlug === connector.slug && connector.authStrategy === "bearer"
          ? current.accessToken
          : "",
      apiKey:
        current.builtInSlug === connector.slug && connector.authStrategy === "api_key"
          ? current.apiKey
          : "",
      headerName:
        connector.apiKeyHeaderName?.trim() ||
        (current.builtInSlug === connector.slug && connector.authStrategy === "api_key"
          ? current.headerName
          : INITIAL_DRAFT.headerName),
      username:
        current.builtInSlug === connector.slug && connector.authStrategy === "basic"
          ? current.username
          : "",
      password:
        current.builtInSlug === connector.slug && connector.authStrategy === "basic"
          ? current.password
          : "",
    }));
    setConnectorSearch(connectorOptionLabel(connector));
    setDiscoverFeedback(null);
    onStatus(null);
  };

  const handleConnectorSearchChange = (value: string) => {
    setConnectorSearch(value);

    const connector = findConnectorByQuery(builtInConnectors, value);
    if (connector) {
      handleConnectorSelect(connector);
      return;
    }

    setDraft((current) => ({
      ...current,
      builtInSlug: "",
      accessToken: "",
      apiKey: "",
      headerName: INITIAL_DRAFT.headerName,
      username: "",
      password: "",
    }));
    setDiscoverFeedback(null);
    onStatus(null);
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <StepBadge
          step={1}
          label="Choose connector type"
          active={step === 1}
          complete={step > 1}
        />
        <StepBadge
          step={2}
          label="Connect and discover functions"
          active={step === 2}
          complete={step > 2}
        />
        <StepBadge
          step={3}
          label="Review access defaults"
          active={step === 3}
          complete={false}
        />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-3">
          <PlugZap className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="text-xl font-semibold text-white">
            Step-by-step integration setup
          </h2>
        </div>
        <p className="text-sm leading-7 text-[var(--color-text-base)]">
          Choose a Built-in connector hosted in this deployment or a remote MCP
          server, let the dashboard discover the available functions, then keep
          each function enabled, disable it, or mark it as case-by-case approval.
        </p>
      </div>

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              kind: "built_in" as const,
              title: "Built-in connector",
              body: "Pick from the service-level managed connectors, connect your account when OAuth is available, and let the dashboard discover the available functions.",
              icon: KeyRound,
            },
            {
              kind: "mcp" as const,
              title: "MCP server",
              body: "Connects to a remote MCP server, lists all tools, and infers auth from the credentials you provide.",
              icon: Waypoints,
            },
          ].map((option) => (
            <button
              key={option.kind}
              type="button"
              className={cn(
                "rounded-xl border p-5 text-left transition-colors",
                draft.kind === option.kind
                  ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-bg-active)]",
              )}
              onClick={() => {
                setDraft({ ...INITIAL_DRAFT, kind: option.kind });
                setDiscovery(null);
                setFunctionModes({});
                setSelectedFunctions({});
                setExpandedFunctions({});
                setConnectorSearch("");
                setFunctionSearch("");
                setDiscoverFeedback(null);
                setStep(2);
                onStatus(null);
              }}
            >
              <option.icon className="mb-4 h-6 w-6 text-[var(--color-accent)]" />
              <p className="font-semibold text-white">{option.title}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                {option.body}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {draft.kind === "built_in" ? (
              <>
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Built-in connector</span>
                  <input
                    className={inputClassName}
                    list="built-in-connector-options"
                    placeholder={
                      builtInConnectorsQuery.isPending
                        ? "Loading supported connectors..."
                        : "Choose GitHub, Notion, Slack..."
                    }
                    value={connectorSearch}
                    onChange={(event) =>
                      handleConnectorSearchChange(event.target.value)
                    }
                    disabled={builtInConnectorsQuery.isPending}
                  />
                  <datalist id="built-in-connector-options">
                    {builtInConnectors.map((connector) => (
                      <option
                        key={connector.slug}
                        value={connectorOptionLabel(connector)}
                      />
                    ))}
                  </datalist>
                  <span className="text-xs leading-6 text-[var(--color-text-base)]">
                    Use the dropdown and start typing to filter the managed
                    connectors registered for this deployment. Selecting one auto-
                    fills the key and display name below.
                  </span>
                  <span className="text-xs leading-6 text-[var(--color-text-base)]">
                    Don&apos;t see a connector you want?{" "}
                    <a
                      href="/add-connector"
                      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      Click here.
                    </a>
                  </span>
                </label>

                {builtInConnectorsQuery.isError ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
                    {(builtInConnectorsQuery.error as Error).message}
                  </div>
                ) : null}

                {selectedConnector ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm text-[var(--color-text-base)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">
                        {selectedConnector.name}
                      </p>
                      <Badge>{selectedConnector.slug}</Badge>
                      <Badge>{authStrategyLabel(selectedConnector.authStrategy)}</Badge>
                      {selectedConnection ? (
                        <Badge tone="success">Connected</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 leading-7">
                      {selectedConnector.description ||
                        "This managed connector is registered for the current deployment."}
                    </p>
                    {requiresOAuthConnection ? (
                      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {selectedConnection
                                ? selectedConnection.displayName || `${selectedConnector.name} account connected`
                                : `Connect your ${selectedConnector.name} account`}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                              {!oauthConnectionEnabled
                                ? `${selectedConnector.name} is not available on this deployment yet. Visit the add connector page to request it.`
                                : selectedConnection
                                  ? `This ${selectedConnector.name} token is stored per user in the database and will be injected automatically for agent calls.`
                                  : selectedConnector.credentialHelp}
                            </p>
                            {selectedConnection?.expiresAt ? (
                              <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                                Expires {new Date(selectedConnection.expiresAt).toLocaleString()}.
                              </p>
                            ) : null}
                          </div>
                          <Button
                            className="h-9 rounded-lg px-4 text-xs"
                            disabled={!draft.builtInSlug.trim() || !oauthConnectionEnabled}
                            onClick={() => {
                              window.location.href = `/api/oauth/${selectedConnector.slug}/start?integrationKey=${encodeURIComponent(
                                draft.key.trim() || selectedConnector.slug,
                              )}&redirectTo=${encodeURIComponent(
                                `/admin?section=integrations&showIntegrationWizard=1&builtIn=${draft.builtInSlug || selectedConnector.slug}`,
                              )}`;
                            }}
                          >
                            {!oauthConnectionEnabled
                              ? "Not available"
                              : selectedConnection
                                ? "Reconnect"
                                : "Connect"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {selectedConnector.appUrl ? (
                      <a
                        href={selectedConnector.appUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Open provider docs
                      </a>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">Integration key</span>
                    <input
                      className={inputClassName}
                      placeholder="github"
                      value={draft.key}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          key: event.target.value,
                        }))
                      }
                      disabled={!draft.builtInSlug.trim()}
                    />
                    <span className="text-xs leading-6 text-[var(--color-text-base)]">
                      Edit this if you want more than one saved connection for the
                      same managed connector.
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">Display name</span>
                    <input
                      className={inputClassName}
                      placeholder="GitHub"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={!draft.builtInSlug.trim()}
                    />
                  </label>
                </div>

                {requiresOAuthConnection ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-text-base)]">
                    {!oauthConnectionEnabled
                      ? `${selectedConnector?.name ?? "This provider"} is not available on this deployment yet. Visit /add-connector to request it.`
                      : selectedConnection
                        ? `${selectedConnector?.name} is connected. Click Discover to save this integration with your stored OAuth credentials.`
                        : `Connect ${selectedConnector?.name ?? "this provider"} before discovering functions.`}
                  </div>
                ) : builtInAuthStrategy === "api_key" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-white md:col-span-2">
                      <span className="font-medium">
                        {selectedConnector?.credentialLabel ?? "API key"}
                      </span>
                      <input
                        className={inputClassName}
                        placeholder={
                          selectedConnector?.credentialPlaceholder ?? "Paste the provider API key"
                        }
                        value={draft.apiKey}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            apiKey: event.target.value,
                          }))
                        }
                        disabled={!draft.builtInSlug.trim()}
                      />
                      <span className="text-xs leading-6 text-[var(--color-text-base)]">
                        {selectedConnector?.credentialHelp ??
                          "Provide the provider API key that this managed connector should use upstream."}
                      </span>
                    </label>
                    {selectedConnector?.apiKeyHeaderName ? (
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3 text-xs leading-6 text-[var(--color-text-base)] md:col-span-2">
                        This connector sends your API key in the <code className="text-white">{selectedConnector.apiKeyHeaderName}</code> header.
                      </div>
                    ) : (
                      <label className="grid gap-2 text-sm text-white md:col-span-2">
                        <span className="font-medium">API key header name</span>
                        <input
                          className={inputClassName}
                          placeholder="X-API-Key"
                          value={draft.headerName}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              headerName: event.target.value,
                            }))
                          }
                          disabled={!draft.builtInSlug.trim()}
                        />
                      </label>
                    )}
                  </div>
                ) : builtInAuthStrategy === "basic" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-white">
                      <span className="font-medium">Username</span>
                      <input
                        className={inputClassName}
                        placeholder="demo"
                        value={draft.username}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            username: event.target.value,
                          }))
                        }
                        disabled={!draft.builtInSlug.trim()}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-white">
                      <span className="font-medium">Password</span>
                      <input
                        type="password"
                        className={inputClassName}
                        placeholder="secret"
                        value={draft.password}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        disabled={!draft.builtInSlug.trim()}
                      />
                    </label>
                    <div className="text-xs leading-6 text-[var(--color-text-base)] md:col-span-2">
                      {selectedConnector?.credentialHelp ??
                        "Provide the provider credentials that this managed connector should use upstream."}
                    </div>
                  </div>
                ) : builtInAuthStrategy === "none" ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-text-base)]">
                    No provider credential is required for {selectedConnector?.name ?? "this connector"}. Click Discover to load the available functions.
                  </div>
                ) : (
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">
                      {selectedConnector?.credentialLabel ?? "Access token"}
                    </span>
                    <input
                      className={inputClassName}
                      placeholder={
                        selectedConnector?.credentialPlaceholder ?? "Paste the provider token"
                      }
                      value={draft.accessToken}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          accessToken: event.target.value,
                        }))
                      }
                      disabled={!draft.builtInSlug.trim()}
                    />
                    <span className="text-xs leading-6 text-[var(--color-text-base)]">
                      {selectedConnector?.credentialHelp ??
                        "Provide the provider credential that this managed connector should use upstream."}
                    </span>
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Integration key</span>
                  <input
                    className={inputClassName}
                    placeholder="figma-mcp"
                    value={draft.key}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        key: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Display name</span>
                  <input
                    className={inputClassName}
                    placeholder="Figma MCP"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Server URL</span>
                  <input
                    className={inputClassName}
                    placeholder="https://mcp.example.com"
                    value={draft.serverUrl}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        serverUrl: event.target.value,
                      }))
                    }
                  />
                  <span className="text-xs leading-6 text-[var(--color-text-base)]">
                    Example: GitHub&apos;s hosted MCP server uses{" "}
                    <code className="text-white">https://api.githubcopilot.com/mcp/</code>.
                    For local QA, a localhost MCP proxy URL also works.
                  </span>
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">Access token (optional)</span>
                    <input
                      className={inputClassName}
                      placeholder="OAuth or bearer token"
                      value={draft.accessToken}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          accessToken: event.target.value,
                        }))
                      }
                    />
                    <span className="text-xs leading-6 text-[var(--color-text-base)]">
                      Use this for bearer-token MCP servers such as GitHub&apos;s hosted MCP.
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">API key (optional)</span>
                    <input
                      className={inputClassName}
                      placeholder="Secret used with a header"
                      value={draft.apiKey}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          apiKey: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">API key header name</span>
                    <input
                      className={inputClassName}
                      placeholder="X-API-Key"
                      value={draft.headerName}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          headerName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                    <label className="grid gap-2 text-sm text-white">
                      <span className="font-medium">Username (optional)</span>
                      <input
                        className={inputClassName}
                        placeholder="demo"
                        value={draft.username}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            username: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-white">
                      <span className="font-medium">Password (optional)</span>
                      <input
                        type="password"
                        className={inputClassName}
                        placeholder="secret"
                        value={draft.password}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setDiscoverFeedback(null);
                  setStep(1);
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={!canDiscover || discoverMutation.isPending}
                onClick={() => discoverMutation.mutate()}
              >
                {discoverMutation.isPending
                  ? "Discovering…"
                  : "Discover functions"}
              </Button>
            </div>

            {discoverFeedback ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm leading-6",
                  discoverFeedback.tone === "error"
                    ? "border-red-500/40 bg-red-500/10 text-red-100"
                    : discoverFeedback.tone === "success"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                      : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-base)]",
                )}
                data-testid="discover-feedback"
              >
                <p>{discoverFeedback.message}</p>
                {discoverFeedback.debugDetails ? (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                      Admin diagnostics
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-white/85">
                      {formatDebugDetails(discoverFeedback.debugDetails)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm leading-7 text-[var(--color-text-base)]">
            <p className="font-semibold text-white">
              What happens in this step
            </p>
            {draft.kind === "built_in" ? (
              <ul className="mt-3 space-y-2">
                <li>
                  • The dashboard loads the managed connectors registered for this
                  service.
                </li>
                <li>
                  • Choosing a connector auto-fills the integration key and display
                  name, while still letting you customize them if needed.
                </li>
                <li>
                  • For OAuth connectors, each user connects their own account and
                  the token is stored server-side for that user only.
                </li>
                <li>
                  • Discover functions calls the MCP for the selected connector and
                  brings its full tool list into the review step.
                </li>
              </ul>
            ) : (
              <ul className="mt-3 space-y-2">
                <li>
                  • The dashboard connects to your MCP server and calls{" "}
                  <code className="text-white">listTools</code>.
                </li>
                <li>
                  • It infers auth from the credentials you provided, without
                  making you choose an auth type explicitly.
                </li>
                <li>
                  • For GitHub MCP, use{" "}
                  <code className="text-white">https://api.githubcopilot.com/mcp/</code>
                  {" "}plus a GitHub PAT in <span className="text-white">Access token</span>.
                </li>
                <li>
                  • Every discovered tool is prepared as an enabled function by
                  default for the review step.
                </li>
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {step === 3 && discovery ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm text-[var(--color-text-base)]">
            <Badge>{draft.kind === "built_in" ? "Built-in" : "MCP"}</Badge>
            <Badge>{discovery.provider}</Badge>
            <Badge>{authStrategyLabel(discovery.authStrategy)}</Badge>
            <span>
              {reviewedFunctions.length} functions discovered for{" "}
              {draft.name || draft.key}
            </span>
          </div>

          {reviewedFunctions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm text-[var(--color-text-base)]">
              No functions were discovered for this connector. Go back and
              confirm the selected managed connector or MCP server URL.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      Review function access defaults
                    </h3>
                    <p className="text-xs leading-6 text-[var(--color-text-base)]">
                      Search, select, and update multiple functions at once. Bulk
                      actions apply to the currently selected functions, while
                      select all and deselect only affect the current search
                      results.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
                    <Badge>{filteredReviewedFunctions.length} matching</Badge>
                    <Badge>{selectedFunctionCount} selected</Badge>
                    {functionSearch.trim() ? (
                      <Badge>{selectedMatchingCount} selected in view</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <input
                    type="search"
                    value={functionSearch}
                    onChange={(event) => setFunctionSearch(event.target.value)}
                    placeholder="Search functions"
                    aria-label="Search functions"
                    className={cn(inputClassName, "w-full lg:max-w-md")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={!hasMatchingFunctions || allMatchingSelected}
                      onClick={() =>
                        setSelectedStateForFunctions(matchingFunctionNames, true)
                      }
                    >
                      Select all matches
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={!hasMatchingFunctions || selectedMatchingCount === 0}
                      onClick={() =>
                        setSelectedStateForFunctions(matchingFunctionNames, false)
                      }
                    >
                      Deselect matches
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-9 rounded-md px-3 text-xs",
                      accessModeButtonClassName.enabled,
                    )}
                    disabled={selectedFunctionCount === 0}
                    onClick={() =>
                      setAccessModeForFunctions(selectedFunctionNames, "enabled")
                    }
                  >
                    Enable selected
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-9 rounded-md px-3 text-xs",
                      accessModeButtonClassName.approval_required,
                    )}
                    disabled={selectedFunctionCount === 0}
                    onClick={() =>
                      setAccessModeForFunctions(
                        selectedFunctionNames,
                        "approval_required",
                      )
                    }
                  >
                    Case-by-case selected
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-9 rounded-md px-3 text-xs",
                      accessModeButtonClassName.disabled,
                    )}
                    disabled={selectedFunctionCount === 0}
                    onClick={() =>
                      setAccessModeForFunctions(selectedFunctionNames, "disabled")
                    }
                  >
                    Disable selected
                  </Button>
                </div>
              </div>

              {filteredReviewedFunctions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm text-[var(--color-text-base)]">
                  No functions match this search. Try a different term.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
                  <div className="divide-y divide-[var(--color-border)]">
                    {filteredReviewedFunctions.map(([name, functionSpec]) => {
                      const accessMode =
                        functionModes[name] ?? getFunctionAccessMode(functionSpec);
                      const isExpanded = expandedFunctions[name] ?? false;
                      const isSelected = selectedFunctions[name] ?? false;

                      return (
                        <div
                          key={name}
                          className="px-4 py-4"
                          data-function-name={name}
                        >
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-accent)]"
                                  checked={isSelected}
                                  aria-label={`Select ${name}`}
                                  onChange={(event) =>
                                    setSelectedFunctions((current) => ({
                                      ...current,
                                      [name]: event.target.checked,
                                    }))
                                  }
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-white">
                                    {name}
                                  </p>
                                  <p className="mt-1 truncate text-xs leading-6 text-[var(--color-text-base)]">
                                    {functionSpec.description || "No description provided."}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                              <AccessModeSlider
                                functionName={name}
                                mode={accessMode}
                                onChange={(nextMode) =>
                                  setFunctionModes((current) => ({
                                    ...current,
                                    [name]: nextMode,
                                  }))
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 rounded-md px-3 text-xs"
                                aria-expanded={isExpanded}
                                aria-controls={`function-details-${name}`}
                                onClick={() => toggleFunctionExpanded(name)}
                              >
                                {isExpanded ? "Hide details" : "Show details"}
                                <ChevronRight
                                  className={cn(
                                    "ml-1 h-4 w-4 transition-transform",
                                    isExpanded && "rotate-90",
                                  )}
                                />
                              </Button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div
                              id={`function-details-${name}`}
                              className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4"
                            >
                              <p className="text-sm leading-7 text-[var(--color-text-base)]">
                                {functionSpec.description || "No description provided."}
                              </p>
                              <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                                Default scopes:{" "}
                                {functionSpec.defaultScopes.join(", ") || "none"}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={
                reviewedFunctions.length === 0 || createMutation.isPending
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Saving…" : "Create integration"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

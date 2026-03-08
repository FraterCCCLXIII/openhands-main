"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  KeyRound,
  PlugZap,
  Waypoints,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type {
  AuthStrategy,
  FunctionAccessMode,
  FunctionSpec,
} from "@/src/types/context-layer";

type IntegrationKind = "api" | "mcp";
type WizardStep = 1 | 2 | 3;

interface IntegrationWizardProps {
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
}

interface DiscoveryResponse {
  provider: "composio" | "mcp" | "mock";
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  functions: Record<string, FunctionSpec>;
}

interface WizardDraft {
  kind: IntegrationKind | null;
  key: string;
  name: string;
  toolkitSlug: string;
  serverUrl: string;
  connectedAccountId: string;
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
  toolkitSlug: "",
  serverUrl: "",
  connectedAccountId: "",
  accessToken: "",
  apiKey: "",
  headerName: "X-API-Key",
  username: "",
  password: "",
};

const fetchJson = async <T,>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(
      body?.detail ?? `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
};

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

const buildDiscoverPayload = (draft: WizardDraft) => {
  if (!draft.kind) {
    throw new Error("Select API or MCP first.");
  }

  if (draft.kind === "api") {
    return {
      key: draft.key.trim(),
      kind: draft.kind,
      config: {
        toolkitSlug: draft.toolkitSlug.trim() || draft.key.trim(),
      },
      credentials: {
        connectedAccountId: draft.connectedAccountId.trim(),
      },
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
    throw new Error("Select API or MCP first.");
  }

  return {
    key: draft.key.trim(),
    name: draft.name.trim() || draft.key.trim(),
    kind: draft.kind,
    provider: discovery.provider,
    authStrategy: discovery.authStrategy,
    enabled: true,
    fineGrainedPermissions: true,
    config: discovery.config,
    credentials: discovery.credentials,
    functions: Object.fromEntries(
      Object.entries(discovery.functions).map(([name, functionSpec]) => {
        const accessMode = functionModes[name] ?? "enabled";
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
      "flex items-center gap-3 rounded-2xl border px-4 py-3",
      active || complete
        ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
        : "border-[var(--color-border)] bg-black/10",
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
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [functionModes, setFunctionModes] = useState<
    Record<string, FunctionAccessMode>
  >({});

  const discoverMutation = useMutation({
    mutationFn: async () =>
      fetchJson<DiscoveryResponse>("/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscoverPayload(draft)),
      }),
    onSuccess: (result) => {
      setDiscovery(result);
      setFunctionModes(
        Object.fromEntries(
          Object.keys(result.functions).map((name) => [name, "enabled"]),
        ),
      );
      setStep(3);
      onStatus(
        `Discovered ${Object.keys(result.functions).length} functions. Review their default access before saving.`,
      );
    },
    onError: (error: Error) => {
      onStatus(error.message);
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
      setStep(1);
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const reviewedFunctions = useMemo(
    () => Object.entries(discovery?.functions ?? {}),
    [discovery],
  );

  const canDiscover =
    !!draft.kind &&
    !!draft.key.trim() &&
    !!draft.name.trim() &&
    (draft.kind === "api" ? true : !!draft.serverUrl.trim());

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
          Choose API or MCP first, let the dashboard discover the available
          functions, then keep each function enabled, disable it, or mark it as
          case-by-case approval.
        </p>
      </div>

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              kind: "api" as const,
              title: "API connector",
              body: "Uses Composio to discover a toolkit and auto-detect whether it is OAuth, API-key, bearer, basic, or no-auth.",
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
                "rounded-2xl border p-5 text-left transition-colors",
                draft.kind === option.kind
                  ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
                  : "border-[var(--color-border)] bg-black/10 hover:bg-white/5",
              )}
              onClick={() => {
                setDraft((current) => ({ ...current, kind: option.kind }));
                setStep(2);
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
            <label className="grid gap-2 text-sm text-white">
              <span className="font-medium">Integration key</span>
              <input
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                placeholder={draft.kind === "api" ? "notion" : "figma-mcp"}
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
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                placeholder={draft.kind === "api" ? "Notion" : "Figma MCP"}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            {draft.kind === "api" ? (
              <>
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Toolkit slug</span>
                  <input
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                    placeholder="Defaults to the integration key"
                    value={draft.toolkitSlug}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        toolkitSlug: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">
                    Connected account ID (optional)
                  </span>
                  <input
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                    placeholder="acct_..."
                    value={draft.connectedAccountId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        connectedAccountId: event.target.value,
                      }))
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Server URL</span>
                  <input
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                    placeholder="https://mcp.example.com"
                    value={draft.serverUrl}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        serverUrl: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">Access token (optional)</span>
                    <input
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                      placeholder="OAuth or bearer token"
                      value={draft.accessToken}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          accessToken: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-white">
                    <span className="font-medium">API key (optional)</span>
                    <input
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
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
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
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
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
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
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
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
                onClick={() => setStep(1)}
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
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-black/10 p-5 text-sm leading-7 text-[var(--color-text-base)]">
            <p className="font-semibold text-white">
              What happens in this step
            </p>
            {draft.kind === "api" ? (
              <ul className="mt-3 space-y-2">
                <li>
                  • The dashboard queries the Composio toolkit that matches your
                  integration key or toolkit slug.
                </li>
                <li>
                  • It auto-detects the auth scheme from toolkit metadata.
                </li>
                <li>
                  • It pulls the available API functions so you can review them
                  before saving.
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
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-black/10 p-4 text-sm text-[var(--color-text-base)]">
            <Badge>{draft.kind === "api" ? "API" : "MCP"}</Badge>
            <Badge>{discovery.provider}</Badge>
            <Badge>{authStrategyLabel(discovery.authStrategy)}</Badge>
            <span>
              {reviewedFunctions.length} functions discovered for{" "}
              {draft.name || draft.key}
            </span>
          </div>

          {reviewedFunctions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-5 text-sm text-[var(--color-text-base)]">
              No functions were discovered for this connector. Go back and
              confirm the toolkit slug or MCP server URL.
            </div>
          ) : (
            <div className="grid gap-3">
              {reviewedFunctions.map(([name, functionSpec]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-[var(--color-border)] bg-black/10 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{name}</p>
                        <Badge>
                          {accessModeLabel(functionModes[name] ?? "enabled")}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                        {functionSpec.description || "No description provided."}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-text-base)]">
                        Default scopes:{" "}
                        {functionSpec.defaultScopes.join(", ") || "none"}
                      </p>
                    </div>
                    <label className="grid gap-2 text-sm text-white md:w-56">
                      <span className="font-medium">Default access</span>
                      <select
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                        value={functionModes[name] ?? "enabled"}
                        onChange={(event) =>
                          setFunctionModes((current) => ({
                            ...current,
                            [name]: event.target.value as FunctionAccessMode,
                          }))
                        }
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                        <option value="approval_required">Case-by-case</option>
                      </select>
                    </label>
                  </div>
                </div>
              ))}
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

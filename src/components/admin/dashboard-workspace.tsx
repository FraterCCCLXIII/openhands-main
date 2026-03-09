"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  PlugZap,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Waypoints,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { IntegrationWizard } from "@/src/components/admin/integration-wizard";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import { cn } from "@/src/lib/utils";
import { useAdminStore } from "@/src/stores/admin-store";
import type {
  AccessRequest,
  AuthStrategy,
  IntegrationSpec,
  NotificationRecord,
} from "@/src/types/context-layer";

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseJson = (value: string) => {
  if (!value.trim()) {
    return {} as Record<string, unknown>;
  }

  return JSON.parse(value) as Record<string, unknown>;
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

type AdminTab = "overview" | "integrations" | "agents" | "approvals";

interface IntegrationFormState {
  key: string;
  name: string;
  kind: string;
  provider: string;
  authStrategy: AuthStrategy;
  configJson: string;
  credentialsJson: string;
}

interface FunctionFormState {
  integrationKey: string;
  name: string;
  description: string;
  defaultScopes: string;
  executionMode: string;
  configJson: string;
  mockResponseJson: string;
}

interface PolicyFormState {
  agentClass: string;
  integrationKey: string;
  functionNames: string;
  scopes: string;
}

interface AdminDashboardProps {
  initialIntegrations: IntegrationSpec[];
  initialAccessRequests: AccessRequest[];
  initialNotifications: NotificationRecord[];
  currentUser: { name?: string | null; email?: string | null };
  contextApiBaseUrl: string;
  contextApiKey: string;
}

const ADMIN_TABS: Array<{
  id: AdminTab;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Understand how the workspace fits together.",
    icon: CheckCircle2,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Add MCP or API connectors and register functions.",
    icon: PlugZap,
  },
  {
    id: "agents",
    label: "Agent setup",
    description: "Define which agent classes can call which tools.",
    icon: Bot,
  },
  {
    id: "approvals",
    label: "Approvals",
    description: "Handle pending access requests and notifications.",
    icon: Bell,
  },
];

const INTEGRATION_PRESETS: Array<{
  label: string;
  description: string;
  values: Partial<IntegrationFormState>;
}> = [
  {
    label: "OAuth API",
    description: "Composio-managed OAuth for SaaS APIs such as Notion.",
    values: {
      kind: "api",
      provider: "composio",
      authStrategy: "oauth2",
      configJson: '{"defaultToolSlug":"NOTION_LIST_USERS"}',
      credentialsJson: '{"connectedAccountId":"acct_..."}',
    },
  },
  {
    label: "OAuth MCP",
    description: "Remote MCP server that expects a bearer token from OAuth.",
    values: {
      kind: "mcp",
      provider: "mcp",
      authStrategy: "oauth2",
      configJson: '{"serverUrl":"https://mcp.example.com"}',
      credentialsJson: '{"accessToken":"oauth_access_token"}',
    },
  },
  {
    label: "API-key MCP",
    description:
      "Remote MCP server that authenticates with a custom API-key header.",
    values: {
      kind: "mcp",
      provider: "mcp",
      authStrategy: "api_key",
      configJson: '{"serverUrl":"https://mcp.example.com"}',
      credentialsJson: '{"headerName":"X-API-Key","secret":"..."}',
    },
  },
];

const getIntegrationGuide = ({
  kind,
  provider,
  authStrategy,
}: Pick<IntegrationFormState, "kind" | "provider" | "authStrategy">) => {
  if (provider === "mock") {
    return {
      title: "Mock mode is best for demos and UI validation.",
      body: "Use mock integrations to validate policies and approvals without contacting a real provider.",
      configPlaceholder: '{"preview":"simulated integration"}',
      credentialsPlaceholder: "{}",
    };
  }

  if (provider === "composio" && authStrategy === "oauth2") {
    return {
      title: "OAuth API setup",
      body: "Use this for SaaS APIs managed through Composio. Complete the provider OAuth flow externally, then paste the connectedAccountId here so the context layer can execute the tool on behalf of the agent.",
      configPlaceholder: '{"defaultToolSlug":"NOTION_LIST_USERS"}',
      credentialsPlaceholder: '{"connectedAccountId":"acct_..."}',
    };
  }

  if (kind === "mcp" && authStrategy === "oauth2") {
    return {
      title: "OAuth MCP setup",
      body: "Use this for remote MCP servers that expect a bearer token. Put the MCP server URL in configJson and the OAuth access token in credentialsJson. This fits flows like a hosted Notion or Figma MCP once you have completed OAuth outside the dashboard.",
      configPlaceholder: '{"serverUrl":"https://mcp.example.com"}',
      credentialsPlaceholder: '{"accessToken":"oauth_access_token"}',
    };
  }

  if (kind === "mcp" && authStrategy === "api_key") {
    return {
      title: "API-key MCP setup",
      body: "Use this for MCP servers that expect a secret header. The MCP adapter will send headerName + secret with each request.",
      configPlaceholder: '{"serverUrl":"https://mcp.example.com"}',
      credentialsPlaceholder: '{"headerName":"X-API-Key","secret":"..."}',
    };
  }

  if (authStrategy === "basic") {
    return {
      title: "Basic auth setup",
      body: "Provide the target URL in configJson and username/password in credentialsJson.",
      configPlaceholder: '{"serverUrl":"https://api.example.com"}',
      credentialsPlaceholder: '{"username":"demo","password":"secret"}',
    };
  }

  if (authStrategy === "bearer") {
    return {
      title: "Bearer token setup",
      body: "Provide the target URL in configJson and the bearer access token in credentialsJson.",
      configPlaceholder:
        kind === "mcp"
          ? '{"serverUrl":"https://mcp.example.com"}'
          : '{"defaultToolSlug":"EXAMPLE_TOOL"}',
      credentialsPlaceholder: '{"accessToken":"token"}',
    };
  }

  if (authStrategy === "none") {
    return {
      title: "No-auth setup",
      body: "Use this only for public endpoints or local mock/test MCP servers.",
      configPlaceholder:
        kind === "mcp"
          ? '{"serverUrl":"https://mcp.example.com"}'
          : '{"defaultToolSlug":"EXAMPLE_TOOL"}',
      credentialsPlaceholder: "{}",
    };
  }

  return {
    title: "Choose a preset or fill in the fields manually.",
    body: "The selected provider and auth strategy determine which keys belong in configJson and credentialsJson. The examples above match the adapter behavior implemented by this project.",
    configPlaceholder:
      kind === "mcp"
        ? '{"serverUrl":"https://mcp.example.com"}'
        : '{"defaultToolSlug":"EXAMPLE_TOOL"}',
    credentialsPlaceholder: "{}",
  };
};

const FormField = ({
  label,
  hint,
  tooltip,
  children,
}: {
  label: string;
  hint?: string;
  tooltip?: string;
  children: React.ReactNode;
}) => (
  <label className="grid gap-2 text-sm text-white">
    <span className="flex items-center gap-2 font-medium">
      {label}
      {tooltip ? (
        <span title={tooltip} className="text-[var(--color-text-base)]">
          <HelpCircle className="h-4 w-4" />
        </span>
      ) : null}
    </span>
    {children}
    {hint ? (
      <span className="text-xs leading-6 text-[var(--color-text-base)]">
        {hint}
      </span>
    ) : null}
  </label>
);

const SectionHeading = ({
  icon: Icon,
  title,
  description,
  tooltip,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tooltip?: string;
}) => (
  <div className="mb-4 flex items-start gap-3">
    <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-2">
      <Icon className="h-5 w-5 text-[var(--color-accent)]" />
    </div>
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {tooltip ? (
          <span title={tooltip} className="text-[var(--color-text-base)]">
            <HelpCircle className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm leading-7 text-[var(--color-text-base)]">
          {description}
        </p>
      ) : null}
    </div>
  </div>
);

const TabButton = ({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col gap-2 rounded-2xl border px-4 py-4 text-left transition-colors",
      active
        ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
        : "border-[var(--color-border)] bg-[var(--color-bg-workspace)] hover:bg-white/5",
    )}
  >
    <div className="flex items-center gap-3">
      <Icon
        className={cn(
          "h-5 w-5",
          active
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-text-base)]",
        )}
      />
      <span className="font-semibold text-white">{label}</span>
    </div>
    <span className="text-sm leading-6 text-[var(--color-text-base)]">
      {description}
    </span>
  </button>
);

export const DashboardWorkspace = ({
  initialIntegrations,
  initialAccessRequests,
  initialNotifications,
  currentUser,
  contextApiBaseUrl,
  contextApiKey,
}: AdminDashboardProps) => {
  const queryClient = useQueryClient();
  const { providerFilter, requestFilter, setProviderFilter, setRequestFilter } =
    useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [integrationForm, setIntegrationForm] = useState<IntegrationFormState>({
    key: "",
    name: "",
    kind: "api",
    provider: "composio",
    authStrategy: "oauth2",
    configJson: '{"defaultToolSlug":""}',
    credentialsJson: "{}",
  });
  const [functionForm, setFunctionForm] = useState<FunctionFormState>({
    integrationKey: initialIntegrations[0]?.key ?? "",
    name: "",
    description: "",
    defaultScopes: "",
    executionMode: "provider",
    configJson: "{}",
    mockResponseJson: "{}",
  });
  const [policyForm, setPolicyForm] = useState<PolicyFormState>({
    agentClass: "researcher",
    integrationKey: initialIntegrations[0]?.key ?? "",
    functionNames: "",
    scopes: "",
  });

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
  });

  const accessRequestsQuery = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<AccessRequest[]>("/api/access-requests"),
    initialData: initialAccessRequests,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchJson<NotificationRecord[]>("/api/notifications"),
    initialData: initialNotifications,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: string;
      body?: unknown;
    }) =>
      fetchJson(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: async () => {
      setStatusMessage("Saved.");
      await invalidateAll();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const integrations = integrationsQuery.data ?? [];
  const accessRequests = accessRequestsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  useEffect(() => {
    if (!functionForm.integrationKey && integrations[0]) {
      setFunctionForm((current) => ({
        ...current,
        integrationKey: integrations[0]?.key ?? "",
      }));
    }

    if (!policyForm.integrationKey && integrations[0]) {
      setPolicyForm((current) => ({
        ...current,
        integrationKey: integrations[0]?.key ?? "",
      }));
    }
  }, [functionForm.integrationKey, integrations, policyForm.integrationKey]);

  const filteredIntegrations = useMemo(() => {
    if (providerFilter === "all") {
      return integrations;
    }

    return integrations.filter(
      (integration) => integration.provider === providerFilter,
    );
  }, [integrations, providerFilter]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") {
      return accessRequests;
    }

    return accessRequests.filter((item) => item.status === requestFilter);
  }, [accessRequests, requestFilter]);

  const pendingRequestCount = accessRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const enabledIntegrationCount = integrations.filter(
    (integration) => integration.enabled,
  ).length;
  const contextApiReady = contextApiKey.trim().length > 0;
  const agentConnectionGuide = useMemo(
    () =>
      buildAgentConnectionGuide({
        baseUrl: contextApiBaseUrl,
        apiKey:
          contextApiKey.trim() || "<open /admin to provision a personal context-layer API key>",
        integrations,
      }),
    [contextApiBaseUrl, contextApiKey, integrations],
  );
  const guide = getIntegrationGuide(integrationForm);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-workspace)] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-base)]">
            <Badge>{enabledIntegrationCount} enabled integrations</Badge>
            <Badge>{pendingRequestCount} pending approvals</Badge>
            <Badge>Unified agent endpoint</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Agent Context Layer dashboard
            </h1>
            <p className="text-sm leading-7 text-[var(--color-text-base)]">
              Signed in as {currentUser.email ?? currentUser.name ?? "admin"}.
              The workspace is split into tabs so connector setup, agent
              onboarding, and approvals are easier to follow.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          Sign out
        </Button>
      </header>

      {statusMessage ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-active)]">
          {statusMessage}
        </div>
      ) : null}

      {contextApiReady ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          This dashboard automatically provisions a personal context-layer API key for{" "}
          <code className="text-white">
            {currentUser.email ?? currentUser.name ?? "the current user"}
          </code>{" "}
          and stores it server-side. Agents can authenticate with{" "}
          <code className="text-white">Authorization: Bearer {contextApiKey}</code>. Shared{" "}
          <code className="text-white">CONTEXT_LAYER_API_KEY</code> or{" "}
          <code className="text-white">CONTEXT_LAYER_API_KEYS</code> remain optional for service-wide automation.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          The personal context-layer API key for this user is not available yet. Reload the dashboard to provision it.
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            description={tab.description}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </section>

      {activeTab === "overview" ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="p-6">
            <SectionHeading
              icon={Waypoints}
              title="Start here"
              description="The dashboard now separates integration setup, agent setup, and approvals into dedicated tabs. Follow these steps in order when onboarding a new tool."
              tooltip="This replaces the previous single noisy screen with a clearer setup flow."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Add an integration",
                  body: "Choose whether the tool is an API or MCP, then pick the auth pattern. Use the preset buttons in the Integrations tab for OAuth API, OAuth MCP, or API-key MCP setups.",
                  action: "Open integrations",
                  onClick: () => setActiveTab("integrations"),
                },
                {
                  title: "2. Connect an agent",
                  body: "Give the agent a stable agentClass, then save a policy that allows the integration functions and scopes that class may request.",
                  action: "Open agent setup",
                  onClick: () => setActiveTab("agents"),
                },
                {
                  title: "3. Review approvals",
                  body: "If a requested scope is not yet allowed, the agent creates an access request. Approve it here to grant temporary access and let the agent continue.",
                  action: "Open approvals",
                  onClick: () => setActiveTab("approvals"),
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5"
                >
                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                    {step.body}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4 gap-2 px-0"
                    onClick={step.onClick}
                  >
                    {step.action}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
              <SectionHeading
                icon={Bot}
                title="How an agent calls the context layer"
                description="Every agent uses the same route pattern. The integration key and function name come from the Integrations tab."
                tooltip="This is the clearest end-to-end path for agent developers using the context layer."
              />
              <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Endpoint</p>
                  <code className="mt-2 block break-all text-xs text-[var(--color-text-base)]">
                    {agentConnectionGuide.endpoint}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Authentication</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                    Send the context-layer API key in{" "}
                    <code className="text-white">Authorization: Bearer ...</code>
                    {" "}or <code className="text-white">X-API-Key</code>. The
                    underlying MCP token stays inside the integration settings and
                    is never passed to the agent.
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-white">
                    Example request body
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-base)]">
                    {agentConnectionGuide.requestBody}
                  </pre>
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-white">
                    Copyable cURL example
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-base)]">
                    {agentConnectionGuide.curlExample}
                  </pre>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-text-base)]">
                <li>
                  • Use a stable <code className="text-white">agentId</code> so
                  approvals can be traced.
                </li>
                <li>
                  • Use <code className="text-white">agentClass</code> values
                  like <code className="text-white">researcher</code> or{" "}
                  <code className="text-white">designer</code> that match your
                  saved policies.
                </li>
                <li>
                  • The current sample targets{" "}
                  <code className="text-white">
                    {agentConnectionGuide.integrationKey}/
                    {agentConnectionGuide.functionName}
                  </code>
                  . Create an integration first if you still see placeholders.
                </li>
                <li>
                  • If access is denied, check the Approvals tab for a pending
                  request or widen the policy in Agent setup.
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <SectionHeading
                icon={PlugZap}
                title="Integration auth cheat sheet"
                description="These examples mirror the adapter behavior implemented in this repository."
              />
              <div className="space-y-3 text-sm leading-7 text-[var(--color-text-base)]">
                <div className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                  <p className="font-medium text-white">OAuth API</p>
                  <p>
                    Use provider <code className="text-white">Composio</code>{" "}
                    and auth <code className="text-white">oauth2</code>. Store a{" "}
                    <code className="text-white">connectedAccountId</code> in
                    credentials after completing OAuth.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                  <p className="font-medium text-white">OAuth MCP</p>
                  <p>
                    Use kind <code className="text-white">MCP</code>, provider{" "}
                    <code className="text-white">MCP SDK</code>, auth{" "}
                    <code className="text-white">oauth2</code>, a{" "}
                    <code className="text-white">serverUrl</code> in config, and
                    an <code className="text-white">accessToken</code> in
                    credentials.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                  <p className="font-medium text-white">GitHub MCP quick start</p>
                  <p>
                    Use <code className="text-white">key=github</code>,{" "}
                    <code className="text-white">serverUrl=https://api.githubcopilot.com/mcp/</code>,
                    and paste a GitHub PAT into the{" "}
                    <code className="text-white">accessToken</code> field.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                  <p className="font-medium text-white">API-key MCP</p>
                  <p>
                    Use kind <code className="text-white">MCP</code>, auth{" "}
                    <code className="text-white">api_key</code>, then provide{" "}
                    <code className="text-white">headerName</code> and{" "}
                    <code className="text-white">secret</code> in credentials.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      ) : null}

      {activeTab === "integrations" ? (
        <section className="space-y-6">
          <IntegrationWizard
            onCreated={invalidateAll}
            onStatus={setStatusMessage}
          />

          <Card className="p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Integrations & functions
                </h2>
                <p className="text-sm text-[var(--color-text-base)]">
                  Review the current connector catalog, filter by provider, and
                  confirm which functions are default-enabled, disabled, or
                  case-by-case.
                </p>
              </div>
              <select
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                value={providerFilter}
                onChange={(event) => setProviderFilter(event.target.value)}
                title="Filter the integration list by adapter/provider."
              >
                <option value="all">All providers</option>
                {[
                  ...new Set(
                    integrations.map((integration) => integration.provider),
                  ),
                ].map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4">
              {filteredIntegrations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-6 text-sm text-[var(--color-text-base)]">
                  No integrations yet. Start with the setup form above.
                </div>
              ) : (
                filteredIntegrations.map((integration) => (
                  <div
                    key={integration.key}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {integration.name}
                          </h3>
                          <Badge>{integration.provider}</Badge>
                          <Badge>{integration.kind}</Badge>
                          <Badge
                            tone={integration.enabled ? "success" : "danger"}
                          >
                            {integration.enabled ? "enabled" : "disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--color-text-base)]">
                          {integration.key} · auth: {integration.authStrategy}
                        </p>
                      </div>
                      <Button
                        variant={integration.enabled ? "secondary" : "primary"}
                        className="gap-2"
                        onClick={() =>
                          actionMutation.mutate({
                            url: `/api/integrations/${integration.key}/toggle`,
                            method: "POST",
                            body: { enabled: !integration.enabled },
                          })
                        }
                        title="Temporarily enable or disable the full integration."
                      >
                        {integration.enabled ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {integration.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {Object.values(integration.functions).length === 0 ? (
                        <p className="text-sm text-[var(--color-text-base)]">
                          No functions registered yet.
                        </p>
                      ) : (
                        Object.values(integration.functions).map(
                          (functionSpec) => (
                            <div
                              key={functionSpec.name}
                              className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-white">
                                    {functionSpec.name}
                                  </p>
                                  <Badge
                                    tone={
                                      functionSpec.enabled
                                        ? "success"
                                        : "danger"
                                    }
                                  >
                                    {functionSpec.enabled
                                      ? "enabled"
                                      : "disabled"}
                                  </Badge>
                                  <Badge>
                                    {functionSpec.accessMode ===
                                    "approval_required"
                                      ? "case-by-case"
                                      : functionSpec.enabled
                                        ? "default-enabled"
                                        : "disabled"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-[var(--color-text-base)]">
                                  {functionSpec.description ||
                                    "No description provided."}
                                </p>
                                <p className="mt-2 text-xs text-[var(--color-text-base)]">
                                  Scopes:{" "}
                                  {functionSpec.defaultScopes.join(", ") ||
                                    "none"}
                                </p>
                              </div>
                              <Button
                                variant={
                                  functionSpec.enabled ? "secondary" : "primary"
                                }
                                onClick={() =>
                                  actionMutation.mutate({
                                    url: `/api/integrations/${integration.key}/functions/${functionSpec.name}/toggle`,
                                    method: "POST",
                                    body: { enabled: !functionSpec.enabled },
                                  })
                                }
                                title="Enable or disable just this callable function."
                              >
                                {functionSpec.enabled
                                  ? "Disable function"
                                  : "Enable function"}
                              </Button>
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      ) : null}

      {activeTab === "agents" ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <Card className="p-6">
            <SectionHeading
              icon={Bot}
              title="Connect an agent to the context layer"
              description="This tab makes the agent onboarding path explicit: define the class, save the policy, then call the unified endpoint from your agent runtime."
              tooltip="This addresses the earlier confusion around how agents are connected."
            />
            <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
              <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                <p className="font-semibold text-white">
                  Step 1: pick an agentClass
                </p>
                <p>
                  Use a human-readable class such as{" "}
                  <code className="text-white">researcher</code>,{" "}
                  <code className="text-white">designer</code>, or{" "}
                  <code className="text-white">support-bot</code>. Policies are
                  attached to the class, not to a single run.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                <p className="font-semibold text-white">
                  Step 2: allow integrations and scopes
                </p>
                <p>
                  Save one or more policy rules that list the integration key,
                  allowed function names, and scopes the class may request. If
                  the agent needs more than this policy allows, the request will
                  appear in the Approvals tab.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                <p className="font-semibold text-white">
                  Step 3: call the unified endpoint with the context-layer API key
                </p>
                <p>
                  From the agent, send{" "}
                  <code className="text-white">agentId</code>,{" "}
                  <code className="text-white">agentClass</code>, optional{" "}
                  <code className="text-white">scopes</code>, and the tool
                  payload to <code className="text-white">{agentConnectionGuide.endpoint}</code>. Authenticate with{" "}
                  <code className="text-white">Authorization: Bearer ...</code>
                  {" "}or <code className="text-white">X-API-Key</code>; do not
                  pass the MCP token directly to the agent.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4">
              <div>
                <p className="mb-3 text-sm font-medium text-white">
                  Copyable fetch example
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-base)]">
                  {agentConnectionGuide.fetchExample}
                </pre>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-white">
                  Request body reminder
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-base)]">
                  {agentConnectionGuide.requestBody}
                </pre>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading
              icon={ShieldCheck}
              title="Agent-class policy"
              description="Create the allowlist an agent class uses when it invokes the context layer."
              tooltip="If no policy matches, the request is denied or routed to approval."
            />
            {integrations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-5 text-sm text-[var(--color-text-base)]">
                Create an integration first in the Integrations tab, then come
                back here to map it to an agent class.
              </div>
            ) : null}
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                actionMutation.mutate({
                  url: `/api/agent-classes/${policyForm.agentClass}`,
                  method: "PUT",
                  body: {
                    rules: [
                      {
                        integrationKey: policyForm.integrationKey,
                        functionNames: parseCsv(policyForm.functionNames),
                        scopes: parseCsv(policyForm.scopes),
                        enabled: true,
                      },
                    ],
                  },
                });
              }}
            >
              <FormField
                label="Agent class"
                hint="Use the same string your agent passes in the request body."
                tooltip="Example: researcher"
              >
                <input
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                  placeholder="researcher"
                  value={policyForm.agentClass}
                  onChange={(event) =>
                    setPolicyForm({
                      ...policyForm,
                      agentClass: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Integration"
                hint="The connector this class may use."
              >
                <select
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                  value={policyForm.integrationKey}
                  onChange={(event) =>
                    setPolicyForm({
                      ...policyForm,
                      integrationKey: event.target.value,
                    })
                  }
                >
                  <option value="">Select integration</option>
                  {integrations.map((integration) => (
                    <option key={integration.key} value={integration.key}>
                      {integration.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Allowed functions"
                hint="Comma-separated function names. Leave empty only if you intend to revise this rule later."
                tooltip="Example: list_pages, search_files"
              >
                <input
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                  placeholder="list_pages"
                  value={policyForm.functionNames}
                  onChange={(event) =>
                    setPolicyForm({
                      ...policyForm,
                      functionNames: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Allowed scopes"
                hint="Comma-separated scopes the class may request by default."
                tooltip="Example: pages.read, files.read"
              >
                <input
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
                  placeholder="pages.read"
                  value={policyForm.scopes}
                  onChange={(event) =>
                    setPolicyForm({ ...policyForm, scopes: event.target.value })
                  }
                />
              </FormField>

              <Button type="submit">Save policy</Button>
            </form>
          </Card>
        </section>
      ) : null}

      {activeTab === "approvals" ? (
        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="p-5">
            <SectionHeading
              icon={KeyRound}
              title="Access requests"
              description="Approve temporary access when an agent needs scopes outside its current policy."
            />
            <select
              className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white"
              value={requestFilter}
              onChange={(event) =>
                setRequestFilter(
                  event.target.value as
                    | "all"
                    | "pending"
                    | "approved"
                    | "rejected",
                )
              }
              title="Filter by request state."
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-[var(--color-text-base)]">
                  No access requests yet.
                </p>
              ) : (
                filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">
                        {request.integrationKey}.{request.functionName}
                      </p>
                      <Badge
                        tone={
                          request.status === "approved"
                            ? "success"
                            : request.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-text-base)]">
                      {request.agentId} ({request.agentClass}) requested{" "}
                      {request.scopes.join(", ") || "default scopes"} for{" "}
                      {request.requestedMinutes} minutes.
                    </p>
                    {request.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() =>
                            actionMutation.mutate({
                              url: `/api/access-requests/${request.id}/approve`,
                              method: "POST",
                              body: {
                                approver: currentUser.email ?? "admin",
                                durationMinutes: request.requestedMinutes,
                              },
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            actionMutation.mutate({
                              url: `/api/access-requests/${request.id}/reject`,
                              method: "POST",
                              body: { approver: currentUser.email ?? "admin" },
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading
              icon={Bell}
              title="Recent notifications"
              description="Messages sent when agents request access or approval outcomes change."
            />
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-[var(--color-text-base)]">
                  Notifications will appear here when agents request access.
                </p>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-xl border border-[var(--color-border)] bg-black/15 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{notification.channel}</Badge>
                      <span className="text-sm font-medium text-white">
                        {notification.recipient}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white">
                      {notification.subject}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                      {notification.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  KeyRound,
  PlugZap,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  User,
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
import type {
  AccessRequest,
  IntegrationSpec,
  NotificationRecord,
} from "@/src/types/context-layer";

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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

type AdminSection = "home" | "profile" | "integrations" | "apiKeys";

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

const ADMIN_SECTIONS: Array<{
  id: AdminSection;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "home",
    label: "Home",
    description: "Summary metrics and setup directions.",
    icon: Home,
  },
  {
    id: "profile",
    label: "User Profile",
    description: "See the current dashboard user details.",
    icon: User,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Review connectors and add a new one.",
    icon: PlugZap,
  },
  {
    id: "apiKeys",
    label: "Agent API Keys",
    description: "Reveal or copy the personal agent key.",
    icon: KeyRound,
  },
];

const maskApiKey = (apiKey: string, revealed: boolean) => {
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

const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
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

const SidebarNavItem = ({
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
      "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
      active
        ? "border-[var(--color-accent)] bg-[var(--color-bg-active)]"
        : "border-[var(--color-border)] bg-[var(--color-bg-workspace)] hover:bg-white/5",
    )}
  >
    <div className="rounded-xl bg-black/20 p-2">
      <Icon
        className={cn(
          "h-5 w-5",
          active ? "text-[var(--color-accent)]" : "text-[var(--color-text-base)]",
        )}
      />
    </div>
    <div className="space-y-1">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-sm leading-6 text-[var(--color-text-base)]">
        {description}
      </p>
    </div>
  </button>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text-base)]">{label}</p>
        <p className="text-3xl font-semibold text-white">{value}</p>
        <p className="text-sm leading-6 text-[var(--color-text-base)]">
          {description}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-3">
        <Icon className="h-5 w-5 text-[var(--color-accent)]" />
      </div>
    </div>
  </Card>
);

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-4">
    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-base)]">
      {label}
    </p>
    <p className="mt-2 break-all text-sm font-medium text-white">{value}</p>
  </div>
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
  const [activeSection, setActiveSection] = useState<AdminSection>("home");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(
    initialIntegrations.length === 0,
  );
  const [revealApiKey, setRevealApiKey] = useState(false);
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
    if (!policyForm.integrationKey && integrations[0]) {
      setPolicyForm((current) => ({
        ...current,
        integrationKey: integrations[0]?.key ?? "",
      }));
    }
  }, [integrations, policyForm.integrationKey]);

  const enabledIntegrationCount = integrations.filter(
    (integration) => integration.enabled,
  ).length;
  const discoveredFunctionCount = integrations.reduce(
    (count, integration) => count + Object.keys(integration.functions).length,
    0,
  );
  const pendingAccessRequests = accessRequests.filter(
    (request) => request.status === "pending",
  );
  const contextApiReady = contextApiKey.trim().length > 0;
  const maskedApiKey = maskApiKey(contextApiKey, revealApiKey);
  const userName = currentUser.name?.trim() || "Admin User";
  const userEmail = currentUser.email?.trim() || "Not provided";
  const authMode =
    currentUser.email === "dev@localhost"
      ? "Local development session"
      : "Authenticated dashboard session";

  const agentConnectionGuide = useMemo(
    () =>
      buildAgentConnectionGuide({
        baseUrl: contextApiBaseUrl,
        apiKey:
          contextApiKey.trim() ||
          "<open /admin to provision a personal context-layer API key>",
        integrations,
      }),
    [contextApiBaseUrl, contextApiKey, integrations],
  );

  const handleCopyApiKey = async () => {
    if (!contextApiReady) {
      setStatusMessage("The personal API key is not available yet.");
      return;
    }

    try {
      await copyTextToClipboard(contextApiKey);
      setStatusMessage("API key copied to clipboard.");
    } catch {
      setStatusMessage("Unable to copy the API key from this browser session.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside>
        <Card className="p-5 xl:sticky xl:top-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-base)]">
                <Badge>{enabledIntegrationCount} enabled</Badge>
                <Badge>{pendingAccessRequests.length} pending approvals</Badge>
                <Badge>Unified endpoint</Badge>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Agent Context Layer dashboard
                </h1>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                  Configure integrations, review your personal agent key, and onboard
                  agents from a single workspace.
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              {ADMIN_SECTIONS.map((section) => (
                <SidebarNavItem
                  key={section.id}
                  icon={section.icon}
                  label={section.label}
                  description={section.description}
                  active={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                />
              ))}
            </nav>

            <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-4">
              <p className="text-sm font-semibold text-white">Signed in as</p>
              <p className="mt-2 break-all text-sm text-[var(--color-text-active)]">
                {currentUser.email ?? currentUser.name ?? "admin"}
              </p>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signOut({ redirectTo: "/" })}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </aside>

      <div className="space-y-6">
        {statusMessage ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text-active)]">
            {statusMessage}
          </div>
        ) : null}

        {contextApiReady ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            This dashboard provisions and stores a personal context-layer API key
            for the current user. Agents should authenticate with{" "}
            <code className="text-white">Authorization: Bearer ...</code>, while
            provider credentials stay inside the integration settings.
          </div>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            The personal context-layer API key for this user is not available yet.
            Reload the dashboard to provision it.
          </div>
        )}

        {activeSection === "home" ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={PlugZap}
                label="Integrations"
                value={String(integrations.length)}
                description="Connected API and MCP providers visible to the dashboard."
              />
              <StatCard
                icon={CheckCircle2}
                label="Enabled integrations"
                value={String(enabledIntegrationCount)}
                description="Integrations currently available for agent calls."
              />
              <StatCard
                icon={KeyRound}
                label="Functions discovered"
                value={String(discoveredFunctionCount)}
                description="Callable functions registered across all integrations."
              />
              <StatCard
                icon={Bell}
                label="Pending approvals"
                value={String(pendingAccessRequests.length)}
                description="Agent access requests still waiting for a decision."
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="p-6">
                <SectionHeading
                  icon={Waypoints}
                  title="Getting started"
                  description="Use these steps to connect a tool and hand the right details to your agent."
                  tooltip="This keeps the main onboarding path visible from the Home screen."
                />
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "1. Review your profile",
                      body: "Confirm the signed-in user details the dashboard will associate with your personal API key.",
                      action: "Open user profile",
                      onClick: () => setActiveSection("profile" as const),
                    },
                    {
                      title: "2. Add an integration",
                      body: "Create an API or MCP connector, then review the functions and toggle availability as needed.",
                      action: "Open integrations",
                      onClick: () => setActiveSection("integrations" as const),
                    },
                    {
                      title: "3. Copy your key",
                      body: "Reveal or copy the personal agent API key, then give your agent the unified endpoint and bearer token.",
                      action: "Open API keys",
                      onClick: () => setActiveSection("apiKeys" as const),
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
                <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4">
                  <p className="text-sm font-medium text-white">Unified endpoint</p>
                  <code className="mt-2 block break-all text-xs text-[var(--color-text-base)]">
                    {agentConnectionGuide.endpoint}
                  </code>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-base)]">
                    Agents call the same route pattern for every provider. The
                    integration key and function name come from the Integrations
                    page, and the personal API key is shown under Agent API Keys.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeading
                  icon={Bell}
                  title="Recent activity"
                  description="Keep an eye on approvals and the latest notifications without leaving Home."
                />
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        Pending approvals
                      </h3>
                      <Badge tone={pendingAccessRequests.length > 0 ? "warning" : "default"}>
                        {pendingAccessRequests.length}
                      </Badge>
                    </div>
                    {pendingAccessRequests.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-4 text-sm text-[var(--color-text-base)]">
                        No pending access requests.
                      </p>
                    ) : (
                      pendingAccessRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">
                              {request.integrationKey}.{request.functionName}
                            </p>
                            <Badge tone="warning">pending</Badge>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                            {request.agentId} ({request.agentClass}) requested{" "}
                            {request.scopes.join(", ") || "default scopes"} for{" "}
                            {request.requestedMinutes} minutes.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
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
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        Latest notifications
                      </h3>
                      <Badge>{notifications.length}</Badge>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-4 text-sm text-[var(--color-text-base)]">
                        Notifications will appear here when agents request access.
                      </p>
                    ) : (
                      notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-4"
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
                </div>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
              <Card className="p-6">
                <SectionHeading
                  icon={ShieldCheck}
                  title="Agent onboarding guide"
                  description="These are the details your agent runtime needs when calling the context layer."
                />
                <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                    <p className="font-semibold text-white">
                      Step 1: choose a stable agentClass
                    </p>
                    <p>
                      Use a reusable label such as <code className="text-white">researcher</code>,{" "}
                      <code className="text-white">designer</code>, or{" "}
                      <code className="text-white">support-bot</code> so policy
                      rules can be reused across runs.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                    <p className="font-semibold text-white">
                      Step 2: allow integrations and scopes
                    </p>
                    <p>
                      Save a policy for the agent class in the form alongside this
                      guide. If an agent needs more than the saved allowlist, the
                      request shows up in the Recent activity card above.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                    <p className="font-semibold text-white">
                      Step 3: call the unified endpoint with your personal API key
                    </p>
                    <p>
                      Send <code className="text-white">agentId</code>,{" "}
                      <code className="text-white">agentClass</code>, optional{" "}
                      <code className="text-white">scopes</code>, and the tool payload to{" "}
                      <code className="text-white">{agentConnectionGuide.endpoint}</code>.
                      Authenticate with <code className="text-white">Authorization: Bearer ...</code> or{" "}
                      <code className="text-white">X-API-Key</code>; never pass the
                      provider secret directly to the agent.
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4">
                  <p className="mb-3 text-sm font-medium text-white">
                    Copyable fetch example
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--color-text-base)]">
                    {agentConnectionGuide.fetchExample}
                  </pre>
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeading
                  icon={CheckCircle2}
                  title="Save an agent policy"
                  description="Create the allowlist an agent class uses when it invokes the context layer."
                  tooltip="If no policy matches, the request is denied or routed to approval."
                />
                {integrations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-5 text-sm text-[var(--color-text-base)]">
                    Create an integration first, then come back here to map it to an
                    agent class.
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
                    hint="Comma-separated function names."
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
            </div>
          </section>
        ) : null}

        {activeSection === "profile" ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card className="p-6">
              <SectionHeading
                icon={User}
                title="User profile"
                description="These details identify the current dashboard user and the personal key associated with them."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Name" value={userName} />
                <DetailItem label="Email" value={userEmail} />
                <DetailItem label="Session type" value={authMode} />
                <DetailItem
                  label="Context API base URL"
                  value={contextApiBaseUrl}
                />
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeading
                icon={ShieldCheck}
                title="Profile summary"
                description="Helpful details for connecting agents and verifying the current environment."
              />
              <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-black/15 p-5 text-sm leading-7 text-[var(--color-text-base)]">
                <p>
                  The personal API key shown in the Agent API Keys section belongs to{" "}
                  <code className="text-white">{userEmail}</code> and is stored
                  server-side.
                </p>
                <p>
                  Agents should call the unified endpoint rooted at{" "}
                  <code className="text-white">{contextApiBaseUrl}</code>. The
                  provider-specific token remains inside the integration settings.
                </p>
                <p>
                  You currently have <code className="text-white">{integrations.length}</code>{" "}
                  integration{integrations.length === 1 ? "" : "s"} visible in this
                  dashboard session.
                </p>
              </div>
            </Card>
          </section>
        ) : null}

        {activeSection === "integrations" ? (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <SectionHeading
                  icon={PlugZap}
                  title="Integrations"
                  description="Review your current integrations and add a new connector when needed."
                />
              </div>
              <Button
                className="gap-2 self-start"
                onClick={() => setShowIntegrationWizard((current) => !current)}
              >
                {showIntegrationWizard ? "Hide add integration" : "Add new integration"}
              </Button>
            </div>

            {showIntegrationWizard ? (
              <IntegrationWizard
                onCreated={async () => {
                  await invalidateAll();
                  setShowIntegrationWizard(false);
                }}
                onStatus={setStatusMessage}
              />
            ) : null}

            <Card className="p-5">
              <SectionHeading
                icon={PlugZap}
                title="Current integrations"
                description="Toggle integrations or individual functions as you review the catalog."
              />
              <div className="grid gap-4">
                {integrations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-black/10 p-6 text-sm text-[var(--color-text-base)]">
                    No integrations yet. Use the button above to add your first one.
                  </div>
                ) : (
                  integrations.map((integration) => (
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
                            <Badge tone={integration.enabled ? "success" : "danger"}>
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
                          Object.values(integration.functions).map((functionSpec) => (
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
                                    tone={functionSpec.enabled ? "success" : "danger"}
                                  >
                                    {functionSpec.enabled ? "enabled" : "disabled"}
                                  </Badge>
                                  <Badge>
                                    {functionSpec.accessMode === "approval_required"
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
                                  Scopes: {functionSpec.defaultScopes.join(", ") || "none"}
                                </p>
                              </div>
                              <Button
                                variant={functionSpec.enabled ? "secondary" : "primary"}
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
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        ) : null}

        {activeSection === "apiKeys" ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <Card className="p-6">
              <SectionHeading
                icon={KeyRound}
                title="Agent API Keys"
                description="The key is masked by default and can be revealed or copied when you need to configure an agent."
              />
              <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Personal context-layer API key
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-base)]">
                      Issued for {userEmail}
                    </p>
                  </div>
                  <Badge tone={contextApiReady ? "success" : "warning"}>
                    {contextApiReady ? "ready" : "unavailable"}
                  </Badge>
                </div>
                <code className="mt-4 block break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 px-4 py-4 text-sm text-white">
                  {maskedApiKey || "No personal API key available yet."}
                </code>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setRevealApiKey((current) => !current)}
                    disabled={!contextApiReady}
                  >
                    {revealApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {revealApiKey ? "Reveal off" : "Reveal"}
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={handleCopyApiKey}
                    disabled={!contextApiReady}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeading
                icon={ShieldCheck}
                title="How to use this key"
                description="Pass the personal key as a bearer token when your agent calls the unified endpoint."
              />
              <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]/60 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Auth header</p>
                  <code className="mt-2 block break-all text-xs text-[var(--color-text-base)]">
                    Authorization: Bearer {contextApiReady ? contextApiKey : "<personal-api-key>"}
                  </code>
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
            </Card>
          </section>
        ) : null}
      </div>
    </div>
  );
};

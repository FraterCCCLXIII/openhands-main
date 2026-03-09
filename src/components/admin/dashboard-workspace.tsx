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
import { type ReactNode, useEffect, useMemo, useState } from "react";

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
    description: "Compact overview, setup checklist, and recent activity.",
    icon: Home,
  },
  {
    id: "profile",
    label: "User Profile",
    description: "Current user identity and connection context.",
    icon: User,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Review connectors, functions, and toggles in one list.",
    icon: PlugZap,
  },
  {
    id: "apiKeys",
    label: "Agent API Keys",
    description: "Reveal, copy, and use the persisted personal key.",
    icon: KeyRound,
  },
];

const inputClassName =
  "h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 text-sm text-white outline-none transition-colors focus:border-[var(--color-accent)]";

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

const CompactPanel = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <Card className={cn("p-4", className)}>
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="rounded-lg border border-[var(--color-border)] bg-black/20 p-1.5">
              <Icon className="h-4 w-4 text-[var(--color-accent)]" />
            </span>
          ) : null}
          <h2 className="text-sm font-semibold tracking-[0.01em] text-white">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </Card>
);

const SidebarNavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
      active
        ? "bg-[var(--color-bg-active)] text-white"
        : "text-[var(--color-text-base)] hover:bg-white/5 hover:text-white",
    )}
  >
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        active ? "text-[var(--color-accent)]" : "text-[var(--color-text-base)]",
      )}
    />
    <span className="truncate font-medium">{label}</span>
  </button>
);

const MetricRow = ({
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
  <div className="flex items-start gap-3 px-1 py-3">
    <span className="rounded-lg border border-[var(--color-border)] bg-black/20 p-1.5">
      <Icon className="h-4 w-4 text-[var(--color-accent)]" />
    </span>
    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs leading-6 text-[var(--color-text-base)]">
          {description}
        </p>
      </div>
      <p className="shrink-0 text-xl font-semibold text-white">{value}</p>
    </div>
  </div>
);

const KeyValueRow = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex flex-col gap-1 px-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
      {label}
    </p>
    <div
      className={cn(
        "text-sm font-medium text-white sm:max-w-[70%] sm:text-right",
        valueClassName,
      )}
    >
      {value}
    </div>
  </div>
);

const ChecklistRow = ({
  title,
  body,
  action,
  onClick,
}: {
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) => (
  <div className="flex flex-col gap-3 px-1 py-3 md:flex-row md:items-center md:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs leading-6 text-[var(--color-text-base)]">{body}</p>
    </div>
    <Button
      variant="ghost"
      className="h-8 shrink-0 gap-2 rounded-lg px-2 text-xs"
      onClick={onClick}
    >
      {action}
      <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const ActivityRow = ({
  title,
  detail,
  trailing,
  actions,
}: {
  title: ReactNode;
  detail: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="px-1 py-3">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
          {title}
        </div>
        <div className="text-xs leading-6 text-[var(--color-text-base)]">{detail}</div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
    {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

const FormField = ({
  label,
  hint,
  tooltip,
  children,
}: {
  label: string;
  hint?: string;
  tooltip?: string;
  children: ReactNode;
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
  const activeSectionMeta =
    ADMIN_SECTIONS.find((section) => section.id === activeSection) ??
    ADMIN_SECTIONS[0];

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
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-6">
      <aside className="self-start xl:sticky xl:top-0 xl:h-screen xl:border-r xl:border-[var(--color-border)] xl:pr-4 xl:pt-6">
        <div className="space-y-4">
          <div className="border-b border-[var(--color-border)] pb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
              Context Layer
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Admin workspace</p>
              <Badge>{enabledIntegrationCount} live</Badge>
            </div>
          </div>

          <nav className="space-y-1">
            {ADMIN_SECTIONS.map((section) => (
              <SidebarNavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </nav>

          <div className="border-t border-[var(--color-border)] pt-3">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                  Signed in as
                </p>
                <p className="mt-1 break-all text-sm font-medium text-white">
                  {currentUser.email ?? currentUser.name ?? "admin"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{pendingAccessRequests.length} pending</Badge>
                <Badge>{discoveredFunctionCount} functions</Badge>
              </div>
              <Button
                variant="secondary"
                className="h-9 w-full rounded-lg px-3 text-xs"
                onClick={() => signOut({ redirectTo: "/" })}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
              {activeSectionMeta.label}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Agent Context Layer
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-base)]">
              {activeSectionMeta.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{integrations.length} integrations</Badge>
            <Badge>{enabledIntegrationCount} enabled</Badge>
            <Badge>{pendingAccessRequests.length} pending approvals</Badge>
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2 text-sm text-[var(--color-text-active)]">
            {statusMessage}
          </div>
        ) : null}

        {contextApiReady ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            Personal context-layer API key is provisioned for this user. Agents
            should authenticate with <code className="text-white">Authorization: Bearer ...</code>.
          </div>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Open <code className="text-white">/admin</code> once to provision a
            personal key before agents call <code className="text-white">/api/context/*</code>.
          </div>
        )}

        {activeSection === "home" ? (
          <section className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
              <CompactPanel
                title="Workspace summary"
                description="Dense status rows instead of oversized tiles."
                icon={Home}
              >
                <div className="divide-y divide-[var(--color-border)]">
                  <MetricRow
                    icon={PlugZap}
                    label="Integrations"
                    value={String(integrations.length)}
                    description="Connected API and MCP providers visible to the dashboard."
                  />
                  <MetricRow
                    icon={CheckCircle2}
                    label="Enabled integrations"
                    value={String(enabledIntegrationCount)}
                    description="Integrations currently available for agent calls."
                  />
                  <MetricRow
                    icon={KeyRound}
                    label="Functions discovered"
                    value={String(discoveredFunctionCount)}
                    description="Callable functions registered across all integrations."
                  />
                  <MetricRow
                    icon={Bell}
                    label="Pending approvals"
                    value={String(pendingAccessRequests.length)}
                    description="Requests waiting for an approval or rejection decision."
                  />
                </div>
              </CompactPanel>

              <CompactPanel
                title="Getting started"
                description="Follow the same compact sequence each time you onboard a new agent."
                icon={Waypoints}
              >
                <div className="divide-y divide-[var(--color-border)]">
                  <ChecklistRow
                    title="Review your profile"
                    body="Confirm the signed-in identity that owns the persisted personal key."
                    action="Open profile"
                    onClick={() => setActiveSection("profile")}
                  />
                  <ChecklistRow
                    title="Add an integration"
                    body="Create an API or MCP connector and review its callable functions."
                    action="Open integrations"
                    onClick={() => setActiveSection("integrations")}
                  />
                  <ChecklistRow
                    title="Copy your key"
                    body="Reveal or copy the personal agent key, then configure your runtime."
                    action="Open API keys"
                    onClick={() => setActiveSection("apiKeys")}
                  />
                </div>
              </CompactPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <CompactPanel
                title="Recent activity"
                description="Pending approvals and notifications in one compact feed."
                icon={Bell}
              >
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                        Pending approvals
                      </p>
                      <Badge tone={pendingAccessRequests.length > 0 ? "warning" : "default"}>
                        {pendingAccessRequests.length}
                      </Badge>
                    </div>
                    <div className="divide-y divide-[var(--color-border)]">
                      {pendingAccessRequests.length === 0 ? (
                        <p className="px-1 py-3 text-sm text-[var(--color-text-base)]">
                          No pending access requests.
                        </p>
                      ) : (
                        pendingAccessRequests.slice(0, 3).map((request) => (
                          <ActivityRow
                            key={request.id}
                            title={
                              <>
                                <span>{request.integrationKey}.{request.functionName}</span>
                                <Badge tone="warning">pending</Badge>
                              </>
                            }
                            detail={`${request.agentId} (${request.agentClass}) requested ${request.scopes.join(", ") || "default scopes"} for ${request.requestedMinutes} minutes.`}
                            actions={
                              <>
                                <Button
                                  className="h-8 rounded-lg px-3 text-xs"
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
                                  className="h-8 rounded-lg px-3 text-xs"
                                  onClick={() =>
                                    actionMutation.mutate({
                                      url: `/api/access-requests/${request.id}/reject`,
                                      method: "POST",
                                      body: {
                                        approver: currentUser.email ?? "admin",
                                      },
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                        Latest notifications
                      </p>
                      <Badge>{notifications.length}</Badge>
                    </div>
                    <div className="divide-y divide-[var(--color-border)]">
                      {notifications.length === 0 ? (
                        <p className="px-1 py-3 text-sm text-[var(--color-text-base)]">
                          Notifications will appear here when agents request access.
                        </p>
                      ) : (
                        notifications.slice(0, 3).map((notification) => (
                          <ActivityRow
                            key={notification.id}
                            title={
                              <>
                                <Badge>{notification.channel}</Badge>
                                <span>{notification.recipient}</span>
                              </>
                            }
                            detail={
                              <>
                                <span className="block text-sm text-white">
                                  {notification.subject}
                                </span>
                                <span>{notification.body}</span>
                              </>
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CompactPanel>

              <CompactPanel
                title="Connection details"
                description="Hand these values to your agent runtime."
                icon={ShieldCheck}
              >
                <div className="divide-y divide-[var(--color-border)]">
                  <KeyValueRow
                    label="Unified endpoint"
                    value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.endpoint}</code>}
                  />
                  <KeyValueRow
                    label="Auth"
                    value="Authorization: Bearer <personal-api-key>"
                  />
                  <KeyValueRow
                    label="Agent class"
                    value="Use a stable value such as researcher, designer, or support-bot."
                  />
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/20">
                  <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                    Fetch example
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                    {agentConnectionGuide.fetchExample}
                  </pre>
                </div>
              </CompactPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
              <CompactPanel
                title="Agent onboarding"
                description="A compact checklist instead of large step cards."
                icon={CheckCircle2}
              >
                <div className="divide-y divide-[var(--color-border)]">
                  <ActivityRow
                    title="1. Choose a stable agentClass"
                    detail="Reusable labels such as researcher or support-bot keep your saved policies easy to reuse."
                  />
                  <ActivityRow
                    title="2. Save an allowlist"
                    detail="Map an integration, allowed functions, and default scopes in the policy form next to this checklist."
                  />
                  <ActivityRow
                    title="3. Call the unified endpoint"
                    detail={
                      <>
                        Send <code className="text-white">agentId</code>, <code className="text-white">agentClass</code>, optional <code className="text-white">scopes</code>, and the payload to <code className="text-white">{agentConnectionGuide.endpoint}</code>. Authenticate with the persisted personal key.
                      </>
                    }
                  />
                </div>
              </CompactPanel>

              <CompactPanel
                title="Save an agent policy"
                description="Create the allowlist an agent class uses when it invokes the context layer."
                icon={ShieldCheck}
              >
                {integrations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                    Create an integration first, then come back here to map it to an agent class.
                  </div>
                ) : null}
                <form
                  className="grid gap-3 md:grid-cols-2"
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
                      className={inputClassName}
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

                  <FormField label="Integration" hint="The connector this class may use.">
                    <select
                      className={inputClassName}
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
                      className={inputClassName}
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
                      className={inputClassName}
                      placeholder="pages.read"
                      value={policyForm.scopes}
                      onChange={(event) =>
                        setPolicyForm({
                          ...policyForm,
                          scopes: event.target.value,
                        })
                      }
                    />
                  </FormField>

                  <div className="flex justify-end md:col-span-2">
                    <Button type="submit" className="h-9 rounded-lg px-4 text-xs">
                      Save policy
                    </Button>
                  </div>
                </form>
              </CompactPanel>
            </div>
          </section>
        ) : null}

        {activeSection === "profile" ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <CompactPanel
              title="User profile"
              description="Current dashboard identity and request origin details."
              icon={User}
            >
              <div className="divide-y divide-[var(--color-border)]">
                <KeyValueRow label="Name" value={userName} />
                <KeyValueRow label="Email" value={userEmail} />
                <KeyValueRow label="Session type" value={authMode} />
                <KeyValueRow
                  label="Context API base URL"
                  value={<code className="break-all text-xs text-[var(--color-text-active)]">{contextApiBaseUrl}</code>}
                />
              </div>
            </CompactPanel>

            <CompactPanel
              title="Connection context"
              description="Useful at-a-glance values for validating the current environment."
              icon={ShieldCheck}
            >
              <div className="divide-y divide-[var(--color-border)]">
                <KeyValueRow
                  label="Personal key status"
                  value={contextApiReady ? "Provisioned" : "Not available yet"}
                />
                <KeyValueRow label="Visible integrations" value={String(integrations.length)} />
                <KeyValueRow
                  label="Pending approvals"
                  value={String(pendingAccessRequests.length)}
                />
                <KeyValueRow
                  label="Endpoint pattern"
                  value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.endpoint}</code>}
                />
              </div>
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                The persisted personal key belongs to <code className="text-white">{userEmail}</code>. Provider-specific secrets stay inside each integration configuration and are never handed directly to the agent.
              </div>
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "integrations" ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-text-base)]">
                Review current integrations in a denser list view and expand the wizard only when you need to add one.
              </p>
              <Button
                className="h-9 self-start rounded-lg px-4 text-xs"
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

            <CompactPanel
              title="Integration catalog"
              description="Compact rows for providers, status, auth strategy, and functions."
              icon={PlugZap}
            >
              {integrations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                  No integrations yet. Use the button above to add your first one.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {integrations.map((integration) => (
                    <div key={integration.key} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">
                              {integration.name}
                            </h3>
                            <Badge>{integration.provider}</Badge>
                            <Badge>{integration.kind}</Badge>
                            <Badge tone={integration.enabled ? "success" : "danger"}>
                              {integration.enabled ? "enabled" : "disabled"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                            {integration.key} · auth: {integration.authStrategy}
                          </p>
                        </div>
                        <Button
                          variant={integration.enabled ? "secondary" : "primary"}
                          className="h-8 shrink-0 gap-2 rounded-lg px-3 text-xs"
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

                      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/10">
                        {Object.values(integration.functions).length === 0 ? (
                          <p className="px-3 py-3 text-sm text-[var(--color-text-base)]">
                            No functions registered yet.
                          </p>
                        ) : (
                          Object.values(integration.functions).map((functionSpec, index) => (
                            <div
                              key={functionSpec.name}
                              className={cn(
                                "flex flex-col gap-3 px-3 py-3 md:flex-row md:items-start md:justify-between",
                                index > 0 && "border-t border-[var(--color-border)]",
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-white">
                                    {functionSpec.name}
                                  </p>
                                  <Badge tone={functionSpec.enabled ? "success" : "danger"}>
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
                                <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                                  {functionSpec.description || "No description provided."}
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-base)]">
                                  Scopes: {functionSpec.defaultScopes.join(", ") || "none"}
                                </p>
                              </div>
                              <Button
                                variant={functionSpec.enabled ? "secondary" : "primary"}
                                className="h-8 shrink-0 rounded-lg px-3 text-xs"
                                onClick={() =>
                                  actionMutation.mutate({
                                    url: `/api/integrations/${integration.key}/functions/${functionSpec.name}/toggle`,
                                    method: "POST",
                                    body: { enabled: !functionSpec.enabled },
                                  })
                                }
                                title="Enable or disable just this callable function."
                              >
                                {functionSpec.enabled ? "Disable function" : "Enable function"}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "apiKeys" ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <CompactPanel
              title="Personal context-layer key"
              description="Masked by default, with compact reveal and copy controls."
              icon={KeyRound}
              action={
                <Badge tone={contextApiReady ? "success" : "warning"}>
                  {contextApiReady ? "ready" : "unavailable"}
                </Badge>
              }
            >
              <div className="divide-y divide-[var(--color-border)]">
                <KeyValueRow label="Issued for" value={userEmail} />
                <KeyValueRow
                  label="Base URL"
                  value={<code className="break-all text-xs text-[var(--color-text-active)]">{contextApiBaseUrl}</code>}
                />
              </div>
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-3">
                <code className="block break-all text-sm text-white">
                  {maskedApiKey || "No personal API key available yet."}
                </code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="h-8 gap-2 rounded-lg px-3 text-xs"
                  onClick={() => setRevealApiKey((current) => !current)}
                  disabled={!contextApiReady}
                >
                  {revealApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {revealApiKey ? "Hide" : "Reveal"}
                </Button>
                <Button
                  className="h-8 gap-2 rounded-lg px-3 text-xs"
                  onClick={handleCopyApiKey}
                  disabled={!contextApiReady}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </CompactPanel>

            <CompactPanel
              title="Usage"
              description="Use the persisted personal key as a bearer token."
              icon={ShieldCheck}
            >
              <div className="divide-y divide-[var(--color-border)]">
                <KeyValueRow
                  label="Auth header"
                  value={
                    <code className="break-all text-xs text-[var(--color-text-active)]">
                      Authorization: Bearer {contextApiReady ? contextApiKey : "<personal-api-key>"}
                    </code>
                  }
                />
                <KeyValueRow
                  label="Endpoint"
                  value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.endpoint}</code>}
                />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/20">
                <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                  cURL example
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                  {agentConnectionGuide.curlExample}
                </pre>
              </div>
            </CompactPanel>
          </section>
        ) : null}
      </div>
    </div>
  );
};

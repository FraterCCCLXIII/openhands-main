"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  AccessModeSlider,
  getFunctionAccessMode,
  matchesFunctionSearch,
} from "@/src/components/admin/function-access-controls";
import { IntegrationWizard } from "@/src/components/admin/integration-wizard";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import { cn } from "@/src/lib/utils";
import type {
  AccessRequest,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationSpec,
  NotificationRecord,
} from "@/src/types/context-layer";

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

const inputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]";

const matchesIntegrationSearch = (integration: IntegrationSpec, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    integration.name,
    integration.key,
    integration.provider,
    integration.kind,
    integration.authStrategy,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

type AdminSection = "home" | "profile" | "integrations" | "apiKeys";

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
    label: "Agent Connection",
    description: "Reveal, copy, and use the persisted personal key.",
    icon: KeyRound,
  },
];

const OPENHANDS_CONTEXT_KEY_ENV = "$OPENHANDS_CONTEXT_KEY";

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
  <Card className={cn("p-5", className)}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-1.5">
              <Icon className="h-4 w-4 text-[var(--color-accent)]" />
            </span>
          ) : null}
          <h2 className="text-base font-semibold tracking-[-0.01em] text-white">
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
      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
      active
        ? "bg-[var(--color-bg-active)] text-white"
        : "text-[var(--color-text-base)] hover:bg-[var(--color-bg-active)] hover:text-white",
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
    <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-1.5">
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
      className="h-8 shrink-0 gap-2 rounded-md px-2 text-xs"
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

export const DashboardWorkspace = ({
  initialIntegrations,
  initialAccessRequests,
  initialNotifications,
  currentUser,
  contextApiBaseUrl,
  contextApiKey,
}: AdminDashboardProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<AdminSection>("home");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(
    initialIntegrations.length === 0,
  );
  const [integrationSearch, setIntegrationSearch] = useState("");
  const [hideDisabledSkills, setHideDisabledSkills] = useState(true);
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({});
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  useEffect(() => {
    const requestedSection = searchParams.get("section");
    if (
      requestedSection === "home" ||
      requestedSection === "profile" ||
      requestedSection === "integrations" ||
      requestedSection === "apiKeys"
    ) {
      setActiveSection(requestedSection);
    }

    if (searchParams.get("showIntegrationWizard") === "1") {
      setShowIntegrationWizard(true);
    }

    const oauthStatus = searchParams.get("oauth_status");
    const oauthProvider = searchParams.get("oauth_provider");
    const oauthError = searchParams.get("oauth_error");
    if (oauthStatus === "connected" && oauthProvider) {
      setStatusMessage(
        `${oauthProvider[0]?.toUpperCase() ?? ""}${oauthProvider.slice(1)} connected successfully. Finish saving the integration to use it.`,
      );
    }

    if (oauthStatus === "error") {
      setStatusMessage(oauthError || "OAuth connection failed.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!apiKeyCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setApiKeyCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [apiKeyCopied]);

  const navigateToSection = (section: AdminSection) => {
    setActiveSection(section);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (section === "home") {
      nextSearchParams.delete("section");
    } else {
      nextSearchParams.set("section", section);
    }

    const nextUrl = nextSearchParams.toString();
    router.push(nextUrl ? `${pathname}?${nextUrl}` : pathname);
  };

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
        apiKey: OPENHANDS_CONTEXT_KEY_ENV,
        integrations,
      }),
    [contextApiBaseUrl, integrations],
  );

  const filteredIntegrations = useMemo(() => {
    const normalizedSearch = integrationSearch.trim().toLowerCase();

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
        const functions = Object.values(integration.functions).sort((left, right) =>
          left.name.localeCompare(right.name),
        );
        const visibleFunctions = functions.filter((functionSpec) => {
          if (
            hideDisabledSkills &&
            getFunctionAccessMode(functionSpec) === "disabled"
          ) {
            return false;
          }

          return (
            !normalizedSearch ||
            integrationMatchesSearch ||
            matchesFunctionSearch(
              functionSpec.name,
              functionSpec,
              normalizedSearch,
            )
          );
        });

        if (
          normalizedSearch &&
          !integrationMatchesSearch &&
          visibleFunctions.length === 0
        ) {
          return null;
        }

        return {
          integration,
          functions,
          visibleFunctions,
        };
      })
      .filter((value): value is {
        integration: IntegrationSpec;
        functions: FunctionSpec[];
        visibleFunctions: FunctionSpec[];
      } => value !== null);
  }, [hideDisabledSkills, integrationSearch, integrations]);

  const visibleFunctionCount = filteredIntegrations.reduce(
    (count, entry) => count + entry.visibleFunctions.length,
    0,
  );

  const toggleIntegrationExpanded = (
    integrationKey: string,
    expanded: boolean,
  ) => {
    setExpandedIntegrations((current) => ({
      ...current,
      [integrationKey]: !expanded,
    }));
  };

  const toggleFunctionExpanded = (functionKey: string) => {
    setExpandedFunctions((current) => ({
      ...current,
      [functionKey]: !current[functionKey],
    }));
  };

  const updateFunctionAccessMode = (
    integrationKey: string,
    functionName: string,
    accessMode: FunctionAccessMode,
  ) => {
    actionMutation.mutate({
      url: `/api/integrations/${integrationKey}/functions/${functionName}`,
      method: "PATCH",
      body: { accessMode },
    });
  };


  const handleCopyApiKey = async () => {
    if (!contextApiReady) {
      setStatusMessage("The personal API key is not available yet.");
      return;
    }

    try {
      await copyTextToClipboard(contextApiKey);
      setApiKeyCopied(true);
    } catch {
      setApiKeyCopied(false);
      setStatusMessage("Unable to copy the API key from this browser session.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <aside className="self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
        <div className="space-y-4">
          <div className="border-b border-[var(--color-border)] pb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
              OpenHands
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Context Layer</p>
              <Badge>{enabledIntegrationCount} live</Badge>
            </div>
            <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
              Admin workspace inspired by the OpenHands settings shell.
            </p>
          </div>

          <nav className="space-y-1">
            {ADMIN_SECTIONS.map((section) => (
              <SidebarNavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => navigateToSection(section.id)}
              />
            ))}
          </nav>


          <div className="border-t border-[var(--color-border)] pt-3">
            <a
              href="/add-connector"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-text-base)] transition-colors hover:bg-[var(--color-bg-active)] hover:text-white"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-text-base)]" />
              <span className="truncate font-medium">Admin</span>
            </a>
          </div>


          <div className="border-t border-[var(--color-border)] pt-3">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                  Signed in as
                </p>
                <p className="mt-1 text-sm font-medium text-white">{userName}</p>
                <p className="mt-1 break-all text-xs text-[var(--color-text-base)]">{userEmail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{pendingAccessRequests.length} pending</Badge>
                <Badge>{discoveredFunctionCount} functions</Badge>
              </div>
              <Button
                variant="secondary"
                className="h-9 w-full rounded-md px-3 text-xs"
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
              OpenHands Context Layer
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {activeSectionMeta.label}
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
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text-active)]">
            {statusMessage}
          </div>
        ) : null}

        {!contextApiReady ? (
          <div className="rounded-xl border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] px-3 py-2 text-sm text-[var(--color-warning)]">
            Open <code className="text-white">/admin</code> once to provision a
            personal key before agents call <code className="text-white">/api/context/*</code>.
          </div>
        ) : null}

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
                    onClick={() => navigateToSection("profile")}
                  />
                  <ChecklistRow
                    title="Add an integration"
                    body="Create a Built-in or MCP connector and review its callable functions."
                    action="Open integrations"
                    onClick={() => navigateToSection("integrations")}
                  />
                  <ChecklistRow
                    title="Copy your key"
                    body="Reveal or copy the personal agent key, then configure your runtime."
                    action="Open connection"
                    onClick={() => navigateToSection("apiKeys")}
                  />
                </div>
              </CompactPanel>
            </div>

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
                                className="h-8 rounded-md px-3 text-xs"
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
                                className="h-8 rounded-md px-3 text-xs"
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
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                The persisted personal key belongs to <code className="text-white">{userEmail}</code>. Provider credentials stay server-side in integration settings or per-user OAuth records and are never handed directly to the agent.
              </div>
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "integrations" ? (
          <section className="space-y-4">
            <div className="flex justify-start">
              <Button
                className="h-9 rounded-md px-4 text-xs"
                onClick={() => setShowIntegrationWizard(true)}
              >
                Add new integration
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
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white">
                          Search and review integration skills
                        </h3>
                        <p className="text-xs leading-6 text-[var(--color-text-base)]">
                          Use the same compact expandable skill rows here to
                          search integrations, tune access modes, and hide
                          disabled skills by default.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
                        <Badge>{filteredIntegrations.length} integrations</Badge>
                        <Badge>{visibleFunctionCount} visible skills</Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <input
                        type="search"
                        value={integrationSearch}
                        onChange={(event) => setIntegrationSearch(event.target.value)}
                        placeholder="Search integrations and skills"
                        aria-label="Search integrations and skills"
                        className={cn(inputClassName, "w-full lg:max-w-md")}
                      />
                      <label className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-xs text-white">
                        <input
                          type="checkbox"
                          checked={hideDisabledSkills}
                          aria-label="Hide disabled skills"
                          onChange={(event) =>
                            setHideDisabledSkills(event.target.checked)
                          }
                        />
                        <span>Hide disabled skills</span>
                      </label>
                    </div>
                  </div>

                  {filteredIntegrations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                      No integrations or skills match the current filters.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredIntegrations.map(
                        ({ integration, functions, visibleFunctions }) => {
                          const isExpanded =
                            expandedIntegrations[integration.key] ??
                            Boolean(integrationSearch.trim());

                          return (
                            <div
                              key={integration.key}
                              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                              data-integration-key={integration.key}
                            >
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
                                  <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-base)]">
                                    {visibleFunctions.length} visible skill
                                    {visibleFunctions.length === 1 ? "" : "s"}
                                    {functions.length > 0
                                      ? ` of ${functions.length}`
                                      : ""}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                  <Button
                                    variant={integration.enabled ? "secondary" : "primary"}
                                    className="h-8 shrink-0 gap-2 rounded-md px-3 text-xs"
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
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 rounded-md px-3 text-xs"
                                    aria-expanded={isExpanded}
                                    aria-controls={`integration-functions-${integration.key}`}
                                    onClick={() =>
                                      toggleIntegrationExpanded(
                                        integration.key,
                                        isExpanded,
                                      )
                                    }
                                  >
                                    {isExpanded ? "Hide skills" : "Show skills"}
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
                                  id={`integration-functions-${integration.key}`}
                                  className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]"
                                >
                                  {functions.length === 0 ? (
                                    <p className="px-4 py-4 text-sm text-[var(--color-text-base)]">
                                      No skills registered yet.
                                    </p>
                                  ) : visibleFunctions.length === 0 ? (
                                    <p className="px-4 py-4 text-sm text-[var(--color-text-base)]">
                                      No visible skills match the current filters.
                                    </p>
                                  ) : (
                                    <div className="divide-y divide-[var(--color-border)]">
                                      {visibleFunctions.map((functionSpec) => {
                                        const functionKey = `${integration.key}:${functionSpec.name}`;
                                        const accessMode =
                                          getFunctionAccessMode(functionSpec);
                                        const isFunctionExpanded =
                                          expandedFunctions[functionKey] ?? false;

                                        return (
                                          <div
                                            key={functionKey}
                                            className="px-4 py-4"
                                            data-function-key={functionKey}
                                            data-function-name={functionSpec.name}
                                          >
                                            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white">
                                                  {functionSpec.name}
                                                </p>
                                                <p className="mt-1 truncate text-xs leading-6 text-[var(--color-text-base)]">
                                                  {functionSpec.description || "No description provided."}
                                                </p>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                                <AccessModeSlider
                                                  functionName={functionSpec.name}
                                                  mode={accessMode}
                                                  onChange={(nextMode) =>
                                                    updateFunctionAccessMode(
                                                      integration.key,
                                                      functionSpec.name,
                                                      nextMode,
                                                    )
                                                  }
                                                />
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  className="h-8 rounded-md px-3 text-xs"
                                                  aria-expanded={isFunctionExpanded}
                                                  aria-controls={`function-details-${functionKey}`}
                                                  onClick={() =>
                                                    toggleFunctionExpanded(functionKey)
                                                  }
                                                >
                                                  {isFunctionExpanded
                                                    ? "Hide details"
                                                    : "Show details"}
                                                  <ChevronRight
                                                    className={cn(
                                                      "ml-1 h-4 w-4 transition-transform",
                                                      isFunctionExpanded &&
                                                        "rotate-90",
                                                    )}
                                                  />
                                                </Button>
                                              </div>
                                            </div>

                                            {isFunctionExpanded ? (
                                              <div
                                                id={`function-details-${functionKey}`}
                                                className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                                              >
                                                <p className="text-sm leading-7 text-[var(--color-text-base)]">
                                                  {functionSpec.description || "No description provided."}
                                                </p>
                                                <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                                                  Default scopes: {functionSpec.defaultScopes.join(", ") || "none"}
                                                </p>
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              )}
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "apiKeys" ? (
          <section className="space-y-4">
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
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                <code className="block break-all text-sm text-white">
                  {maskedApiKey || "No personal API key available yet."}
                </code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="h-8 gap-2 rounded-md px-3 text-xs"
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
                  className="h-8 gap-2 rounded-md px-3 text-xs"
                  onClick={handleCopyApiKey}
                  disabled={!contextApiReady}
                >
                  {apiKeyCopied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </CompactPanel>

            <CompactPanel
              title="Usage"
              description="Use the persisted personal key as a bearer token for REST calls, the per-user OpenAPI schema, or the MCP bridge."
              icon={ShieldCheck}
            >
              <p className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs leading-6 text-[var(--color-text-base)]">
                {agentConnectionGuide.permissionNote}
              </p>
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                    REST API Usage
                  </h4>
                  <div className="mt-3 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="Auth header"
                      value={
                        <code className="break-all text-xs text-[var(--color-text-active)]">
                          Authorization: Bearer {OPENHANDS_CONTEXT_KEY_ENV}
                        </code>
                      }
                    />
                    <KeyValueRow
                      label="REST endpoint"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.endpoint}</code>}
                    />
                    <KeyValueRow
                      label="OpenAPI schema"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.openApiSchemaEndpoint}</code>}
                    />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      Tool call cURL example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.curlExample}
                    </pre>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      OpenAPI schema cURL example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.openApiCurlExample}
                    </pre>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                    MCP Usage
                  </h4>
                  <div className="mt-3 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="MCP endpoint"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpEndpoint}</code>}
                    />
                    <KeyValueRow
                      label="Set agent ID tool"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpSetAgentIdToolName}</code>}
                    />
                    <KeyValueRow
                      label="Set agent class tool"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpSetAgentClassToolName}</code>}
                    />
                    <KeyValueRow
                      label="Example MCP tool"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpToolName}</code>}
                    />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      MCP streamable HTTP example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.mcpConfigExample}
                    </pre>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      MCP session setup
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.mcpSessionSetupExample}
                    </pre>
                  </div>
                </section>
              </div>
            </CompactPanel>
          </section>
        ) : null}
      </div>
    </div>
  );
};

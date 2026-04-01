"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  accessModeLabel,
  AccessModeSlider,
  getFunctionAccessMode,
  matchesFunctionSearch,
} from "@/src/components/admin/function-access-controls";
import { DashboardSidebar, DashboardSidebarUserPanel, getDashboardSections } from "@/src/components/admin/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/admin/dashboard-sign-out-button";
import { IntegrationWizard } from "@/src/components/admin/integration-wizard";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  buildAdminSectionHref,
  getAdminSectionFromPath,
  type AdminSection,
} from "@/src/lib/admin-routes";
import {
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  MAX_CASE_BY_CASE_APPROVAL_HOURS,
  approvalHoursToMinutes,
  approvalStatusLabel,
  normalizeApprovalDurationHours,
} from "@/src/lib/access-requests";
import {
  buildAgentConnectionGuide,
  OPENHANDS_CLOUD_SHTTP_MCP_URL,
  OPENHANDS_CONTEXT_KEY_ENV,
} from "@/src/lib/agent-connection";
import { cn } from "@/src/lib/utils";
import type {
  AccessRequest,
  AdminApiKeyStatus,
  BuiltInConnectorOption,
  DisableUnusedFunctionsResult,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationSpec,
  NotificationRecord,
  UnusedFunctionWindowUnit,
  UserApiKeyStatus,
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

const POPULAR_INTEGRATION_SLUGS = [
  "github",
  "slack",
  "notion",
  "linear",
  "elevenlabs",
] as const;

const UNUSED_FUNCTION_WINDOW_OPTIONS: Array<{
  value: UnusedFunctionWindowUnit;
  label: string;
}> = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

const subtractUnusedWindow = (
  reference: Date,
  amount: number,
  unit: UnusedFunctionWindowUnit,
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

const formatTrackedUsage = (functionSpec: FunctionSpec) => {
  if (!functionSpec.lastInvokedAt) {
    return "No tracked usage yet";
  }

  const formatted = new Date(functionSpec.lastInvokedAt).toLocaleString();
  const count = functionSpec.invocationCount ?? 0;
  const outcomeLabel = functionSpec.lastInvocationOutcome
    ? functionSpec.lastInvocationOutcome.replace(/_/g, " ")
    : "unknown";

  return count > 0
    ? `Last tracked invocation: ${formatted} · ${count} total · ${outcomeLabel}`
    : `Last tracked invocation: ${formatted} · ${outcomeLabel}`;
};

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

const matchesConnectorSearch = (
  connector: BuiltInConnectorOption,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    connector.name,
    connector.slug,
    connector.description,
    connector.authStrategy,
    ...connector.categories,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

type ApprovalRequestFilter = "pending" | "approved" | "denied";

const approvalStatusTone = (status: AccessRequest["status"]) => {
  switch (approvalStatusLabel(status)) {
    case "approved":
      return "success" as const;
    case "denied":
      return "danger" as const;
    default:
      return "warning" as const;
  }
};

const matchesAccessRequestFilter = (
  request: AccessRequest,
  filter: ApprovalRequestFilter,
) => approvalStatusLabel(request.status) === filter;

const matchesAccessRequestSearch = (
  request: AccessRequest,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    request.agentId,
    request.agentClass,
    request.integrationKey,
    request.functionName,
    request.justification ?? "",
    approvalStatusLabel(request.status),
    ...request.scopes,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

const formatTimestamp = (value?: string) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
};

interface AdminDashboardProps {
  initialIntegrations: IntegrationSpec[];
  initialAccessRequests: AccessRequest[];
  initialNotifications: NotificationRecord[];
  currentUser: { name?: string | null; email?: string | null };
  contextApiBaseUrl: string;
  contextApiKey: string;
  userApiKey?: UserApiKeyStatus | null;
  userApiKeyValue?: string | null;
  adminApiKey?: AdminApiKeyStatus | null;
  adminApiKeyValue?: string | null;
  isAdmin?: boolean;
}

interface UserApiKeyResponse {
  hasKey: boolean;
  key: UserApiKeyStatus | null;
  apiKey: string | null;
}

interface AdminApiKeyResponse {
  hasKey: boolean;
  key: AdminApiKeyStatus | null;
  apiKey: string | null;
}

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

const maskStoredApiKey = (keyPrefix: string, keySuffix: string) => {
  const visiblePrefix = keyPrefix.trim().slice(0, 4);
  const visibleSuffix = keySuffix.trim();

  if (!visiblePrefix && !visibleSuffix) {
    return "";
  }

  return `${visiblePrefix}${"•".repeat(16)}${visibleSuffix}`;
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
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
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
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </Card>
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

const getConnectorLogoUrl = (connector: {
  logoUrl?: string;
  appUrl?: string;
}) => {
  if (connector.logoUrl?.trim()) {
    return connector.logoUrl.trim();
  }

  if (connector.appUrl?.trim()) {
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(connector.appUrl.trim())}`;
  }

  return null;
};

const ConnectorLogo = ({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) => (
  <span
    className={cn(
      "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]",
      className,
    )}
  >
    {logoUrl ? (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-7 w-7 rounded-md object-contain"
      />
    ) : (
      <span className="text-sm font-semibold text-white">{name.slice(0, 1)}</span>
    )}
  </span>
);

const IntegrationMarketplaceCard = ({
  connector,
  onClick,
}: {
  connector: BuiltInConnectorOption;
  onClick: () => void;
}) => {
  const logoUrl = getConnectorLogoUrl(connector);

  return (
    <button
      type="button"
      onClick={onClick}
      data-built-in-slug={connector.slug}
      className="group flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-active)]"
    >
      <ConnectorLogo
        name={connector.name}
        logoUrl={logoUrl}
        className="h-9 w-9 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">{connector.name}</p>
          <Badge>{connector.authStrategy.replace("_", " ")}</Badge>
          {connector.categories[0] ? <Badge>{connector.categories[0]}</Badge> : null}
          {connector.toolCount > 0 ? <Badge>{connector.toolCount} tools</Badge> : null}
        </div>
        <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-base)]">
          {connector.description}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-accent-hover)]" />
    </button>
  );
};

export const DashboardWorkspace = ({
  initialIntegrations,
  initialAccessRequests,
  initialNotifications: _initialNotifications,
  currentUser,
  contextApiBaseUrl,
  contextApiKey,
  userApiKey = null,
  userApiKeyValue: initialUserApiKeyValue = null,
  adminApiKey = null,
  adminApiKeyValue: initialAdminApiKeyValue = null,
  isAdmin = true,
}: AdminDashboardProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<AdminSection>(() =>
    getAdminSectionFromPath(pathname),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(false);
  const [addIntegrationSearch, setAddIntegrationSearch] = useState("");
  const [integrationSearch, setIntegrationSearch] = useState("");
  const [hideDisabledSkills, setHideDisabledSkills] = useState(true);
  const [unusedThresholdValue, setUnusedThresholdValue] = useState("30");
  const [unusedThresholdUnit, setUnusedThresholdUnit] =
    useState<UnusedFunctionWindowUnit>("days");
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({});
  const [expandedUsageSections, setExpandedUsageSections] = useState<
    Record<string, boolean>
  >({});
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalRequestFilter>("pending");
  const [approvalDurationHours, setApprovalDurationHours] = useState(
    String(DEFAULT_CASE_BY_CASE_APPROVAL_HOURS),
  );
  const [selectedApprovalRequests, setSelectedApprovalRequests] = useState<
    Record<string, boolean>
  >({});
  const [requestActionPending, setRequestActionPending] = useState(false);
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [userApiKeyStatus, setUserApiKeyStatus] = useState<UserApiKeyStatus | null>(
    userApiKey,
  );
  const [userApiKeyValue, setUserApiKeyValue] = useState(
    initialUserApiKeyValue ?? "",
  );
  const [revealUserApiKey, setRevealUserApiKey] = useState(false);
  const [userApiKeyCopied, setUserApiKeyCopied] = useState(false);
  const [adminApiKeyStatus, setAdminApiKeyStatus] = useState<AdminApiKeyStatus | null>(
    adminApiKey,
  );
  const [adminApiKeyValue, setAdminApiKeyValue] = useState(
    initialAdminApiKeyValue ?? "",
  );
  const [revealAdminApiKey, setRevealAdminApiKey] = useState(false);
  const [adminApiKeyCopied, setAdminApiKeyCopied] = useState(false);

  const oauthStatusMessage = useMemo(() => {
    const oauthStatus = searchParams.get("oauth_status");
    const oauthProvider = searchParams.get("oauth_provider");
    const oauthError = searchParams.get("oauth_error");

    if (oauthStatus === "connected" && oauthProvider) {
      return `${oauthProvider[0]?.toUpperCase() ?? ""}${oauthProvider.slice(1)} connected successfully. Finish saving the integration to use it.`;
    }

    if (oauthStatus === "error") {
      return oauthError || "OAuth connection failed.";
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    setActiveSection(getAdminSectionFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("showIntegrationWizard") === "1") {
      setShowIntegrationWizard(true);
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

  useEffect(() => {
    setUserApiKeyStatus(userApiKey);
  }, [userApiKey]);

  useEffect(() => {
    setUserApiKeyValue(initialUserApiKeyValue ?? "");
  }, [initialUserApiKeyValue]);

  useEffect(() => {
    setAdminApiKeyStatus(adminApiKey);
  }, [adminApiKey]);

  useEffect(() => {
    setAdminApiKeyValue(initialAdminApiKeyValue ?? "");
  }, [initialAdminApiKeyValue]);

  useEffect(() => {
    if (!userApiKeyCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setUserApiKeyCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [userApiKeyCopied]);

  useEffect(() => {
    if (!adminApiKeyCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAdminApiKeyCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [adminApiKeyCopied]);

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
  });

  const builtInConnectorsQuery = useQuery({
    queryKey: ["built-in-connectors"],
    queryFn: () =>
      fetchJson<BuiltInConnectorOption[]>("/api/integrations/built-in-connectors"),
    enabled: activeSection === "integrations",
    staleTime: Number.POSITIVE_INFINITY,
  });

  const accessRequestsQuery = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<AccessRequest[]>("/api/access-requests"),
    initialData: initialAccessRequests,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
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
      successMessage?: string;
    }) =>
      fetchJson(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: async (_data, variables) => {
      setStatusMessage(variables.successMessage ?? "Saved.");
      await invalidateAll();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const bulkDisableMutation = useMutation({
    mutationFn: async (payload: {
      thresholdValue: number;
      thresholdUnit: UnusedFunctionWindowUnit;
    }) =>
      fetchJson<DisableUnusedFunctionsResult>("/api/integrations/disable-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (result) => {
      setStatusMessage(
        result.disabledCount > 0
          ? `Disabled ${result.disabledCount} tracked ${result.disabledCount === 1 ? "function" : "functions"} unused since ${new Date(result.cutoffIso).toLocaleDateString()}.`
          : "No tracked functions matched the selected unused window.",
      );
      await invalidateAll();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const integrations = integrationsQuery.data ?? [];
  const accessRequests = accessRequestsQuery.data ?? [];
  const approverIdentity =
    currentUser.email?.trim() || currentUser.name?.trim() || "human-approver";
  const sortedAccessRequests = useMemo(
    () =>
      [...accessRequests].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [accessRequests],
  );
  const filteredAccessRequests = useMemo(
    () =>
      sortedAccessRequests.filter(
        (request) =>
          matchesAccessRequestFilter(request, approvalFilter) &&
          matchesAccessRequestSearch(request, approvalSearch),
      ),
    [approvalFilter, approvalSearch, sortedAccessRequests],
  );
  const approvalCounts = useMemo(
    () => ({
      pending: sortedAccessRequests.filter((request) => request.status === "pending")
        .length,
      approved: sortedAccessRequests.filter((request) => request.status === "approved")
        .length,
      denied: sortedAccessRequests.filter(
        (request) => approvalStatusLabel(request.status) === "denied",
      ).length,
    }),
    [sortedAccessRequests],
  );
  const selectedApprovalRequestIds = filteredAccessRequests
    .filter((request) => selectedApprovalRequests[request.id])
    .map((request) => request.id);
  const hasVisibleApprovalRequests = filteredAccessRequests.length > 0;
  const allVisibleApprovalRequestsSelected =
    hasVisibleApprovalRequests &&
    filteredAccessRequests.every((request) => selectedApprovalRequests[request.id]);
  const selectedApprovalRequestCount = selectedApprovalRequestIds.length;
  const normalizedApprovalDurationHours = useMemo(() => {
    const parsed = Number(approvalDurationHours);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_CASE_BY_CASE_APPROVAL_HOURS;
    }

    return normalizeApprovalDurationHours(parsed);
  }, [approvalDurationHours]);
  const normalizedUnusedThresholdValue = useMemo(() => {
    const parsed = Number(unusedThresholdValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 30;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 3650);
  }, [unusedThresholdValue]);

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
  const hasUserApiKey = userApiKeyStatus !== null;
  const maskedUserApiKey = userApiKeyValue
    ? maskApiKey(userApiKeyValue, revealUserApiKey)
    : userApiKeyStatus
      ? maskStoredApiKey(userApiKeyStatus.keyPrefix, userApiKeyStatus.keySuffix)
      : "";
  const hasAdminApiKey = adminApiKeyStatus !== null;
  const maskedAdminApiKey = adminApiKeyValue
    ? maskApiKey(adminApiKeyValue, revealAdminApiKey)
    : adminApiKeyStatus
      ? maskStoredApiKey(adminApiKeyStatus.keyPrefix, adminApiKeyStatus.keySuffix)
      : "";
  const userName = currentUser.name?.trim() || "Admin User";
  const userEmail = currentUser.email?.trim() || "Not provided";
  const authMode =
    currentUser.email === "dev@localhost"
      ? "Local development session"
      : "Authenticated dashboard session";
  const sections = getDashboardSections();

  const builtInConnectors = builtInConnectorsQuery.data ?? [];
  const installedIntegrationKeys = useMemo(
    () =>
      new Set(
        integrations.flatMap((integration) => {
          const builtInSlug =
            typeof integration.config.builtInSlug === "string"
              ? integration.config.builtInSlug.trim()
              : "";

          return [integration.key, builtInSlug].filter(Boolean);
        }),
      ),
    [integrations],
  );
  const connectorBySlug = useMemo(
    () =>
      new Map(
        builtInConnectors.map((connector) => [connector.slug, connector] as const),
      ),
    [builtInConnectors],
  );
  const availableConnectorCount = useMemo(
    () =>
      builtInConnectors.filter((connector) => !installedIntegrationKeys.has(connector.slug)).length,
    [builtInConnectors, installedIntegrationKeys],
  );
  const marketplaceConnectors = useMemo(() => {
    const normalizeRank = (connector: BuiltInConnectorOption) => {
      const explicitIndex = POPULAR_INTEGRATION_SLUGS.indexOf(
        connector.slug as (typeof POPULAR_INTEGRATION_SLUGS)[number],
      );
      return explicitIndex >= 0 ? explicitIndex : POPULAR_INTEGRATION_SLUGS.length + 1;
    };

    return [...builtInConnectors]
      .filter((connector) => !installedIntegrationKeys.has(connector.slug))
      .sort((left, right) => {
        const rankDelta = normalizeRank(left) - normalizeRank(right);
        return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
      })
      .filter((connector) => matchesConnectorSearch(connector, addIntegrationSearch))
      .slice(0, 5);
  }, [addIntegrationSearch, builtInConnectors, installedIntegrationKeys]);
  const resolveIntegrationLogoUrl = (integration: IntegrationSpec) => {
    const builtInSlug =
      typeof integration.config.builtInSlug === "string"
        ? integration.config.builtInSlug.trim()
        : "";
    const connector =
      connectorBySlug.get(builtInSlug) ?? connectorBySlug.get(integration.key.trim());

    if (connector) {
      return getConnectorLogoUrl(connector);
    }

    const appUrl =
      typeof integration.config.appUrl === "string"
        ? integration.config.appUrl.trim()
        : typeof integration.config.serverUrl === "string"
          ? integration.config.serverUrl.trim()
          : typeof integration.config.apiBaseUrl === "string"
            ? integration.config.apiBaseUrl.trim()
            : "";

    return getConnectorLogoUrl({ appUrl });
  };

  const openIntegrationWizard = (
    section: AdminSection,
    builtInSlug?: string,
  ) => {
    setShowIntegrationWizard(true);
    setActiveSection(section);
    router.push(
      buildAdminSectionHref(section, {
        showIntegrationWizard: "1",
        builtIn: builtInSlug,
      }),
    );
  };

  const handleIntegrationCreated = async (section: AdminSection) => {
    await invalidateAll();
    setShowIntegrationWizard(false);
    setActiveSection(section);
    router.push(buildAdminSectionHref(section));
  };

  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  const agentConnectionGuide = useMemo(
    () =>
      buildAgentConnectionGuide({
        baseUrl: contextApiBaseUrl,
        apiKey: "$OPENHANDS_CONTEXT_KEY",
        integrations,
      }),
    [contextApiBaseUrl, integrations],
  );
  const normalizedBaseUrl = contextApiBaseUrl.replace(/\/$/, "");
  const userOpenApiSchemaEndpoint = `${normalizedBaseUrl}/api/user/openapi`;
  const adminOpenApiSchemaEndpoint = `${normalizedBaseUrl}/api/admin/openapi`;
  const agentRestPromptExample =
    'I have provided you with an API key in $OPENHANDS_CONTEXT_LAYER_KEY, and you can see the API schema at ' +
    `${agentConnectionGuide.openApiSchemaEndpoint}, feel free to access any tools there.`;
  const userRestPromptExample =
    'I have provided you with a user API key in $OPENHANDS_CONTEXT_LAYER_USER_KEY, and you can see the API schema at ' +
    `${userOpenApiSchemaEndpoint}, feel free to manage my context-layer settings there.`;
  const adminRestPromptExample =
    'I have provided you with an admin API key in $OPENHANDS_CONTEXT_LAYER_ADMIN_KEY, and you can see the API schema at ' +
    `${adminOpenApiSchemaEndpoint}, feel free to manage admin QA and connector workflows there.`;

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
  const unusedCutoffDate = useMemo(
    () =>
      subtractUnusedWindow(
        new Date(),
        normalizedUnusedThresholdValue,
        unusedThresholdUnit,
      ),
    [normalizedUnusedThresholdValue, unusedThresholdUnit],
  );
  const unusedFunctionCandidates = useMemo(
    () =>
      integrations.flatMap((integration) =>
        Object.values(integration.functions)
          .filter((functionSpec) => getFunctionAccessMode(functionSpec) !== "disabled")
          .filter(
            (functionSpec) =>
              Boolean(functionSpec.lastInvokedAt) &&
              new Date(functionSpec.lastInvokedAt!).getTime() < unusedCutoffDate.getTime(),
          )
          .map((functionSpec) => ({
            integrationKey: integration.key,
            functionName: functionSpec.name,
            lastInvokedAt: functionSpec.lastInvokedAt as string,
          })),
      ),
    [integrations, unusedCutoffDate],
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

  const handleUnusedThresholdBlur = () => {
    setUnusedThresholdValue(String(normalizedUnusedThresholdValue));
  };

  const handleDisableUnusedFunctions = () => {
    if (unusedFunctionCandidates.length === 0) {
      setStatusMessage("No tracked functions matched the selected unused window.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Disable ${unusedFunctionCandidates.length} tracked ${unusedFunctionCandidates.length === 1 ? "function" : "functions"} that have not been used since ${unusedCutoffDate.toLocaleDateString()}?`,
      )
    ) {
      return;
    }

    bulkDisableMutation.mutate({
      thresholdValue: normalizedUnusedThresholdValue,
      thresholdUnit: unusedThresholdUnit,
    });
  };

  const handleDeleteIntegration = (integration: IntegrationSpec) => {
    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Delete the integration "${integration.name}"? This removes it from your personal dashboard and disconnects any saved credentials for this tool.`,
      )
    ) {
      return;
    }

    actionMutation.mutate({
      url: `/api/integrations/${integration.key}`,
      method: "DELETE",
      successMessage: `${integration.name} deleted.`,
    });
  };

  const setSelectedStateForApprovalRequests = (
    requestIds: string[],
    selected: boolean,
  ) => {
    setSelectedApprovalRequests((current) => {
      const next = { ...current };
      for (const requestId of requestIds) {
        if (selected) {
          next[requestId] = true;
        } else {
          delete next[requestId];
        }
      }
      return next;
    });
  };

  const handleApprovalDurationBlur = () => {
    setApprovalDurationHours(String(normalizedApprovalDurationHours));
  };

  const handleAccessRequestDecision = async (
    requestIds: string[],
    action: "approve" | "deny",
  ) => {
    if (requestIds.length === 0) {
      return;
    }

    setRequestActionPending(true);

    try {
      for (const requestId of requestIds) {
        await fetchJson(`/api/access-requests/${requestId}/${action === "approve" ? "approve" : "reject"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approver: approverIdentity,
            ...(action === "approve"
              ? {
                  durationMinutes: approvalHoursToMinutes(
                    normalizedApprovalDurationHours,
                  ),
                }
              : {}),
          }),
        });
      }

      setSelectedApprovalRequests((current) => {
        const next = { ...current };
        for (const requestId of requestIds) {
          delete next[requestId];
        }
        return next;
      });
      setStatusMessage(
        action === "approve"
          ? `Approved ${requestIds.length} request${requestIds.length === 1 ? "" : "s"}.`
          : `Denied ${requestIds.length} request${requestIds.length === 1 ? "" : "s"}.`,
      );
      await invalidateAll();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to update access request.",
      );
    } finally {
      setRequestActionPending(false);
    }
  };


  const handleCopyApiKey = async () => {
    if (!contextApiReady) {
      setStatusMessage("The agent key is not available yet.");
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

  const ensureUserApiKeyValue = async () => {
    const currentValue = userApiKeyValue.trim();
    if (currentValue) {
      return currentValue;
    }

    const current = await fetchJson<UserApiKeyResponse>("/api/user/key", {
      cache: "no-store",
    });
    setUserApiKeyStatus(current.key);

    if (current.apiKey) {
      setUserApiKeyValue(current.apiKey);
      return current.apiKey;
    }

    const rotated = await fetchJson<{
      apiKey: string;
      key: UserApiKeyStatus;
    }>("/api/user/key", {
      method: "POST",
    });

    setUserApiKeyStatus(rotated.key);
    setUserApiKeyValue(rotated.apiKey);
    setStatusMessage(
      current.hasKey
        ? "Regenerated your user automation key so the full value can be shown again. Update any existing clients using the previous key."
        : "Created a new user automation key. Save it somewhere secure because the full value is only shown when you explicitly reveal or copy it.",
    );
    return rotated.apiKey;
  };

  const ensureAdminApiKeyValue = async () => {
    const currentValue = adminApiKeyValue.trim();
    if (currentValue) {
      return currentValue;
    }

    const current = await fetchJson<AdminApiKeyResponse>("/api/admin/key", {
      cache: "no-store",
    });
    setAdminApiKeyStatus(current.key);

    if (current.apiKey) {
      setAdminApiKeyValue(current.apiKey);
      return current.apiKey;
    }

    const rotated = await fetchJson<{
      apiKey: string;
      key: AdminApiKeyStatus;
    }>("/api/admin/key", {
      method: "POST",
    });

    setAdminApiKeyStatus(rotated.key);
    setAdminApiKeyValue(rotated.apiKey);
    setStatusMessage(
      current.hasKey
        ? "Regenerated your admin automation key so the full value can be shown again. Update any existing clients using the previous key."
        : "Created a new admin automation key. Save it somewhere secure because the full value is only shown when you explicitly reveal or copy it.",
    );
    return rotated.apiKey;
  };

  const handleRevealUserApiKey = async () => {
    if (revealUserApiKey) {
      setRevealUserApiKey(false);
      return;
    }

    try {
      await ensureUserApiKeyValue();
      setRevealUserApiKey(true);
    } catch {
      setRevealUserApiKey(false);
      setStatusMessage("Unable to load the full user automation key right now.");
    }
  };

  const handleRevealAdminApiKey = async () => {
    if (revealAdminApiKey) {
      setRevealAdminApiKey(false);
      return;
    }

    try {
      await ensureAdminApiKeyValue();
      setRevealAdminApiKey(true);
    } catch {
      setRevealAdminApiKey(false);
      setStatusMessage("Unable to load the full admin automation key right now.");
    }
  };

  const handleCopyUserApiKey = async () => {
    try {
      const fullUserApiKey = await ensureUserApiKeyValue();
      await copyTextToClipboard(fullUserApiKey);
      setUserApiKeyCopied(true);
    } catch {
      setUserApiKeyCopied(false);
      setStatusMessage("Unable to copy the API key from this browser session.");
    }
  };

  const handleCopyAdminApiKey = async () => {
    try {
      const fullAdminApiKey = await ensureAdminApiKeyValue();
      await copyTextToClipboard(fullAdminApiKey);
      setAdminApiKeyCopied(true);
    } catch {
      setAdminApiKeyCopied(false);
      setStatusMessage("Unable to copy the API key from this browser session.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <DashboardSidebar
        badge={<Badge>{enabledIntegrationCount} live</Badge>}
        activeItem={activeSection}
        showAdminIntegrationsLink={isAdmin}
        footer={
          <DashboardSidebarUserPanel
            userName={userName}
            userEmail={userEmail}
            badges={[
              <Badge key="pending">{pendingAccessRequests.length} pending</Badge>,
              <Badge key="functions">{discoveredFunctionCount} functions</Badge>,
            ]}
            action={<DashboardSignOutButton />}
          />
        }
      />

      <div className="space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
              OpenHands Context Layer
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {activeSectionMeta.label}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{integrations.length} integrations</Badge>
            <Badge>{enabledIntegrationCount} enabled</Badge>
            <Badge>{pendingAccessRequests.length} pending approvals</Badge>
          </div>
        </header>

        {oauthStatusMessage || statusMessage ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text-active)]">
            {oauthStatusMessage || statusMessage}
          </div>
        ) : null}

        {!contextApiReady ? (
          <div className="rounded-xl border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] px-3 py-2 text-sm text-[var(--color-warning)]">
            Open <code className="text-white">/integrations</code> once to
            provision the agent key before agents call <code className="text-white">/api/context/*</code>.
          </div>
        ) : null}

        {activeSection === "profile" ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <CompactPanel title="User profile" icon={User}>
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

            <CompactPanel title="Connection context" icon={ShieldCheck}>
              <div className="divide-y divide-[var(--color-border)]">
                <KeyValueRow
                  label="Agent key status"
                  value={contextApiReady ? "Provisioned" : "Not available yet"}
                />
                <KeyValueRow label="Visible integrations" value={String(integrations.length)} />
                <KeyValueRow
                  label="Pending approvals"
                  value={String(pendingAccessRequests.length)}
                />
                <KeyValueRow
                  label="Endpoint pattern"
                  value={
                    <code className="break-all text-xs text-[var(--color-text-active)]">
                      {`${contextApiBaseUrl}/api/context/{integrationKey}/{functionName}`}
                    </code>
                  }
                />
              </div>
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                The agent key belongs to <code className="text-white">{userEmail}</code>. Provider credentials stay server-side in integration settings or per-user OAuth records and are never handed directly to the agent.
              </div>
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "caseByCaseApprovals" ? (
          <section className="space-y-4">
            <CompactPanel
              title="Case-by-case approvals"
              icon={CheckCircle2}
              action={<Badge>{filteredAccessRequests.length} shown</Badge>}
            >
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      Review pending agent approval requests
                    </h3>
                    <p className="text-xs leading-6 text-[var(--color-text-base)]">
                      Pending requests are auto-created when an agent attempts to
                      call a case-by-case tool without an active temporary grant.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge tone="warning">{approvalCounts.pending} pending</Badge>
                    <Badge tone="success">{approvalCounts.approved} approved</Badge>
                    <Badge tone="danger">{approvalCounts.denied} denied</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ["pending", approvalCounts.pending],
                    ["approved", approvalCounts.approved],
                    ["denied", approvalCounts.denied],
                  ] as const).map(([filter, count]) => (
                    <Button
                      key={filter}
                      type="button"
                      variant={approvalFilter === filter ? "secondary" : "ghost"}
                      className="h-9 rounded-md px-3 text-xs capitalize"
                      onClick={() => setApprovalFilter(filter)}
                    >
                      {filter} ({count})
                    </Button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <input
                    type="search"
                    value={approvalSearch}
                    onChange={(event) => setApprovalSearch(event.target.value)}
                    placeholder="Search case-by-case approvals"
                    aria-label="Search case-by-case approvals"
                    className={cn(inputClassName, "w-full xl:max-w-md")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={
                        approvalFilter !== "pending" ||
                        !hasVisibleApprovalRequests ||
                        allVisibleApprovalRequestsSelected
                      }
                      onClick={() =>
                        setSelectedStateForApprovalRequests(
                          filteredAccessRequests.map((request) => request.id),
                          true,
                        )
                      }
                    >
                      Select all matches
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={selectedApprovalRequestCount === 0}
                      onClick={() =>
                        setSelectedStateForApprovalRequests(
                          selectedApprovalRequestIds,
                          false,
                        )
                      }
                    >
                      Deselect matches
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        Decide selected requests
                      </p>
                      <p className="text-xs leading-6 text-[var(--color-text-base)]">
                        Approvals default to {DEFAULT_CASE_BY_CASE_APPROVAL_HOURS} hours and can last up to {MAX_CASE_BY_CASE_APPROVAL_HOURS} hours.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
                      <Badge>{selectedApprovalRequestCount} selected</Badge>
                      <label className="flex items-center gap-2">
                        <span>Duration</span>
                        <input
                          type="number"
                          min={1}
                          max={MAX_CASE_BY_CASE_APPROVAL_HOURS}
                          step={1}
                          value={approvalDurationHours}
                          onChange={(event) =>
                            setApprovalDurationHours(event.target.value)
                          }
                          onBlur={handleApprovalDurationBlur}
                          aria-label="Approval duration in hours"
                          className={cn(inputClassName, "h-9 w-24 px-3 py-2 text-sm")}
                        />
                        <span>hours</span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[var(--color-text-base)]">
                    If you want to approve for more than 100 hours, change the
                    setting to case-by-case on the <a href="/integrations" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">integrations page</a>.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={
                        approvalFilter !== "pending" ||
                        selectedApprovalRequestCount === 0 ||
                        requestActionPending
                      }
                      onClick={() =>
                        void handleAccessRequestDecision(
                          selectedApprovalRequestIds,
                          "approve",
                        )
                      }
                    >
                      Approve selected
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="h-9 rounded-md px-3 text-xs"
                      disabled={
                        approvalFilter !== "pending" ||
                        selectedApprovalRequestCount === 0 ||
                        requestActionPending
                      }
                      onClick={() =>
                        void handleAccessRequestDecision(
                          selectedApprovalRequestIds,
                          "deny",
                        )
                      }
                    >
                      Deny selected
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredAccessRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                      No {approvalFilter} approval requests match the current
                      search.
                    </div>
                  ) : (
                    filteredAccessRequests.map((request) => (
                      <div
                        key={request.id}
                        data-request-id={request.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex gap-3">
                            {request.status === "pending" ? (
                              <input
                                type="checkbox"
                                aria-label={`Select request ${request.id}`}
                                checked={Boolean(selectedApprovalRequests[request.id])}
                                onChange={(event) =>
                                  setSelectedStateForApprovalRequests(
                                    [request.id],
                                    event.currentTarget.checked,
                                  )
                                }
                                disabled={requestActionPending}
                                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)]"
                              />
                            ) : (
                              <span className="mt-1 h-4 w-4 shrink-0 rounded border border-transparent" />
                            )}
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">
                                  {request.integrationKey}.{request.functionName}
                                </p>
                                <Badge tone={approvalStatusTone(request.status)}>
                                  {approvalStatusLabel(request.status)}
                                </Badge>
                              </div>
                              <div className="grid gap-2 text-xs text-[var(--color-text-base)] sm:grid-cols-2 xl:grid-cols-3">
                                <p>
                                  Agent: <span className="text-white">{request.agentId}</span>
                                </p>
                                <p>
                                  Class: <span className="text-white">{request.agentClass}</span>
                                </p>
                                <p>
                                  Requested: <span className="text-white">{formatTimestamp(request.createdAt)}</span>
                                </p>
                                <p>
                                  Requested duration: <span className="text-white">{Math.max(1, Math.round(request.requestedMinutes / 60))}h</span>
                                </p>
                                <p>
                                  Decided by: <span className="text-white">{request.decidedBy ?? "—"}</span>
                                </p>
                                <p>
                                  Decided at: <span className="text-white">{formatTimestamp(request.decidedAt)}</span>
                                </p>
                              </div>
                              {request.justification ? (
                                <p className="text-xs leading-6 text-[var(--color-text-base)]">
                                  {request.justification}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2">
                                {request.scopes.length > 0 ? (
                                  request.scopes.map((scope) => (
                                    <Badge key={`${request.id}-${scope}`}>{scope}</Badge>
                                  ))
                                ) : (
                                  <Badge>default scopes</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {request.status === "pending" ? (
                            <div className="flex shrink-0 flex-col gap-2 xl:min-w-[170px]">
                              <Button
                                type="button"
                                className="h-9 rounded-md px-3 text-xs"
                                disabled={requestActionPending}
                                onClick={() =>
                                  void handleAccessRequestDecision(
                                    [request.id],
                                    "approve",
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                className="h-9 rounded-md px-3 text-xs"
                                disabled={requestActionPending}
                                onClick={() =>
                                  void handleAccessRequestDecision(
                                    [request.id],
                                    "deny",
                                  )
                                }
                              >
                                Deny
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CompactPanel>
          </section>
        ) : null}


        {activeSection === "integrations" ? (
          <section className="space-y-4">
            {showIntegrationWizard ? (
              <IntegrationWizard
                onCreated={() => handleIntegrationCreated("integrations")}
                onStatus={setStatusMessage}
                redirectSection="integrations"
              />
            ) : null}

            <CompactPanel title="Add integration" icon={PlugZap}>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
                    <Badge>{marketplaceConnectors.length} shown</Badge>
                    <Badge>{availableConnectorCount} available</Badge>
                  </div>
                  <input
                    type="search"
                    value={addIntegrationSearch}
                    onChange={(event) => setAddIntegrationSearch(event.target.value)}
                    placeholder="Search integrations"
                    aria-label="Search integrations"
                    className={cn(inputClassName, "w-full lg:max-w-md")}
                  />
                </div>

                <div className="mt-3 space-y-2.5">
                  {builtInConnectorsQuery.isPending ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                      Loading available integrations...
                    </div>
                  ) : builtInConnectorsQuery.isError ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                      {(builtInConnectorsQuery.error as Error).message}
                    </div>
                  ) : marketplaceConnectors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                      No popular integrations match the current search.
                    </div>
                  ) : (
                    marketplaceConnectors.map((connector) => (
                      <IntegrationMarketplaceCard
                        key={connector.slug}
                        connector={connector}
                        onClick={() =>
                          openIntegrationWizard("integrations", connector.slug)
                        }
                      />
                    ))
                  )}
                </div>

                <a
                  href="/admin-integrations"
                  className="mt-4 inline-flex text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  Can&apos;t find an integration you want? Click here.
                </a>
              </div>
            </CompactPanel>

            <CompactPanel title="Your integrations" icon={PlugZap}>
              {integrations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
                  No integrations activated yet. Use the section above to connect your first one.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white">
                          Search and review your integration skills
                        </h3>
                        <p className="text-xs leading-6 text-[var(--color-text-base)]">
                          Use the compact expandable rows here to search your active integrations, tune access modes, and hide disabled skills by default.
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
                              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3"
                              data-integration-key={integration.key}
                            >
                              <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                  <ConnectorLogo
                                    name={integration.name}
                                    logoUrl={resolveIntegrationLogoUrl(integration)}
                                    className="h-9 w-9 rounded-lg"
                                  />
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
                                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-base)]">
                                      {integration.key} · auth: {integration.authStrategy} · {visibleFunctions.length} visible skill
                                      {visibleFunctions.length === 1 ? "" : "s"}
                                      {functions.length > 0
                                        ? ` of ${functions.length}`
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                  <Button
                                    type="button"
                                    variant="danger"
                                    className="h-8 shrink-0 gap-2 rounded-md px-3 text-xs"
                                    disabled={actionMutation.isPending}
                                    onClick={() => handleDeleteIntegration(integration)}
                                    title="Remove this integration and any saved connection details from your personal dashboard."
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                  <Button
                                    variant={integration.enabled ? "secondary" : "primary"}
                                    className="h-8 shrink-0 gap-2 rounded-md px-3 text-xs"
                                    disabled={actionMutation.isPending}
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
                                                <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-base)]">
                                                  {formatTrackedUsage(functionSpec)}
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

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                    <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-6">
                      <div className="space-y-1 xl:max-w-2xl">
                        <h4 className="text-sm font-semibold text-white">
                          One-time bulk disable for unused skills
                        </h4>
                        <p className="text-xs leading-6 text-[var(--color-text-base)]">
                          Disable enabled skills with tracked usage that has been inactive since before {unusedCutoffDate.toLocaleDateString()}. Functions without tracked invocation history are skipped until new tracking data exists.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end md:gap-3 xl:flex-nowrap">
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                          <span>Unused for at least</span>
                          <input
                            type="number"
                            min={1}
                            max={3650}
                            inputMode="numeric"
                            value={unusedThresholdValue}
                            aria-label="Unused threshold value"
                            onChange={(event) =>
                              setUnusedThresholdValue(event.target.value)
                            }
                            onBlur={handleUnusedThresholdBlur}
                            className={cn(inputClassName, "w-28")}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                          <span>Window</span>
                          <select
                            value={unusedThresholdUnit}
                            aria-label="Unused threshold unit"
                            onChange={(event) =>
                              setUnusedThresholdUnit(
                                event.target.value as UnusedFunctionWindowUnit,
                              )
                            }
                            className={cn(inputClassName, "w-32")}
                          >
                            {UNUSED_FUNCTION_WINDOW_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <p className="text-xs text-[var(--color-text-base)]">
                            {unusedFunctionCandidates.length} skill
                            {unusedFunctionCandidates.length === 1 ? "" : "s"} matched
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 shrink-0 rounded-md px-4 text-xs"
                            onClick={handleDisableUnusedFunctions}
                            disabled={bulkDisableMutation.isPending}
                            aria-label="Disable unused functions"
                          >
                            Disable
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </CompactPanel>
          </section>
        ) : null}

        {activeSection === "apiKeys" ? (
          <section className="space-y-3">
            <CompactPanel title="API keys" icon={KeyRound}>
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Agent key</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-base)]">
                        Give this key to your agent.
                      </p>
                    </div>
                    <Badge tone={contextApiReady ? "success" : "warning"}>agent</Badge>
                  </div>
                  <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                    <code className="block break-all text-sm text-white">
                      {maskedApiKey || "No agent key available yet."}
                    </code>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
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
                      variant="secondary"
                      className="h-8 gap-2 rounded-md px-3 text-xs"
                      onClick={handleCopyApiKey}
                      disabled={!contextApiReady}
                      aria-label="Copy agent key"
                    >
                      {apiKeyCopied ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">User automation key</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-base)]">
                        Use this key to programmatically manage user-scoped context-layer settings.
                      </p>
                    </div>
                    <Badge tone={hasUserApiKey ? "warning" : "default"}>user</Badge>
                  </div>
                  <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                    <code className="block break-all text-sm text-white">
                      {maskedUserApiKey || "No user automation key yet. Reveal or copy to create one."}
                    </code>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="h-8 gap-2 rounded-md px-3 text-xs"
                      onClick={handleRevealUserApiKey}
                    >
                      {revealUserApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {revealUserApiKey ? "Hide" : "Reveal"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 gap-2 rounded-md px-3 text-xs"
                      onClick={handleCopyUserApiKey}
                      aria-label="Copy user automation key"
                    >
                      {userApiKeyCopied ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Admin automation key</h3>
                        <p className="mt-1 text-sm text-[var(--color-text-base)]">
                          Use this key for admin-only QA and operational automation surfaces.
                        </p>
                      </div>
                      <Badge tone={hasAdminApiKey ? "warning" : "default"}>admin</Badge>
                    </div>
                    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                      <code className="block break-all text-sm text-white">
                        {maskedAdminApiKey || "No admin automation key yet. Reveal or copy to create one."}
                      </code>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        className="h-8 gap-2 rounded-md px-3 text-xs"
                        onClick={handleRevealAdminApiKey}
                      >
                        {revealAdminApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        {revealAdminApiKey ? "Hide" : "Reveal"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 gap-2 rounded-md px-3 text-xs"
                        onClick={handleCopyAdminApiKey}
                        aria-label="Copy admin automation key"
                      >
                        {adminApiKeyCopied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </CompactPanel>

            <CompactPanel title="Connection details" icon={ShieldCheck}>
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-semibold text-white">Agent MCP</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                    Connect your MCP client to the streamable HTTP endpoint below and authenticate with the agent key.
                  </p>
                  <div className="mt-3 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="Endpoint"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpEndpoint}</code>}
                    />
                    <KeyValueRow
                      label="Example tool"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpToolName}</code>}
                    />
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      MCP config example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.mcpConfigExample}
                    </pre>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-semibold text-white">Agent REST API</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                    Give your agent the agent key and the OpenAPI schema for the tool surface.
                  </p>
                  <div className="mt-3 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="OpenAPI schema"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.openApiSchemaEndpoint}</code>}
                    />
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      Example agent prompt
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentRestPromptExample}
                    </pre>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-semibold text-white">User REST API</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                    Use the user automation key with the dashboard-equivalent OpenAPI schema.
                  </p>
                  <div className="mt-3 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="OpenAPI schema"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{userOpenApiSchemaEndpoint}</code>}
                    />
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      Example agent prompt
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {userRestPromptExample}
                    </pre>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                    <h3 className="text-sm font-semibold text-white">Admin REST API</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                      Use the admin automation key with the admin-only OpenAPI schema for connector, discovery, and approval QA.
                    </p>
                    <div className="mt-3 divide-y divide-[var(--color-border)]">
                      <KeyValueRow
                        label="OpenAPI schema"
                        value={<code className="break-all text-xs text-[var(--color-text-active)]">{adminOpenApiSchemaEndpoint}</code>}
                      />
                    </div>
                    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                      <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                        Example agent prompt
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                        {adminRestPromptExample}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </CompactPanel>
          </section>
        ) : null}
      </div>
    </div>
  );
};

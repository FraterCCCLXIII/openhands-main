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
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  accessModeLabel,
  AccessModeSlider,
  getFunctionAccessMode,
  matchesFunctionSearch,
} from "@/src/components/admin/function-access-controls";
import { IntegrationWizard } from "@/src/components/admin/integration-wizard";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  buildAdminSectionHref,
  getAdminSectionFromPath,
  type AdminSection,
} from "@/src/lib/admin-routes";
import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import { cn } from "@/src/lib/utils";
import type {
  AccessRequest,
  BuiltInConnectorOption,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationSpec,
  NotificationRecord,
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

interface AdminDashboardProps {
  initialIntegrations: IntegrationSpec[];
  initialAccessRequests: AccessRequest[];
  initialNotifications: NotificationRecord[];
  currentUser: { name?: string | null; email?: string | null };
  contextApiBaseUrl: string;
  contextApiKey: string;
  userApiKey?: UserApiKeyStatus | null;
  userApiKeyValue?: string | null;
  isAdmin?: boolean;
}

const getDashboardSections = (): Array<{
  id: AdminSection;
  label: string;
  icon: LucideIcon;
}> => [
  {
    id: "integrations",
    label: "Integrations",
    icon: PlugZap,
  },
  {
    id: "apiKeys",
    label: "Agent Connection",
    icon: KeyRound,
  },
  {
    id: "profile",
    label: "User Profile",
    icon: User,
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
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, boolean>
  >({});
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

  const navigateToSection = (section: AdminSection) => {
    setActiveSection(section);
    router.push(buildAdminSectionHref(section));
  };

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

  const integrations = integrationsQuery.data ?? [];
  const accessRequests = accessRequestsQuery.data ?? [];

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
  const userApiKeyReady = userApiKeyStatus !== null;
  const userApiKeyVisibleInSession = userApiKeyValue.trim().length > 0;
  const maskedUserApiKey = userApiKeyValue
    ? maskApiKey(userApiKeyValue, revealUserApiKey)
    : userApiKeyStatus
      ? maskStoredApiKey(userApiKeyStatus.keyPrefix, userApiKeyStatus.keySuffix)
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

  const handleCopyApiKey = async () => {
    if (!contextApiReady) {
      setStatusMessage("The restricted agent API key is not available yet.");
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

  const handleCopyUserApiKey = async () => {
    if (!userApiKeyValue) {
      setStatusMessage(
        "The full user automation key is only shown when it is first issued in this session.",
      );
      return;
    }

    try {
      await copyTextToClipboard(userApiKeyValue);
      setUserApiKeyCopied(true);
    } catch {
      setUserApiKeyCopied(false);
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
          </div>

          <nav className="space-y-1">
            {sections.map((section) => (
              <SidebarNavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => navigateToSection(section.id)}
              />
            ))}
          </nav>

          {isAdmin ? (
            <div className="border-t border-[var(--color-border)] pt-3">
              <a
                href="/admin-integrations"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-text-base)] transition-colors hover:bg-[var(--color-bg-active)] hover:text-white"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-text-base)]" />
                <span className="truncate font-medium">Admin integrations</span>
              </a>
            </div>
          ) : null}

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
            provision the restricted agent key before agents call <code className="text-white">/api/context/*</code>.
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
                The restricted agent key belongs to <code className="text-white">{userEmail}</code>. Provider credentials stay server-side in integration settings or per-user OAuth records and are never handed directly to the agent.
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
            <CompactPanel title="API keys" icon={KeyRound}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Restricted agent key</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-base)]">
                        Give this key to your agent.
                      </p>
                    </div>
                    <Badge tone={contextApiReady ? "success" : "warning"}>agent</Badge>
                  </div>
                  <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                    <code className="block break-all text-sm text-white">
                      {maskedApiKey || "No restricted agent key available yet."}
                    </code>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[var(--color-text-base)]">
                    Works with <code className="text-white">/api/context/*</code> and <code className="text-white">/api/mcp</code>.
                  </p>
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
                      aria-label="Copy restricted agent key"
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
                        Use this key to programmatically set up APIs in the context layer.
                      </p>
                    </div>
                    <Badge tone={userApiKeyReady ? "warning" : "default"}>user</Badge>
                  </div>
                  <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
                    <code className="block break-all text-sm text-white">
                      {maskedUserApiKey || "No user automation key available yet."}
                    </code>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[var(--color-text-base)]">
                    Works with <code className="text-white">/api/user/*</code>.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="h-8 gap-2 rounded-md px-3 text-xs"
                      onClick={() => setRevealUserApiKey((current) => !current)}
                      disabled={!userApiKeyVisibleInSession}
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
                      disabled={!userApiKeyVisibleInSession}
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
              </div>
            </CompactPanel>

            <CompactPanel title="Connection details" icon={ShieldCheck}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-semibold text-white">MCP</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                    Connect your MCP client to the streamable HTTP endpoint below and authenticate with the restricted agent key.
                  </p>
                  <div className="mt-4 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="Endpoint"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpEndpoint}</code>}
                    />
                    <KeyValueRow
                      label="Example tool"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.mcpToolName}</code>}
                    />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      MCP config example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.mcpConfigExample}
                    </pre>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-semibold text-white">REST API</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
                    Call context-layer tool routes directly over HTTPS with the restricted agent key.
                  </p>
                  <div className="mt-4 divide-y divide-[var(--color-border)]">
                    <KeyValueRow
                      label="Tool endpoint"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.endpoint}</code>}
                    />
                    <KeyValueRow
                      label="OpenAPI schema"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.openApiSchemaEndpoint}</code>}
                    />
                    <KeyValueRow
                      label="SKILL export"
                      value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentConnectionGuide.skillEndpoint}</code>}
                    />
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                      cURL example
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
                      {agentConnectionGuide.curlExample}
                    </pre>
                  </div>
                </div>
              </div>
            </CompactPanel>
          </section>
        ) : null}
      </div>
    </div>
  );
};

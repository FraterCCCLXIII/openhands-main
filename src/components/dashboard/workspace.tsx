"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";
import { ApprovalsSection } from "@/src/components/dashboard/sections/approvals-section";
import { IntegrationsSection } from "@/src/components/dashboard/sections/integrations-section";
import { ProfileSection } from "@/src/components/dashboard/sections/profile-section";
import { getConnectorLogoUrl } from "@/src/components/dashboard/shared";
import {
  buildConnectorMap,
  buildToolAccessPatch,
  buildInstalledIntegrationKeys,
  buildMarketplaceConnectors,
  buildUnusedToolCandidates,
  countApprovalRequestsByStatus,
  filterIntegrationsForDisplay,
  matchesAccessRequestFilter,
  matchesAccessRequestSearch,
  resolveIntegrationLogoUrl,
  subtractUnusedWindow,
  type ApprovalRequestFilter,
} from "@/src/components/dashboard/utils";
import {
  DashboardSidebar,
  DashboardSidebarUserPanel,
  getDashboardSections,
} from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { useApiKeys } from "@/src/components/dashboard/hooks/use-api-keys";
import { Badge } from "@/src/components/ui/badge";
import {
  buildAdminSectionHref,
  getAdminSectionFromPath,
  type AdminSection,
} from "@/src/lib/admin-routes";
import {
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  approvalHoursToMinutes,
  normalizeApprovalDurationHours,
} from "@/src/lib/access-requests";
import { buildAgentConnectionGuide } from "@/src/lib/agent-connection";
import type {
  AccessRequest,
  AdminApiKeyStatus,
  BuiltInConnectorOption,
  DisableUnusedFunctionsResult,
  ToolAccessMode,
  IntegrationSpec,
  NotificationRecord,
  UnusedToolWindowUnit,
  UserApiKeyStatus,
} from "@/src/types/context-layer";

interface DashboardWorkspaceProps {
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
}: DashboardWorkspaceProps) => {
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
  const [hideDisabledTools, setHideDisabledTools] = useState(true);
  const [unusedThresholdValue, setUnusedThresholdValue] = useState("30");
  const [unusedThresholdUnit, setUnusedThresholdUnit] =
    useState<UnusedToolWindowUnit>("days");
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
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
      thresholdUnit: UnusedToolWindowUnit;
    }) =>
      fetchJson<DisableUnusedFunctionsResult>("/api/integrations/disable-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (result) => {
      setStatusMessage(
        result.disabledCount > 0
          ? `Disabled ${result.disabledCount} tracked ${result.disabledCount === 1 ? "tool" : "tools"} unused since ${new Date(result.cutoffIso).toLocaleDateString()}.`
          : "No tracked tools matched the selected unused window.",
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
    () => countApprovalRequestsByStatus(accessRequests),
    [accessRequests],
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
  const discoveredToolCount = integrations.reduce(
    (count, integration) => count + Object.keys(integration.functions).length,
    0,
  );
  const pendingAccessRequests = accessRequests.filter(
    (request) => request.status === "pending",
  );

  const { contextApiReady, agentKey, userKey, adminKey } = useApiKeys({
    contextApiKey,
    userApiKey,
    userApiKeyValue: initialUserApiKeyValue,
    adminApiKey,
    adminApiKeyValue: initialAdminApiKeyValue,
    onStatus: setStatusMessage,
  });

  const userName = currentUser.name?.trim() || "Admin User";
  const userEmail = currentUser.email?.trim() || "Not provided";
  const authMode =
    currentUser.email === "dev@localhost"
      ? "Local development session"
      : "Authenticated dashboard session";
  const sections = getDashboardSections();
  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  const builtInConnectors = builtInConnectorsQuery.data ?? [];
  const installedIntegrationKeys = useMemo(
    () => buildInstalledIntegrationKeys(integrations),
    [integrations],
  );
  const connectorBySlug = useMemo(
    () => buildConnectorMap(builtInConnectors),
    [builtInConnectors],
  );
  const availableConnectorCount = useMemo(
    () =>
      builtInConnectors.filter(
        (connector) => !installedIntegrationKeys.has(connector.slug),
      ).length,
    [builtInConnectors, installedIntegrationKeys],
  );
  const marketplaceConnectors = useMemo(
    () =>
      buildMarketplaceConnectors({
        builtInConnectors,
        installedIntegrationKeys,
        search: addIntegrationSearch,
      }),
    [addIntegrationSearch, builtInConnectors, installedIntegrationKeys],
  );

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
    "I have provided you with an API key in $OPENHANDS_CONTEXT_LAYER_KEY, and you can see the API schema at " +
    `${agentConnectionGuide.openApiSchemaEndpoint}, feel free to access any tools there.`;
  const userRestPromptExample =
    "I have provided you with a user API key in $OPENHANDS_CONTEXT_LAYER_USER_KEY, and you can see the API schema at " +
    `${userOpenApiSchemaEndpoint}, feel free to manage my context-layer settings there.`;
  const adminRestPromptExample =
    "I have provided you with an admin API key in $OPENHANDS_CONTEXT_LAYER_ADMIN_KEY, and you can see the API schema at " +
    `${adminOpenApiSchemaEndpoint}, feel free to manage admin QA and connector workflows there.`;

  const filteredIntegrations = useMemo(
    () =>
      filterIntegrationsForDisplay({
        integrations,
        integrationSearch,
        hideDisabledTools,
      }),
    [hideDisabledTools, integrationSearch, integrations],
  );
  const visibleToolCount = filteredIntegrations.reduce(
    (count, entry) => count + entry.visibleTools.length,
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
  const unusedToolCandidates = useMemo(
    () =>
      buildUnusedToolCandidates({
        integrations,
        cutoffDate: unusedCutoffDate,
      }),
    [integrations, unusedCutoffDate],
  );

  const openIntegrationWizard = (builtInSlug?: string) => {
    setShowIntegrationWizard(true);
    setActiveSection("integrations");
    router.push(
      buildAdminSectionHref("integrations", {
        showIntegrationWizard: "1",
        builtIn: builtInSlug,
      }),
    );
  };

  const handleIntegrationCreated = async () => {
    await invalidateAll();
    setShowIntegrationWizard(false);
    setActiveSection("integrations");
    router.push(buildAdminSectionHref("integrations"));
  };

  const toggleIntegrationExpanded = (
    integrationKey: string,
    expanded: boolean,
  ) => {
    setExpandedIntegrations((current) => ({
      ...current,
      [integrationKey]: !expanded,
    }));
  };

  const toggleToolExpanded = (toolKey: string) => {
    setExpandedTools((current) => ({
      ...current,
      [toolKey]: !current[toolKey],
    }));
  };

  const updateToolAccessMode = (
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) => {
    actionMutation.mutate(
      buildToolAccessPatch(integrationKey, toolName, accessMode),
    );
  };

  const handleUnusedThresholdBlur = () => {
    setUnusedThresholdValue(String(normalizedUnusedThresholdValue));
  };

  const handleDisableUnusedTools = () => {
    if (unusedToolCandidates.length === 0) {
      setStatusMessage("No tracked tools matched the selected unused window.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Disable ${unusedToolCandidates.length} tracked ${unusedToolCandidates.length === 1 ? "tool" : "tools"} that have not been used since ${unusedCutoffDate.toLocaleDateString()}?`,
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
        await fetchJson(
          `/api/access-requests/${requestId}/${action === "approve" ? "approve" : "reject"}`,
          {
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
          },
        );
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

  const handleToggleIntegrationEnabled = (integration: IntegrationSpec) => {
    actionMutation.mutate({
      url: `/api/integrations/${integration.key}/toggle`,
      method: "POST",
      body: { enabled: !integration.enabled },
    });
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
              <Badge key="functions">{discoveredToolCount} tools</Badge>,
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
            Open <code className="text-white">/integrations</code> once to provision
            the agent key before agents call <code className="text-white">/api/context/*</code>.
          </div>
        ) : null}

        {activeSection === "profile" ? (
          <ProfileSection
            userName={userName}
            userEmail={userEmail}
            authMode={authMode}
            contextApiBaseUrl={contextApiBaseUrl}
            contextApiReady={contextApiReady}
            integrationCount={integrations.length}
            pendingAccessRequestCount={pendingAccessRequests.length}
          />
        ) : null}

        {activeSection === "caseByCaseApprovals" ? (
          <ApprovalsSection
            approvalCounts={approvalCounts}
            approvalDurationHours={approvalDurationHours}
            approvalFilter={approvalFilter}
            approvalSearch={approvalSearch}
            allVisibleApprovalRequestsSelected={allVisibleApprovalRequestsSelected}
            filteredAccessRequests={filteredAccessRequests}
            handleAccessRequestDecision={handleAccessRequestDecision}
            handleApprovalDurationBlur={handleApprovalDurationBlur}
            hasVisibleApprovalRequests={hasVisibleApprovalRequests}
            requestActionPending={requestActionPending}
            selectedApprovalRequestCount={selectedApprovalRequestCount}
            selectedApprovalRequestIds={selectedApprovalRequestIds}
            selectedApprovalRequests={selectedApprovalRequests}
            setApprovalDurationHours={setApprovalDurationHours}
            setApprovalFilter={setApprovalFilter}
            setApprovalSearch={setApprovalSearch}
            setSelectedStateForApprovalRequests={setSelectedStateForApprovalRequests}
          />
        ) : null}

        {activeSection === "integrations" ? (
          <IntegrationsSection
            addIntegrationSearch={addIntegrationSearch}
            availableConnectorCount={availableConnectorCount}
            builtInConnectorsError={
              builtInConnectorsQuery.isError
                ? (builtInConnectorsQuery.error as Error).message
                : null
            }
            builtInConnectorsPending={builtInConnectorsQuery.isPending}
            expandedTools={expandedTools}
            expandedIntegrations={expandedIntegrations}
            filteredIntegrations={filteredIntegrations}
            handleDeleteIntegration={handleDeleteIntegration}
            handleDisableUnusedTools={handleDisableUnusedTools}
            hideDisabledTools={hideDisabledTools}
            integrationCount={integrations.length}
            integrationSearch={integrationSearch}
            isActionPending={actionMutation.isPending}
            isBulkDisablePending={bulkDisableMutation.isPending}
            marketplaceConnectors={marketplaceConnectors}
            onCreated={handleIntegrationCreated}
            onOpenIntegrationWizard={openIntegrationWizard}
            onStatus={setStatusMessage}
            onToggleToolExpanded={toggleToolExpanded}
            onToggleIntegrationEnabled={handleToggleIntegrationEnabled}
            onToggleIntegrationExpanded={toggleIntegrationExpanded}
            onUpdateToolAccessMode={updateToolAccessMode}
            onUnusedThresholdBlur={handleUnusedThresholdBlur}
            onUnusedThresholdUnitChange={setUnusedThresholdUnit}
            onUnusedThresholdValueChange={setUnusedThresholdValue}
            resolveIntegrationLogoUrl={(integration) =>
              resolveIntegrationLogoUrl({
                integration,
                connectorBySlug,
                getConnectorLogoUrl,
              })
            }
            setAddIntegrationSearch={setAddIntegrationSearch}
            setHideDisabledTools={setHideDisabledTools}
            setIntegrationSearch={setIntegrationSearch}
            showIntegrationWizard={showIntegrationWizard}
            unusedCutoffDateLabel={unusedCutoffDate.toLocaleDateString()}
            unusedToolCandidateCount={unusedToolCandidates.length}
            unusedThresholdUnit={unusedThresholdUnit}
            unusedThresholdValue={unusedThresholdValue}
            visibleToolCount={visibleToolCount}
          />
        ) : null}

        {activeSection === "apiKeys" ? (
          <AgentConnectionSection
            adminKey={{
              copied: adminKey.copied,
              handleCopy: adminKey.handleCopy,
              handleReveal: adminKey.handleReveal,
              hasKey: adminKey.hasKey,
              maskedValue: adminKey.maskedValue,
              revealed: adminKey.revealed,
            }}
            adminPromptExample={adminRestPromptExample}
            adminSchemaEndpoint={adminOpenApiSchemaEndpoint}
            agentKey={agentKey}
            agentMcpConfigExample={agentConnectionGuide.mcpConfigExample}
            agentMcpEndpoint={agentConnectionGuide.mcpEndpoint}
            agentMcpToolName={agentConnectionGuide.mcpToolName}
            agentOpenApiSchemaEndpoint={agentConnectionGuide.openApiSchemaEndpoint}
            agentRestPromptExample={agentRestPromptExample}
            contextApiReady={contextApiReady}
            isAdmin={isAdmin}
            userKey={{
              copied: userKey.copied,
              handleCopy: userKey.handleCopy,
              handleReveal: userKey.handleReveal,
              hasKey: userKey.hasKey,
              maskedValue: userKey.maskedValue,
              revealed: userKey.revealed,
            }}
            userOpenApiSchemaEndpoint={userOpenApiSchemaEndpoint}
            userRestPromptExample={userRestPromptExample}
          />
        ) : null}
      </div>
    </div>
  );
};

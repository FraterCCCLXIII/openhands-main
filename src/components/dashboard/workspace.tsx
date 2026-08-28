"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { RequestIntegrationModal } from "@/src/components/integrations/request-integration-modal";
import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";
import { ApprovalsSection } from "@/src/components/dashboard/sections/approvals-section";
import { IntegrationsSection } from "@/src/components/dashboard/sections/integrations-section";
import { ProfileSection } from "@/src/components/dashboard/sections/profile-section";
import {
  buildInstalledIntegrationKeys,
  buildInstalledManagedConnectorSlugs,
  buildSuggestedIntegrationKey,
} from "@/src/components/dashboard/utils";
import { useApiKeys } from "@/src/components/dashboard/hooks/use-api-keys";
import { useApprovalsSection } from "@/src/components/dashboard/hooks/use-approvals-section";
import { useIntegrationsSection } from "@/src/components/dashboard/hooks/use-integrations-section";
import { usePermissionProfilesSection } from "@/src/components/dashboard/hooks/use-permission-profiles-section";
import {
  buildAdminSectionHref,
  getAdminSectionFromPath,
  type AdminSection,
} from "@/src/lib/admin-routes";
import { buildAgentConnectionGuide, OPENHANDS_AGENT_KEY_ENV } from "@/src/shared/agent-connection";
import { AGENT_CONNECTION_PAGE_COPY } from "@/src/constants/agent-connection-page";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { apiUrl } from "@/src/shared/paths";
import type {
  AccessRequest,
  AdminApiKeyStatus,
  IntegrationSpec,
  UserApiKeyStatus,
} from "@/src/types/integrations-hub";
import {
  safeAnalyticsIdentifier,
  useTracking,
} from "@/src/hooks/use-tracking";
import { reportStatusMessage } from "@/src/utils/custom-toast-handlers";

interface DashboardWorkspaceProps {
  initialIntegrations?: IntegrationSpec[];
  initialAccessRequests?: AccessRequest[];
  currentUser: { name?: string | null; email?: string | null };
  agentApiBaseUrl: string;
  agentApiKey: string;
  userApiKey?: UserApiKeyStatus | null;
  adminApiKey?: AdminApiKeyStatus | null;
  isAdmin?: boolean;
}

export const DashboardWorkspace = ({
  initialIntegrations = [],
  initialAccessRequests = [],
  currentUser,
  agentApiBaseUrl,
  agentApiKey,
  userApiKey = null,
  adminApiKey = null,
  isAdmin = true,
}: DashboardWorkspaceProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { track } = useTracking();
  const trackedOAuthReturnRef = useRef<string | null>(null);
  const trackedViewRef = useRef(false);
  const [activeSection, setActiveSection] = useState<AdminSection>(() =>
    getAdminSectionFromPath(pathname),
  );
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(false);
  const [showRequestIntegration, setShowRequestIntegration] = useState(false);
  const [connectionDetailsOpen, setConnectionDetailsOpen] = useState(false);

  const oauthStatus = useMemo(() => {
    const oauthStatusValue = searchParams.get("oauth_status");
    const oauthProvider = searchParams.get("oauth_provider");
    const oauthError = searchParams.get("oauth_error");

    if (oauthStatusValue === "connected" && oauthProvider) {
      return {
        tone: "success" as const,
        message: `${oauthProvider[0]?.toUpperCase() ?? ""}${oauthProvider.slice(1)} connected successfully. Finish saving the integration to use it.`,
      };
    }

    if (oauthStatusValue === "error") {
      return {
        tone: "error" as const,
        message: oauthError || "OAuth connection failed.",
      };
    }

    return null;
  }, [searchParams]);

  const oauthStatusMessage = oauthStatus?.message ?? null;

  useEffect(() => {
    setActiveSection(getAdminSectionFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    setShowIntegrationWizard(searchParams.get("showIntegrationWizard") === "1");
  }, [searchParams]);

  // Shared counts for the sidebar/header badges. These queries own the
  // canonical cache for integrations/access-requests; the section hooks
  // reuse the same query keys so there is one fetch per endpoint per mount.
  // `initialData` lets tests seed synchronous data; production leaves it
  // empty so the single fetch populates the cache. `initialDataUpdatedAt: 0`
  // marks the seed as stale so a background refetch fires immediately on
  // mount — otherwise the empty production seed would suppress the fetch for
  // `staleTime` and already-installed integrations would render only in the
  // "Available integrations" marketplace until a manual action invalidated the query.
  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
  });
  const accessRequestsQuery = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<AccessRequest[]>("/api/case-by-case-approvals"),
    initialData: initialAccessRequests,
    initialDataUpdatedAt: 0,
    enabled: activeSection === "caseByCaseApprovals",
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });

  const integrations = integrationsQuery.data ?? [];
  const accessRequests = accessRequestsQuery.data ?? initialAccessRequests;
  const enabledIntegrationCount = integrations.filter(
    (integration) => integration.enabled,
  ).length;
  const discoveredToolCount = integrations.reduce(
    (count, integration) => count + Object.keys(integration.tools).length,
    0,
  );
  const pendingAccessRequests = accessRequests.filter(
    (request) => request.status === "pending",
  );

  useEffect(() => {
    if (trackedViewRef.current || !integrationsQuery.isFetched) {
      return;
    }
    trackedViewRef.current = true;
    track("integrations_hub_viewed", {
      integration_count: integrations.length,
      enabled_integration_count: enabledIntegrationCount,
      tool_count: discoveredToolCount,
    });
  }, [
    discoveredToolCount,
    enabledIntegrationCount,
    integrations.length,
    integrationsQuery.isFetched,
    track,
  ]);

  useEffect(() => {
    const outcome = searchParams.get("oauth_status");
    if (outcome !== "connected" && outcome !== "error") {
      return;
    }
    const connectorSlug = safeAnalyticsIdentifier(searchParams.get("oauth_provider"));
    const eventKey = `${outcome}:${connectorSlug ?? "unknown"}`;
    if (trackedOAuthReturnRef.current === eventKey) {
      return;
    }
    trackedOAuthReturnRef.current = eventKey;
    track("integration_oauth_completed", {
      connector_slug: connectorSlug,
      outcome,
    });
    if (outcome === "error") {
      track("integration_setup_failed", {
        stage: "oauth_callback",
        integration_kind: "managed",
        connector_slug: connectorSlug,
      });
    }
  }, [searchParams, track]);

  const { agentApiReady, userKey, adminKey } = useApiKeys({
    agentApiKey,
    userApiKey,
    adminApiKey,
    onStatus: reportStatusMessage,
  });

  const userName = currentUser.name?.trim() || "Admin User";
  const userEmail = currentUser.email?.trim() || "Not provided";
  const authMode =
    currentUser.email === "dev@localhost"
      ? "Local development session"
      : "Authenticated dashboard session";

  const integrationsSection = useIntegrationsSection({
    initialIntegrations,
    enabled: activeSection === "integrations",
    onStatus: reportStatusMessage,
  });

  const approvalsSection = useApprovalsSection({
    initialAccessRequests,
    enabled: activeSection === "caseByCaseApprovals",
    onStatus: reportStatusMessage,
  });

  const permissionProfilesSection = usePermissionProfilesSection({
    enabled: activeSection === "apiKeys",
    onStatus: reportStatusMessage,
  });

  const installedIntegrationKeys = useMemo(
    () => buildInstalledIntegrationKeys(integrations),
    [integrations],
  );
  const connectedConnectorCount = useMemo(
    () => buildInstalledManagedConnectorSlugs(integrations).size,
    [integrations],
  );

  const agentConnectionGuide = useMemo(
    () =>
      buildAgentConnectionGuide({
        baseUrl: agentApiBaseUrl,
        apiKey: OPENHANDS_AGENT_KEY_ENV,
        integrations,
      }),
    [agentApiBaseUrl, integrations],
  );
  const normalizedBaseUrl = agentApiBaseUrl.replace(/\/$/, "");
  const userOpenApiSchemaEndpoint = apiUrl(normalizedBaseUrl, "/api/user/openapi");
  const adminOpenApiSchemaEndpoint = apiUrl(normalizedBaseUrl, "/api/admin/openapi");
  const agentRestPromptExample =
    "I have provided you with an API key in $OPENHANDS_INTEGRATIONS_HUB_KEY, and you can see the API schema at " +
    `${agentConnectionGuide.openApiSchemaEndpoint}, feel free to access any tools there.`;
  const userRestPromptExample =
    "I have provided you with a user API key in $OPENHANDS_INTEGRATIONS_HUB_USER_KEY, and you can see the API schema at " +
    `${userOpenApiSchemaEndpoint}, feel free to manage my integrations-hub settings there.`;
  const adminRestPromptExample =
    "I have provided you with an admin API key in $OPENHANDS_INTEGRATIONS_HUB_ADMIN_KEY, and you can see the API schema at " +
    `${adminOpenApiSchemaEndpoint}, feel free to manage admin QA and connector workflows there.`;

  const openIntegrationWizard = (managedConnectorSlug?: string) => {
    const suggestedIntegrationKey = managedConnectorSlug
      ? buildSuggestedIntegrationKey(managedConnectorSlug, installedIntegrationKeys)
      : undefined;

    track("integration_setup_started", {
      source: managedConnectorSlug ? "catalog" : "manual",
      connector_slug: managedConnectorSlug,
    });

    setActiveSection("integrations");
    router.push(
      buildAdminSectionHref("integrations", {
        showIntegrationWizard: "1",
        kind: managedConnectorSlug ? undefined : "mcp",
        managedConnector: managedConnectorSlug,
        integrationKey:
          suggestedIntegrationKey && suggestedIntegrationKey !== managedConnectorSlug
            ? suggestedIntegrationKey
            : undefined,
      }),
    );
  };

  const closeIntegrationWizard = () => {
    setShowIntegrationWizard(false);
    setActiveSection("integrations");
    router.push(buildAdminSectionHref("integrations"));
  };

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["permission-profiles"] }),
    ]);
  };

  const handleIntegrationCreated = async () => {
    await invalidateAll();
    setShowIntegrationWizard(false);
    setActiveSection("integrations");
    router.push(buildAdminSectionHref("integrations"));
  };

  return (
    <DashboardShell
      activeSection={activeSection}
      isAdmin={isAdmin}
      userName={userName}
      userEmail={userEmail}
      enabledIntegrationCount={enabledIntegrationCount}
      discoveredToolCount={discoveredToolCount}
      oauthStatusMessage={oauthStatusMessage}
      showOAuthStatus={!showIntegrationWizard}
      agentApiReady={agentApiReady}
      onRequestIntegration={() => setShowRequestIntegration(true)}
      headerDescription={
        activeSection === "apiKeys" ? (
          <>
            Manage API keys, saved permission profiles, and automations.{" "}
            <button
              type="button"
              data-testid="agent-connection-details-link"
              onClick={() => setConnectionDetailsOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0 text-sm text-white underline-offset-2 hover:underline"
            >
              {AGENT_CONNECTION_PAGE_COPY.connectionDetailsLink}
            </button>
          </>
        ) : undefined
      }
    >
      {activeSection === "profile" ? (
        <ProfileSection
          userName={userName}
          userEmail={userEmail}
          authMode={authMode}
          agentApiBaseUrl={agentApiBaseUrl}
          agentApiReady={agentApiReady}
          integrationCount={integrations.length}
          pendingAccessRequestCount={pendingAccessRequests.length}
        />
      ) : null}

      {activeSection === "caseByCaseApprovals" ? (
        <ApprovalsSection {...approvalsSection} />
      ) : null}

      {activeSection === "integrations" ? (
        <IntegrationsSection
          {...integrationsSection}
          connectedConnectorCount={connectedConnectorCount}
          existingIntegrationKeys={installedIntegrationKeys}
          integrations={integrations}
          isAdmin={isAdmin}
          oauthStatus={oauthStatus}
          onCloseIntegrationWizard={closeIntegrationWizard}
          onCreated={handleIntegrationCreated}
          onOpenIntegrationWizard={openIntegrationWizard}
          onStatus={reportStatusMessage}
          showIntegrationWizard={showIntegrationWizard}
        />
      ) : null}

      {showRequestIntegration ? (
        <RequestIntegrationModal
          onClose={() => setShowRequestIntegration(false)}
          onSubmitted={() => {
            setShowRequestIntegration(false);
            reportStatusMessage(INTEGRATIONS_PAGE_COPY.requestIntegrationSuccess);
          }}
        />
      ) : null}

      {activeSection === "apiKeys" ? (
        <AgentConnectionSection
          connectionDetailsOpen={connectionDetailsOpen}
          onConnectionDetailsOpenChange={setConnectionDetailsOpen}
          adminKey={{
            copied: adminKey.copied,
            handleCopy: adminKey.handleCopy,
            handleReveal: adminKey.handleReveal,
            handleRotate: adminKey.handleRotate,
            hasKey: adminKey.hasKey,
            maskedValue: adminKey.maskedValue,
            revealed: adminKey.revealed,
          }}
          adminPromptExample={adminRestPromptExample}
          adminSchemaEndpoint={adminOpenApiSchemaEndpoint}
          agentMcpConfigExample={agentConnectionGuide.mcpConfigExample}
          agentMcpEndpoint={agentConnectionGuide.mcpEndpoint}
          agentMcpToolName={agentConnectionGuide.mcpToolName}
          agentOpenApiSchemaEndpoint={agentConnectionGuide.openApiSchemaEndpoint}
          agentRestPromptExample={agentRestPromptExample}
          isAdmin={isAdmin}
          actionPending={permissionProfilesSection.actionPending}
          isSaveModalOpen={permissionProfilesSection.isSaveModalOpen}
          onCloseSaveModal={permissionProfilesSection.onCloseSaveModal}
          onOpenSaveModal={permissionProfilesSection.onOpenSaveModal}
          onSaveProfile={permissionProfilesSection.onSaveProfile}
          onLoadProfile={permissionProfilesSection.onLoadProfile}
          onUpdateProfile={permissionProfilesSection.onUpdateProfile}
          onDeleteProfile={permissionProfilesSection.onDeleteProfile}
          permissionProfiles={permissionProfilesSection.profiles}
          permissionProfilesLoading={permissionProfilesSection.isPending}
          permissionProfilesError={permissionProfilesSection.errorMessage}
          userKey={{
            copied: userKey.copied,
            handleCopy: userKey.handleCopy,
            handleReveal: userKey.handleReveal,
            handleRotate: userKey.handleRotate,
            hasKey: userKey.hasKey,
            maskedValue: userKey.maskedValue,
            revealed: userKey.revealed,
          }}
          userOpenApiSchemaEndpoint={userOpenApiSchemaEndpoint}
          userRestPromptExample={userRestPromptExample}
        />
      ) : null}
    </DashboardShell>
  );
};

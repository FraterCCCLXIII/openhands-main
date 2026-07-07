"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";
import { ApprovalsSection } from "@/src/components/dashboard/sections/approvals-section";
import { IntegrationsSection } from "@/src/components/dashboard/sections/integrations-section";
import { PermissionProfilesSection } from "@/src/components/dashboard/sections/permission-profiles-section";
import { ProfileSection } from "@/src/components/dashboard/sections/profile-section";
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
import type {
  AccessRequest,
  AdminApiKeyStatus,
  IntegrationSpec,
  UserApiKeyStatus,
} from "@/src/types/integrations-hub";

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
  const [activeSection, setActiveSection] = useState<AdminSection>(() =>
    getAdminSectionFromPath(pathname),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(false);

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
    if (searchParams.get("showIntegrationWizard") === "1") {
      setShowIntegrationWizard(true);
    }
  }, [searchParams]);

  // Shared counts for the sidebar/header badges. These queries own the
  // canonical cache for integrations/access-requests; the section hooks
  // reuse the same query keys so there is one fetch per endpoint per mount.
  // `initialData` lets tests seed synchronous data; production leaves it
  // empty so the single fetch populates the cache. `initialDataUpdatedAt: 0`
  // marks the seed as stale so a background refetch fires immediately on
  // mount — otherwise the empty production seed would suppress the fetch for
  // `staleTime` and already-installed integrations would render only in the
  // "Add integration" marketplace until a manual action invalidated the query.
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

  const { agentApiReady, userKey, adminKey } = useApiKeys({
    agentApiKey,
    userApiKey,
    adminApiKey,
    onStatus: setStatusMessage,
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
    onStatus: setStatusMessage,
  });

  const approvalsSection = useApprovalsSection({
    initialAccessRequests,
    enabled: activeSection === "caseByCaseApprovals",
    onStatus: setStatusMessage,
  });

  const permissionProfilesSection = usePermissionProfilesSection({
    enabled: activeSection === "permissionProfiles" || activeSection === "apiKeys",
    onStatus: setStatusMessage,
  });

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
  const userOpenApiSchemaEndpoint = `${normalizedBaseUrl}/api/user/openapi`;
  const adminOpenApiSchemaEndpoint = `${normalizedBaseUrl}/api/admin/openapi`;
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
    setShowIntegrationWizard(true);
    setActiveSection("integrations");
    router.push(
      buildAdminSectionHref("integrations", {
        showIntegrationWizard: "1",
        managedConnector: managedConnectorSlug,
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
      pendingAccessRequestCount={pendingAccessRequests.length}
      integrationCount={integrations.length}
      statusMessage={statusMessage}
      oauthStatusMessage={oauthStatusMessage}
      showOAuthStatus={!showIntegrationWizard}
      agentApiReady={agentApiReady}
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

      {activeSection === "permissionProfiles" ? (
        <PermissionProfilesSection {...permissionProfilesSection} />
      ) : null}

      {activeSection === "integrations" ? (
        <IntegrationsSection
          {...integrationsSection}
          integrations={integrations}
          isAdmin={isAdmin}
          oauthStatus={oauthStatus}
          onCloseIntegrationWizard={closeIntegrationWizard}
          onCreated={handleIntegrationCreated}
          onOpenIntegrationWizard={openIntegrationWizard}
          onStatus={setStatusMessage}
          showIntegrationWizard={showIntegrationWizard}
        />
      ) : null}

      {activeSection === "apiKeys" ? (
        <AgentConnectionSection
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


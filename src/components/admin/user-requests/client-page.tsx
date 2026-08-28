"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AddCustomMcpModal } from "@/src/components/admin/integrations/add-custom-mcp-modal";
import { UnifiedConnectorList } from "@/src/components/admin/integrations/unified-connector-list";
import { UserRequestsList } from "@/src/components/admin/user-requests/user-requests-list";
import { useAuth } from "@/src/components/auth/auth-context";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { HubAppShell } from "@/src/components/layout/hub-app-shell";
import { PageHeader } from "@/src/components/layout/page-header";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { catalogOptionToConnectorOption } from "@/src/lib/catalog-mappers";
import { fetchJson } from "@/src/lib/fetch-json";
import {
  ADMIN_INTEGRATION_REQUESTS_QUERY_KEY,
  isPendingIntegrationRequest,
  shouldOpenCatalogAddModal,
} from "@/src/lib/integration-requests";
import { apiPath } from "@/src/shared/paths";
import { hubPageShellClassName } from "@/src/styles/neo-layout";
import { hubSearchEmptyStateClassName } from "@/src/styles/extension-module-card-classes";
import type {
  IntegrationCatalogOption,
  IntegrationConnectionStatus,
  IntegrationRequest,
  ManagedConnectorDefinition,
  ManagedConnectorOption,
} from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminUserRequests;

interface AdminIntegrationsData {
  managedConnectors: ManagedConnectorDefinition[];
  readyConnectors: ManagedConnectorOption[];
  integrationCatalog: IntegrationCatalogOption[];
}

export function ClientAdminUserRequestsPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [actionError, setActionError] = useState("");
  const [addingRequest, setAddingRequest] = useState<IntegrationRequest | null>(
    null,
  );

  const { data: requests = [], isLoading: dataLoading, error } = useQuery({
    queryKey: ADMIN_INTEGRATION_REQUESTS_QUERY_KEY,
    queryFn: () => fetchJson<IntegrationRequest[]>("/api/admin/integration-requests"),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const catalogQuery = useQuery({
    queryKey: ["admin-integrations-init"],
    queryFn: async (): Promise<AdminIntegrationsData> => {
      const [managedConnectors, enabledCatalog] = await Promise.all([
        fetchJson<ManagedConnectorDefinition[]>("/api/admin/modify-integrations"),
        fetchJson<IntegrationCatalogOption[]>("/api/integrations?filter=all"),
      ]);
      const managedConnectorList = Array.isArray(managedConnectors)
        ? managedConnectors
        : [];
      const catalogList = Array.isArray(enabledCatalog) ? enabledCatalog : [];

      return {
        managedConnectors: managedConnectorList,
        readyConnectors: catalogList
          .filter((entry) => entry.connectionDefaults?.oauthConfigured !== false)
          .map(catalogOptionToConnectorOption),
        integrationCatalog: catalogList,
      };
    },
    enabled: isAuthenticated && isAdmin,
    staleTime: 0,
    retry: false,
  });

  const connectionsQuery = useQuery<IntegrationConnectionStatus[]>({
    queryKey: ["admin-oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: isAuthenticated && isAdmin,
    staleTime: 15_000,
  });

  const pendingRequests = useMemo(
    () => requests.filter(isPendingIntegrationRequest),
    [requests],
  );

  const decideMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "add" | "dismiss";
    }) =>
      fetchJson<IntegrationRequest>(
        `/api/admin/integration-requests/${requestId}/${action}`,
        { method: "POST" },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_INTEGRATION_REQUESTS_QUERY_KEY,
      });
    },
  });

  const markRequestAdded = useCallback(
    async (request: IntegrationRequest) => {
      setActionError("");
      try {
        await decideMutation.mutateAsync({ requestId: request.id, action: "add" });
        setAddingRequest(null);
        await queryClient.invalidateQueries({
          queryKey: ["admin-integrations-init"],
        });
      } catch (submitError) {
        setActionError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to mark this request as added.",
        );
      }
    },
    [decideMutation, queryClient],
  );

  const handleAdd = (request: IntegrationRequest) => {
    setActionError("");
    setAddingRequest(request);
  };

  const handleDismiss = async (requestId: string) => {
    setActionError("");
    try {
      await decideMutation.mutateAsync({ requestId, action: "dismiss" });
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to dismiss this request.",
      );
    }
  };

  const handleModalClose = () => {
    setAddingRequest(null);
  };

  const handleConnectorCompleted = (request: IntegrationRequest) => {
    void markRequestAdded(request);
  };

  const oauthCallbackBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${apiPath("/api/oauth")}`
      : "";

  const catalogData = catalogQuery.data;
  const integrationCatalog = catalogData?.integrationCatalog ?? [];
  const managedConnectors = catalogData?.managedConnectors ?? [];
  const openCatalogModal =
    addingRequest !== null &&
    shouldOpenCatalogAddModal(addingRequest, integrationCatalog);
  const openCustomModal =
    addingRequest !== null && !catalogQuery.isLoading && !openCatalogModal;

  if (authLoading) {
    return <LoadingSpinner label="Loading user requests..." />;
  }

  if (isAdmin && error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-white">Failed to load user requests</p>
          <p className="mt-2 text-sm text-[var(--color-text-base)]">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin && dataLoading) {
    return <LoadingSpinner label="Loading user requests..." />;
  }

  const userName = user?.name?.trim() || "Integrations Hub User";
  const userEmail = user?.email?.trim() || "Not provided";

  return (
    <HubAppShell
      activeItem={isAdmin ? "adminUserRequests" : "integrations"}
      stats={{
        liveIntegrations: catalogData?.readyConnectors.length ?? 0,
        toolCount: catalogData?.integrationCatalog.length ?? 0,
      }}
      userDisplayName={userName}
      userEmail={userEmail}
      showAdminOverviewLink={isAdmin}
      showAdminIntegrationsLink
    >
      <div className={hubPageShellClassName}>
        <div className="space-y-4">
          <PageHeader
            title={copy.title}
            description={
              isAdmin ? copy.subtitle : copy.adminAccessRequiredDescription
            }
            pills={
              isAdmin
                ? [copy.pendingCountLabel(pendingRequests.length)]
                : [copy.adminAccessRequiredPill]
            }
          />

          {isAdmin ? (
            <>
              {actionError ? (
                <p className="text-sm text-[var(--oh-color-danger)]" role="alert">
                  {actionError}
                </p>
              ) : null}
              {pendingRequests.length === 0 ? (
                <p
                  data-testid="user-requests-empty"
                  className={hubSearchEmptyStateClassName}
                >
                  {copy.empty}
                </p>
              ) : (
                <UserRequestsList
                  requests={pendingRequests}
                  actionPending={decideMutation.isPending || addingRequest !== null}
                  onAdd={(request) => handleAdd(request)}
                  onDismiss={(requestId) => void handleDismiss(requestId)}
                />
              )}
            </>
          ) : (
            <div
              data-testid="user-requests-gated-card"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-6 text-sm leading-7 text-[var(--color-text-base)]"
            >
              <p>
                {copy.adminAccessGateBodyPrefix}{" "}
                <code className="text-white">INTHUB_APP_ADMIN_EMAILS</code>{" "}
                {copy.adminAccessGateBodySuffix}
              </p>
            </div>
          )}
        </div>
      </div>

      {openCatalogModal && addingRequest ? (
        <UnifiedConnectorList
          hideList
          integrationCatalog={integrationCatalog}
          managedConnectors={managedConnectors}
          connections={connectionsQuery.data ?? []}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          canRegisterManagedConnectors
          initialExpandedSlug={addingRequest.slug}
          onModalClose={handleModalClose}
          onConnectorRegistered={() => handleConnectorCompleted(addingRequest)}
          onConnectorUpdated={() => handleConnectorCompleted(addingRequest)}
          onConnectionsStale={() => void connectionsQuery.refetch()}
          onManagedConnectorsStale={() =>
            void queryClient.invalidateQueries({
              queryKey: ["admin-integrations-init"],
            })
          }
        />
      ) : null}

      {openCustomModal && addingRequest ? (
        <AddCustomMcpModal
          existingSlugs={[
            ...managedConnectors.map((connector) => connector.slug),
            ...integrationCatalog.map((entry) => entry.slug),
          ]}
          initialName={addingRequest.name}
          onClose={handleModalClose}
          onRegistered={() => handleConnectorCompleted(addingRequest)}
        />
      ) : null}
    </HubAppShell>
  );
}

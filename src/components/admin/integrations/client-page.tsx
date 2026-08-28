"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AddCustomMcpModal } from "@/src/components/admin/integrations/add-custom-mcp-modal";
import { IntegrationsCatalog } from "@/src/components/admin/integrations/catalog";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { HubAppShell } from "@/src/components/layout/hub-app-shell";
import { PageHeader } from "@/src/components/layout/page-header";
import { useAuth } from "@/src/components/auth/auth-context";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
import { fetchJson } from "@/src/lib/fetch-json";
import { apiPath } from "@/src/shared/paths";
import { catalogOptionToConnectorOption } from "@/src/lib/catalog-mappers";
import { hubPageShellClassName } from "@/src/styles/neo-layout";
import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
  ManagedConnectorOption,
  IntegrationCatalogOption,
} from "@/src/types/integrations-hub";

interface AdminIntegrationsData {
  managedConnectors: ManagedConnectorDefinition[];
  readyConnectors: ManagedConnectorOption[];
  integrationCatalog: IntegrationCatalogOption[];
}

export function ClientAdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [addCustomMcpOpen, setAddCustomMcpOpen] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const { data, isLoading: dataLoading, error } = useQuery({
    queryKey: ["admin-integrations-init"],
    queryFn: async (): Promise<AdminIntegrationsData> => {
      const [managedConnectors, enabledCatalog] = await Promise.all([
        isAdmin
          ? fetchJson<ManagedConnectorDefinition[]>("/api/admin/modify-integrations")
          : Promise.resolve([]),
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
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
  });

  // The acting admin's own OAuth connections. OAuth2 MCP connectors (e.g.
  // Slack) require a user access token to list tools, so the admin must
  // connect their own account before indexing. This is fetched separately so
  // it can be re-run after the admin returns from an OAuth redirect without
  // reloading the whole catalog.
  const connectionsQuery = useQuery<IntegrationConnectionStatus[]>({
    queryKey: ["admin-oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  // When returning from an OAuth redirect, the callback appends
  // oauth_status / oauth_provider / oauth_error to the URL. Force a
  // connections refetch so the newly connected (or failed) account shows
  // up immediately, and surface a status banner.
  const searchParams = useSearchParams();
  const [oauthStatusMessage, setOauthStatusMessage] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const status = searchParams.get("oauth_status");
    const provider = searchParams.get("oauth_provider");
    const oauthError = searchParams.get("oauth_error");
    if (!status) return;

    if (status === "connected" && provider) {
      setOauthStatusMessage({
        tone: "success",
        message: `${provider[0]?.toUpperCase() ?? ""}${provider.slice(1)} connected successfully.`,
      });
      void connectionsQuery.refetch();
    } else if (status === "error") {
      setOauthStatusMessage({
        tone: "error",
        message: oauthError || "OAuth connection failed.",
      });
    }
  }, [searchParams]);

  const oauthCallbackBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${apiPath("/api/oauth")}`
      : "";

  if (authLoading) {
    return <LoadingSpinner label="Loading admin integrations..." />;
  }

  if (error) {
    console.error("Admin integrations data fetch error:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-white">Failed to load admin integrations</p>
          <p className="mt-2 text-sm text-[var(--color-text-base)]">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  if (dataLoading || !data) {
    return <LoadingSpinner label="Loading admin integrations..." />;
  }

  const userName = user?.name?.trim() || "Integrations Hub User";
  const userEmail = user?.email?.trim() || "Not provided";

  return (
    <HubAppShell
      activeItem="adminIntegrations"
      stats={{
        liveIntegrations: data.readyConnectors.length,
        toolCount: data.integrationCatalog.length,
      }}
      userDisplayName={userName}
      userEmail={userEmail}
      showAdminOverviewLink={isAdmin}
      showAdminIntegrationsLink
    >
      <div className={hubPageShellClassName}>
        <div className="space-y-4">
          {oauthStatusMessage ? (
            <div
              className={`rounded-lg border p-3 text-sm ${
                oauthStatusMessage.tone === "success"
                  ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "border-red-500/40 bg-red-500/10 text-red-200"
              }`}
            >
              {oauthStatusMessage.message}
            </div>
          ) : null}
          <PageHeader
            title="Admin integrations"
            description="Register providers for this deployment. Users can only connect connectors added here."
            pills={[
              ...(isAdmin ? [`${data.managedConnectors.length} added`] : []),
              `${data.integrationCatalog.length} available`,
            ]}
            pillClassName="px-1.5 py-0.5 text-[10px] leading-4"
            actions={
              isAdmin ? (
                <BrandButton
                  type="button"
                  variant="primary"
                  onClick={() => setAddCustomMcpOpen(true)}
                >
                  {ADMIN_INTEGRATIONS_PAGE_COPY.addCustomMcpButtonLabel}
                </BrandButton>
              ) : null
            }
          />

          <IntegrationsCatalog
            integrationCatalog={data.integrationCatalog}
            initialReadyManagedConnectors={data.readyConnectors}
            managedConnectors={data.managedConnectors}
            canRegisterManagedConnectors={isAdmin}
            oauthCallbackBaseUrl={oauthCallbackBaseUrl}
            connections={connectionsQuery.data ?? []}
            onConnectionsStale={() => void connectionsQuery.refetch()}
            onManagedConnectorsStale={() => void queryClient.invalidateQueries({ queryKey: ["admin-integrations-init"] })}
            initialExpandedSlug={
              expandedSlug ?? searchParams?.get("managedConnector") ?? null
            }
          />
        </div>
      </div>
      {isAdmin && addCustomMcpOpen ? (
        <AddCustomMcpModal
          existingSlugs={[
            ...data.managedConnectors.map((connector) => connector.slug),
            ...data.integrationCatalog.map((entry) => entry.slug),
          ]}
          onClose={() => setAddCustomMcpOpen(false)}
          onRegistered={(connector) => {
            setAddCustomMcpOpen(false);
            setExpandedSlug(connector.slug);
            queryClient.setQueryData<AdminIntegrationsData>(
              ["admin-integrations-init"],
              (current) => {
                if (!current) return current;
                return {
                  ...current,
                  managedConnectors: [
                    ...current.managedConnectors.filter(
                      (existing) => existing.slug !== connector.slug,
                    ),
                    connector,
                  ],
                };
              },
            );
            void queryClient.invalidateQueries({
              queryKey: ["admin-integrations-init"],
            });
          }}
        />
      ) : null}
    </HubAppShell>
  );
}

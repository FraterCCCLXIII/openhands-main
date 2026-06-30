"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { IntegrationsCatalog } from "@/src/components/admin/integrations/catalog";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { DashboardSidebar, DashboardSidebarUserPanel } from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { useAuth } from "@/src/components/auth/auth-context";
import { Badge } from "@/src/components/ui/badge";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
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

// The admin integrations page shows every catalog connector regardless of
// auth strategy (OAuth2, API key, bearer, or none) so admins can register
// any provider. Only connectors an admin has explicitly added are surfaced
// to users (see the backend /api/integrations/managed-connectors gating).
const isReadyConnector = (connector: ManagedConnectorOption) =>
  connector.oauthConfigured !== false;

export function ClientAdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading: dataLoading, error } = useQuery({
    queryKey: ["admin-integrations-init"],
    queryFn: async (): Promise<AdminIntegrationsData> => {
      const [managedConnectors, allConnectors, integrationCatalog] = await Promise.all([
        isAdmin
          ? fetchJson<ManagedConnectorDefinition[]>("/api/admin/managed-connectors")
          : Promise.resolve([]),
        fetchJson<ManagedConnectorOption[]>("/api/integrations/managed-connectors"),
        fetchJson<IntegrationCatalogOption[]>("/api/integrations/catalog"),
      ]);

      return {
        managedConnectors,
        readyConnectors: allConnectors.filter(isReadyConnector),
        integrationCatalog,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const oauthCallbackBaseUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/oauth` : "";

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
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <DashboardSidebar
          badge={
            <Badge>
              {isAdmin
                ? `${data.managedConnectors.length} added`
                : `${data.readyConnectors.length} ready`}
            </Badge>
          }
          activeItem="adminIntegrations"
          showAdminOverviewLink={isAdmin}
          showAdminIntegrationsLink
          footer={
            isAuthenticated ? (
              <DashboardSidebarUserPanel
                userName={userName}
                userEmail={userEmail}
                badges={[
                  <Badge key="ready">{data.readyConnectors.length} ready</Badge>,
                  <Badge key="catalog">{data.integrationCatalog.length} available</Badge>,
                ]}
                action={<DashboardSignOutButton />}
              />
            ) : undefined
          }
        />

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
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
                OpenHands Integrations Hub
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Admin integrations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
                Register integrations for the deployment. Admins can add a
                provider (OAuth or MCP) from the available list and manage the
                connectors that have already been added. Only connectors an
                admin has added are available to users.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Badge>{data.managedConnectors.length} added</Badge>
              ) : null}
              <Badge>{data.integrationCatalog.length} available</Badge>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-base)]">
            <Link
              href={buildAdminSectionHref("integrations", {
                showIntegrationWizard: "1",
              })}
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to integrations
            </Link>
          </div>

          <IntegrationsCatalog
            integrationCatalog={data.integrationCatalog}
            initialReadyManagedConnectors={data.readyConnectors}
            managedConnectors={data.managedConnectors}
            canRegisterManagedConnectors={isAdmin}
            oauthCallbackBaseUrl={oauthCallbackBaseUrl}
            connections={connectionsQuery.data ?? []}
            onConnectionsStale={() => void connectionsQuery.refetch()}
            onManagedConnectorsStale={() => void queryClient.invalidateQueries({ queryKey: ["admin-integrations-init"] })}
            initialExpandedSlug={searchParams?.get("managedConnector") ?? null}
          />
        </div>
      </div>
    </main>
  );
}

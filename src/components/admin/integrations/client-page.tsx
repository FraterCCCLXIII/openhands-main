"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { IntegrationsCatalog } from "@/src/components/admin/integrations/catalog";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { DashboardSidebar, DashboardSidebarUserPanel } from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { useAuth } from "@/src/components/auth/auth-context";
import { Badge } from "@/src/components/ui/badge";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
import type {
  ManagedConnectorDefinition,
  ManagedConnectorOption,
  IntegrationCatalogOption,
} from "@/src/types/integrations-hub";

interface AdminIntegrationsData {
  managedConnectors: ManagedConnectorDefinition[];
  readyConnectors: ManagedConnectorOption[];
  integrationCatalog: IntegrationCatalogOption[];
}

// The admin integrations page only deals with OAuth-based providers. Catalog
// options without an explicit auth strategy default to OAuth (see
// getProviderAuthStrategy in integration-catalog-panel), so treat undefined as
// OAuth to stay consistent with the rest of the app.
const isOAuthCatalogOption = (option: IntegrationCatalogOption) =>
  (option.connectionDefaults.authStrategy ?? "oauth2") === "oauth2";

const isOAuthManagedConnector = (connector: ManagedConnectorDefinition) =>
  connector.authStrategy === "oauth2";

const isOAuthReadyConnector = (connector: ManagedConnectorOption) =>
  connector.authStrategy === "oauth2";

export function ClientAdminIntegrationsPage() {
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
        managedConnectors: managedConnectors.filter(isOAuthManagedConnector),
        readyConnectors: allConnectors.filter(
          (connector) =>
            connector.oauthConfigured !== false && isOAuthReadyConnector(connector),
        ),
        integrationCatalog: integrationCatalog.filter(isOAuthCatalogOption),
      };
    },
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
  });

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
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
                OpenHands Integrations Hub
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Admin integrations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
                Register OAuth-based integrations for the deployment. Admins can add a
                provider from the available list and manage the connectors that have already
                been added.
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
          />
        </div>
      </div>
    </main>
  );
}

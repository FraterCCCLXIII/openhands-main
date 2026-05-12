"use client";

import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { IntegrationsCatalog } from "@/src/components/admin/integrations/catalog";
import { DashboardSidebar, DashboardSidebarUserPanel } from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { useAuth } from "@/src/components/auth/auth-context";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
import type { ManagedConnectorDefinition, ManagedConnectorOption, OAuthProviderCatalogOption } from "@/src/types/integrations-hub";

interface AdminIntegrationsData {
  managedConnectors: ManagedConnectorDefinition[];
  readyConnectors: ManagedConnectorOption[];
  providerCatalog: OAuthProviderCatalogOption[];
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--color-text-base)]">Loading admin integrations...</p>
      </div>
    </div>
  );
}

export function ClientAdminIntegrationsPage() {
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading: dataLoading, error } = useQuery({
    queryKey: ["admin-integrations-init"],
    queryFn: async (): Promise<AdminIntegrationsData> => {
      const [managedConnectors, allConnectors, providerCatalog] = await Promise.all([
        isAdmin
          ? fetchJson<ManagedConnectorDefinition[]>("/api/admin/managed-connectors")
          : Promise.resolve([]),
        fetchJson<ManagedConnectorOption[]>("/api/integrations/managed-connectors"),
        fetchJson<OAuthProviderCatalogOption[]>("/api/integrations/oauth-provider-catalog"),
      ]);

      return {
        managedConnectors,
        readyConnectors: allConnectors.filter((c) => c.oauthConfigured !== false),
        providerCatalog,
      };
    },
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
  });

  const oauthCallbackBaseUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/oauth` : "";

  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Error state - show error message
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
    return <LoadingSpinner />;
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
                ? `${data.managedConnectors.length} registered`
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
                  <Badge key="catalog">{data.providerCatalog.length} catalog</Badge>,
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
                Service-level connector administration now uses the same dashboard
                chrome as personal integrations. Regular users can request missing
                providers, while admins can register, edit, and remove managed
                connectors for the deployment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Badge>{data.managedConnectors.length} registered</Badge>
              ) : null}
              <Badge>{data.readyConnectors.length} ready now</Badge>
              <Badge>{data.providerCatalog.length} catalog options</Badge>
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
            <Badge>{data.readyConnectors.length} connectors ready now</Badge>
          </div>

          {isAdmin ? (
            <Card className="p-6">
              <div data-testid="admin-guidance-card">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">For admins</h2>
                    <p className="text-sm text-[var(--color-text-base)]">
                      How to add a provider that is not currently showing up.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                  <p>
                    Managing OAuth apps is a service-level admin action. Use this page to
                    register a managed connector so every user can see it in the integrations
                    wizard.
                  </p>
                  <p>
                    The in-app registration form is only available to signed-in app
                    administrators whose email appears in the <code className="text-white">APP_ADMIN_EMAILS</code> environment variable.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div data-testid="user-guidance-card">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
                    <UserRound className="h-4 w-4 text-[var(--color-accent)]" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">For users</h2>
                    <p className="text-sm text-[var(--color-text-base)]">
                      What to do when the connector you want is not listed.
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                  <p>
                    The integration wizard only shows connectors that are ready to use in this
                    deployment. If you do not see the provider you need, please contact your
                    deployment administrator to request additional connector registrations.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <IntegrationsCatalog
            providerCatalog={data.providerCatalog}
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

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AdminOverviewUserList } from "@/src/components/admin/overview/admin-overview-user-list";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { HubAppShell } from "@/src/components/layout/hub-app-shell";
import { PageHeader } from "@/src/components/layout/page-header";
import { useAuth } from "@/src/components/auth/auth-context";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { fetchJson } from "@/src/lib/fetch-json";
import { hubPageShellClassName } from "@/src/styles/neo-layout";
import type { AdminOperationalOverview } from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminOverview;

export function ClientAdminOverviewPage() {
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: overview, isLoading: dataLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchJson<AdminOperationalOverview>("/api/admin/overview"),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  if (authLoading) {
    return <LoadingSpinner label="Loading admin overview..." />;
  }

  if (isAdmin && error) {
    console.error("Admin overview data fetch error:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-white">Failed to load admin overview</p>
          <p className="mt-2 text-sm text-[var(--color-text-base)]">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin && dataLoading) {
    return <LoadingSpinner label="Loading admin overview..." />;
  }

  const userName = user?.name?.trim() || "Integrations Hub User";
  const userEmail = user?.email?.trim() || "Not provided";

  return (
    <HubAppShell
      activeItem={isAdmin ? "adminOverview" : "integrations"}
      stats={{
        liveIntegrations: overview?.connectedOwners ?? 0,
        toolCount: overview?.managedConnectors ?? 0,
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
              overview ? copy.subtitle : copy.adminAccessRequiredDescription
            }
            pills={
              overview
                ? [
                    copy.connectedIdentitiesPill(overview.totalConnections),
                    `${overview.connectedOwners} ${copy.connectedOwnersLabel.toLowerCase()}`,
                    copy.pendingApprovalsPill(overview.pendingAccessRequests),
                    `${overview.duplicateExternalAccounts.length} ${copy.duplicateAccountsTitle.toLowerCase()}`,
                  ]
                : [copy.adminAccessRequiredPill]
            }
          />

          {overview ? (
            <AdminOverviewUserList
              users={overview.users}
              duplicateGroups={overview.duplicateExternalAccounts}
            />
          ) : (
            <div
              data-testid="admin-overview-gated-card"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-6 text-sm leading-7 text-[var(--color-text-base)]"
            >
              <p>
                {copy.adminAccessGateBodyPrefix}{" "}
                <code className="text-white">INTHUB_APP_ADMIN_EMAILS</code>{" "}
                {copy.adminAccessGateBodySuffix}
              </p>
              <p className="mt-3">
                {copy.adminAccessGateFollowUpPrefix}{" "}
                <Link
                  href="/admin-integrations"
                  className="text-white transition-opacity hover:opacity-80"
                >
                  {copy.adminAccessGateAdminIntegrationsLink}
                </Link>{" "}
                {copy.adminAccessGateFollowUpSuffix}
              </p>
            </div>
          )}
        </div>
      </div>
    </HubAppShell>
  );
}

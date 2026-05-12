"use client";

import { ArrowLeft, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CompactPanel } from "@/src/components/dashboard/shared";
import {
  DashboardSidebar,
  DashboardSidebarUserPanel,
} from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { useAuth } from "@/src/components/auth/auth-context";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
import type { AdminOperationalOverview } from "@/src/types/integrations-hub";

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--color-text-base)]">Loading admin overview...</p>
      </div>
    </div>
  );
}

export function ClientAdminOverviewPage() {
  const { user, isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: overview, isLoading: dataLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchJson<AdminOperationalOverview>("/api/admin/overview"),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Error state for admin users - show error message
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
    return <LoadingSpinner />;
  }

  const userName = user?.name?.trim() || "Integrations Hub User";
  const userEmail = user?.email?.trim() || "Not provided";

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <DashboardSidebar
          badge={<Badge>{overview ? `${overview.users.length} users` : "Admin only"}</Badge>}
          activeItem={isAdmin ? "adminOverview" : "integrations"}
          showAdminOverviewLink={isAdmin}
          showAdminIntegrationsLink
          footer={
            isAuthenticated ? (
              <DashboardSidebarUserPanel
                userName={userName}
                userEmail={userEmail}
                badges={
                  overview
                    ? [
                        <Badge key="owners">{overview.connectedOwners} owners</Badge>,
                        <Badge key="pending">{overview.pendingAccessRequests} pending</Badge>,
                      ]
                    : [<Badge key="request">Request admin access</Badge>]
                }
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
              <h1 className="mt-1 text-2xl font-semibold text-white">
                Operational overview
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
                Deployment-wide snapshot of <code className="text-white">/api/admin/overview</code>, presented as a concise expandable user browser.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {overview ? (
                <>
                  <Badge>{overview.totalConnections} connected identities</Badge>
                  <Badge>{overview.pendingAccessRequests} pending approvals</Badge>
                  <Badge>
                    {overview.duplicateExternalAccounts.length} duplicate {pluralize(overview.duplicateExternalAccounts.length, "group")}
                  </Badge>
                </>
              ) : (
                <Badge>Admin access required</Badge>
              )}
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-base)]">
            <Link
              href={buildAdminSectionHref("integrations")}
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to integrations
            </Link>
            <Link
              href="/api/admin/openapi"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              Admin OpenAPI schema
            </Link>
          </div>

          {overview ? (
            <div data-testid="admin-overview-users-card">
              <CompactPanel
                title="Browse users"
                icon={UserRound}
                action={<Badge>{overview.users.length} shown</Badge>}
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-white">
                        Deployment-wide user summaries
                      </h2>
                      <p className="text-xs leading-6 text-[var(--color-text-base)]">
                        Expand a row to inspect saved identities, approval pressure,
                        notification volume, and duplicate external-account groups for a
                        specific user.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{overview.connectedOwners} connected owners</Badge>
                      <Badge>{overview.managedConnectors} managed connectors</Badge>
                      <Badge>{overview.notifications} notifications</Badge>
                      <Badge>{overview.totalAccessRequests} access requests</Badge>
                    </div>
                  </div>

                  {overview.users.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
                      No deployment users have any saved connections, approval requests, or
                      notification history yet.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] bg-[var(--color-surface-subtle)]">
                      {overview.users.map((overviewUser) => (
                        <details key={overviewUser.ownerId} data-testid="admin-overview-user-row">
                          <summary className="flex w-full cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap list-none px-4 py-3 text-left text-sm [&::-webkit-details-marker]:hidden">
                            <span className="shrink-0 font-medium text-white">{overviewUser.ownerId}</span>
                            <span className="shrink-0 text-[var(--color-text-muted)]">—</span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {overviewUser.totalConnections} {pluralize(overviewUser.totalConnections, "connection")}
                            </span>
                            <span className="shrink-0 text-[var(--color-text-muted)]">·</span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {overviewUser.pendingAccessRequests} pending
                            </span>
                            <span className="shrink-0 text-[var(--color-text-muted)]">·</span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {overviewUser.notifications} notifications
                            </span>
                          </summary>
                          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-workspace)] px-4 py-4">
                            <p className="text-xs text-[var(--color-text-base)]">
                              User details: {overviewUser.totalConnections} connections, {overviewUser.pendingAccessRequests} pending requests
                            </p>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </CompactPanel>
            </div>
          ) : (
            <Card className="p-6">
              <div data-testid="admin-overview-gated-card">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2">
                    <ShieldAlert className="h-4 w-4 text-[var(--color-accent)]" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Admin access required</h2>
                    <p className="text-sm text-[var(--color-text-base)]">
                      This deployment-wide overview is only available to app administrators.
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-7 text-[var(--color-text-base)]">
                  <p>
                    Only app administrators listed in <code className="text-white">APP_ADMIN_EMAILS</code> can view connected identities, approval queues, notifications, and duplicate external accounts across all owners.
                  </p>
                  <p>
                    If you need a new connector or access workflow, use <Link
                      href="/admin-integrations"
                      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      Admin integrations
                    </Link> to request the necessary setup from an administrator.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

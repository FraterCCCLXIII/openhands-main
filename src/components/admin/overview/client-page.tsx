"use client";

import { ArrowLeft, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CompactPanel } from "@/src/components/dashboard/shared";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
import { HubAppShell } from "@/src/components/layout/hub-app-shell";
import { useAuth } from "@/src/components/auth/auth-context";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
import { apiPath } from "@/src/shared/paths";
import { hubPageShellClassName } from "@/src/styles/neo-layout";
import type { AdminOperationalOverview } from "@/src/types/integrations-hub";

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

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
                  <Badge>{overview.connectedOwners} Connected owners</Badge>
                  <Badge>{overview.pendingAccessRequests} Pending approvals</Badge>
                  <Badge>
                    {overview.duplicateExternalAccounts.length} Duplicate external accounts
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
              href={apiPath("/api/admin/openapi")}
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              Admin OpenAPI schema
            </Link>
          </div>

          {overview?.duplicateExternalAccounts.length ? (
            <div className="mb-4" data-testid="admin-overview-duplicates-card">
              <CompactPanel
                title="Duplicate external accounts"
                icon={ShieldAlert}
                action={<Badge>{overview.duplicateExternalAccounts.length} groups</Badge>}
              >
                <p className="text-sm leading-6 text-[var(--color-text-base)]">
                  Review duplicate external-account groups before granting broad access.
                </p>
              </CompactPanel>
            </div>
          ) : null}

          {overview ? (
            <div data-testid="admin-overview-users-card">
              <CompactPanel
                title="Browse users"
                icon={UserRound}
                action={<Badge>{overview.users.length} Shown</Badge>}
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
                      <Badge>{overview.connectedOwners} Connected owners</Badge>
                      <Badge>{overview.managedConnectors} Managed connectors</Badge>
                      <Badge>{overview.notifications} Notifications</Badge>
                      <Badge>{overview.totalAccessRequests} Access requests</Badge>
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
                            <span data-testid="admin-overview-user-row-caret" aria-hidden className="shrink-0 text-[var(--color-text-base)]">▸</span>
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
                    Only app administrators listed in <code className="text-white">INTHUB_APP_ADMIN_EMAILS</code> can view connected identities, approval queues, notifications, and duplicate external accounts across all owners.
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
    </HubAppShell>
  );
}

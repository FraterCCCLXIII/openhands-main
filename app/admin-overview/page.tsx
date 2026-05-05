import { ArrowLeft, ChevronRight, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";

import { CompactPanel, KeyValueRow } from "@/src/components/dashboard/shared";
import {
  DashboardSidebar,
  DashboardSidebarUserPanel,
} from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import { ServiceUnavailableScreen } from "@/src/components/feedback/service-unavailable-screen";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { buildAdminSectionHref } from "@/src/lib/admin-routes";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { isEphemeralIntegrationsHubStorage } from "@/src/lib/persistence";
import type { AdminIntegrationConnectionSummary } from "@/src/types/integrations-hub";

export const dynamic = "force-dynamic";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString() : "Not available";

const formatConnectionLabel = (connection: AdminIntegrationConnectionSummary) =>
  connection.displayName?.trim() ||
  connection.externalAccountId?.trim() ||
  connection.externalWorkspaceId?.trim() ||
  "No external identity recorded";

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export default async function AdminOverviewPage() {
  const session = await auth();
  const isAdmin = isAppAdminEmail(session?.user?.email ?? undefined);

  if (session?.user && isEphemeralIntegrationsHubStorage()) {
    return <ServiceUnavailableScreen isAdmin={isAdmin} />;
  }

  const overview = isAdmin
    ? await getIntegrationsHubService().getAdminOperationalOverview()
    : null;
  const userName = session?.user?.name?.trim() || "Integrations Hub User";
  const userEmail = session?.user?.email?.trim() || "Not provided";

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <DashboardSidebar
          badge={<Badge>{overview ? `${overview.users.length} users` : "Admin only"}</Badge>}
          activeItem={isAdmin ? "adminOverview" : "integrations"}
          showAdminOverviewLink={isAdmin}
          showAdminIntegrationsLink
          footer={
            session?.user ? (
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
                      {overview.users.map((user) => (
                        <details key={user.ownerId} data-testid="admin-overview-user-row">
                          <summary className="flex w-full cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap list-none px-4 py-3 text-left text-sm [&::-webkit-details-marker]:hidden">
                            <span className="shrink-0 font-medium text-white">{user.ownerId}</span>
                            <span className="shrink-0 text-[var(--color-text-muted)]">—</span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {user.totalConnections} {pluralize(user.totalConnections, "connection")}
                            </span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {user.pendingAccessRequests} pending
                            </span>
                            <span className="shrink-0 text-[var(--color-text-base)]">
                              {user.notifications} {pluralize(user.notifications, "notification")}
                            </span>
                            {user.duplicateExternalAccounts.length > 0 ? (
                              <span className="shrink-0 text-[var(--color-accent)]">
                                {user.duplicateExternalAccounts.length} duplicate {pluralize(user.duplicateExternalAccounts.length, "group")}
                              </span>
                            ) : null}
                            <span className="min-w-0 flex-1 truncate text-[var(--color-text-base)]">
                              {user.integrations.length > 0
                                ? user.integrations.join(", ")
                                : "No saved integrations yet"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-1.5 text-xs text-white">
                              View details
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          </summary>

                          <div className="border-t border-[var(--color-border)] px-4 py-4">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4">
                                <div className="divide-y divide-[var(--color-border)]">
                                  <KeyValueRow label="Connections" value={String(user.totalConnections)} />
                                  <KeyValueRow label="Access requests" value={String(user.totalAccessRequests)} />
                                  <KeyValueRow label="Pending approvals" value={String(user.pendingAccessRequests)} />
                                  <KeyValueRow label="Notifications" value={String(user.notifications)} />
                                  <KeyValueRow label="Duplicate groups" value={String(user.duplicateExternalAccounts.length)} />
                                  <KeyValueRow
                                    label="Providers"
                                    value={
                                      user.providers.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {user.providers.map((provider) => (
                                            <Badge key={`${user.ownerId}-${provider}`}>{provider}</Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[var(--color-text-base)]">
                                          No providers recorded.
                                        </span>
                                      )
                                    }
                                  />
                                  <KeyValueRow
                                    label="Integrations"
                                    value={
                                      user.integrations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {user.integrations.map((integrationKey) => (
                                            <Badge key={`${user.ownerId}-${integrationKey}`}>
                                              {integrationKey}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[var(--color-text-base)]">
                                          No integrations recorded.
                                        </span>
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                                  Saved identities
                                </p>
                                {user.connections.length === 0 ? (
                                  <p className="mt-3 text-sm text-[var(--color-text-base)]">
                                    No saved integration identities for this user yet.
                                  </p>
                                ) : (
                                  <div className="mt-3 space-y-3">
                                    {user.connections.map((connection) => (
                                      <div
                                        key={`${user.ownerId}-${connection.integrationKey}-${connection.provider}-${connection.updatedAt}`}
                                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white">
                                              {connection.integrationKey}
                                            </p>
                                            <p className="mt-1 truncate text-xs leading-6 text-[var(--color-text-base)]">
                                              {formatConnectionLabel(connection)}
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <Badge>{connection.provider}</Badge>
                                            <Badge>{connection.authStrategy}</Badge>
                                            {connection.tokenType ? (
                                              <Badge>{connection.tokenType}</Badge>
                                            ) : null}
                                          </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-base)]">
                                          {connection.externalAccountId ? (
                                            <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] px-2 py-1 text-white">
                                              {connection.externalAccountId}
                                            </code>
                                          ) : null}
                                          {connection.externalWorkspaceId ? (
                                            <code className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] px-2 py-1 text-white">
                                              workspace: {connection.externalWorkspaceId}
                                            </code>
                                          ) : null}
                                          {connection.scopes.map((scope) => (
                                            <Badge key={`${connection.integrationKey}-${connection.provider}-${scope}`}>
                                              {scope}
                                            </Badge>
                                          ))}
                                        </div>
                                        <p className="mt-3 text-[11px] leading-5 text-[var(--color-text-base)]">
                                          Updated {formatDateTime(connection.updatedAt)}
                                          {connection.expiresAt
                                            ? ` · Expires ${formatDateTime(connection.expiresAt)}`
                                            : ""}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {user.duplicateExternalAccounts.length > 0 ? (
                              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                                  Duplicate external-account groups
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {user.duplicateExternalAccounts.map((group) => (
                                    <div
                                      key={`${user.ownerId}-${group.provider}-${group.externalAccountId}`}
                                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-white"
                                    >
                                      <span className="font-medium">{group.provider}</span>
                                      <span className="mx-1 text-[var(--color-text-base)]">·</span>
                                      <span>{group.externalAccountId}</span>
                                      <span className="mx-1 text-[var(--color-text-base)]">·</span>
                                      <span>{group.ownerCount} owners</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
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

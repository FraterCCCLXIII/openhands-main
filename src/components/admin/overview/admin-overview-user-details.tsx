import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { cn } from "@/src/lib/utils";
import {
  extensionModuleCardPillClassName,
} from "@/src/styles/extension-module-card-classes";
import { settingsListContainerClassName } from "@/src/styles/settings-list-classes";
import { subsectionTitleClassName } from "@/src/styles/typography-classes";
import type {
  AdminDuplicateExternalAccountSummary,
  AdminIntegrationConnectionSummary,
  AdminOperationalOverviewUserSummary,
} from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminOverview;

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--oh-border)] bg-base-secondary px-3 py-2">
      <p className="text-xs text-tertiary-light">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function ConnectionRow({ connection }: { connection: AdminIntegrationConnectionSummary }) {
  const identity =
    connection.displayName?.trim() ||
    connection.externalAccountId?.trim() ||
    copy.connectionIdentityFallback;

  return (
    <div
      data-testid="admin-overview-connection-row"
      className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-3"
    >
      <div className="min-w-0">
        <p className="font-medium text-white">{connection.integrationKey}</p>
        <p className="text-xs text-tertiary-alt">{connection.provider}</p>
      </div>
      <p className="min-w-0 truncate text-tertiary-light">{identity}</p>
      <p className="min-w-0 truncate text-xs text-tertiary-alt">
        {connection.externalAccountId ?? copy.noExternalAccountId}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={extensionModuleCardPillClassName}>
          {connection.authStrategy}
        </span>
        <span className="text-xs text-tertiary-alt">
          {formatTimestamp(connection.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function DuplicateGroupRow({
  group,
}: {
  group: AdminDuplicateExternalAccountSummary;
}) {
  return (
    <div
      data-testid="admin-overview-duplicate-group-row"
      className="rounded-xl border border-[var(--oh-border)] bg-base-secondary px-3 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-white">
          {group.provider}
        </span>
        <span className={extensionModuleCardPillClassName}>
          {group.externalAccountId}
        </span>
        <span className={extensionModuleCardPillClassName}>
          {copy.duplicateOwnerCount(group.ownerCount ?? group.ownerIds.length)}
        </span>
      </div>
      {group.displayNames.length > 0 ? (
        <p className="mt-2 text-xs text-tertiary-light">
          {group.displayNames.join(", ")}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-tertiary-alt">
        {copy.duplicateOwnersLabel}: {group.ownerIds.join(", ")}
      </p>
    </div>
  );
}

export function AdminOverviewUserDetails({
  user,
}: {
  user: AdminOperationalOverviewUserSummary;
}) {
  return (
    <div
      data-testid="admin-overview-user-details"
      className="space-y-5"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label={copy.totalAccessRequestsLabel} value={user.totalAccessRequests} />
        <MetricTile
          label={copy.pendingAccessRequestsLabel}
          value={user.pendingAccessRequests}
        />
        <MetricTile label={copy.notificationsLabel} value={user.notifications} />
      </div>

      <div className="space-y-2">
        <h3 className={subsectionTitleClassName}>
          {copy.integrationsLabel}
        </h3>
        {user.integrations.length === 0 ? (
          <p className="text-sm text-tertiary-alt">{copy.noIntegrations}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.integrations.map((integration) => (
              <span key={integration} className={extensionModuleCardPillClassName}>
                {integration}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className={subsectionTitleClassName}>
          {copy.providersLabel}
        </h3>
        {user.providers.length === 0 ? (
          <p className="text-sm text-tertiary-alt">{copy.noProviders}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.providers.map((provider) => (
              <span key={provider} className={extensionModuleCardPillClassName}>
                {provider}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className={subsectionTitleClassName}>
          {copy.savedIdentitiesTitle(user.totalConnections)}
        </h3>
        {user.connections.length === 0 ? (
          <p className="text-sm text-tertiary-alt">{copy.noConnectionsForUser}</p>
        ) : (
          <div
            className={cn(
              settingsListContainerClassName,
              "divide-y divide-[var(--oh-border)]",
            )}
          >
            {user.connections.map((connection) => (
              <ConnectionRow
                key={`${connection.integrationKey}-${connection.provider}-${connection.updatedAt}`}
                connection={connection}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className={subsectionTitleClassName}>
          {copy.duplicateAccountsTitle}
        </h3>
        {user.duplicateExternalAccounts.length === 0 ? (
          <p className="text-sm text-tertiary-alt">{copy.duplicateAccountsEmpty}</p>
        ) : (
          <div className="space-y-2">
            {user.duplicateExternalAccounts.map((group) => (
              <DuplicateGroupRow
                key={`${group.provider}-${group.externalAccountId}`}
                group={group}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

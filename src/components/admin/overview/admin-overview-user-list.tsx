"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminOverviewUserDetails } from "@/src/components/admin/overview/admin-overview-user-details";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { Badge } from "@/src/components/ui/badge";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { matchesSearchQuery } from "@/src/lib/text-utils";
import { cn } from "@/src/lib/utils";
import type {
  AdminDuplicateExternalAccountSummary,
  AdminOperationalOverviewUserSummary,
} from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminOverview;

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

const ownerInitials = (ownerId: string) => {
  const local = ownerId.split("@")[0] ?? ownerId;
  const parts = local.split(/[.\-_]/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || ownerId.trim().charAt(0).toUpperCase() || "?";
};

const OwnerAvatar = ({ ownerId }: { ownerId: string }) => (
  <span
    role="img"
    aria-label={`${ownerId} avatar`}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs font-semibold tracking-[0.14em] text-white"
  >
    {ownerInitials(ownerId)}
  </span>
);

const duplicateGroupKey = (group: AdminDuplicateExternalAccountSummary) =>
  `${group.provider}:${group.externalAccountId}`;

const matchesUserSearch = (user: AdminOperationalOverviewUserSummary, query: string) =>
  matchesSearchQuery(
    [
      user.ownerId,
      ...user.integrations,
      ...user.providers,
      ...user.connections.map((connection) => connection.displayName),
      ...user.connections.map((connection) => connection.externalAccountId),
      ...user.duplicateExternalAccounts.map((group) => group.provider),
      ...user.duplicateExternalAccounts.map((group) => group.externalAccountId),
    ],
    query,
  );

const matchesDuplicateSearch = (
  group: AdminDuplicateExternalAccountSummary,
  query: string,
) =>
  matchesSearchQuery(
    [
      group.provider,
      group.externalAccountId,
      ...group.ownerIds,
      ...(group.displayNames ?? []),
    ],
    query,
  );

const duplicateOwnerCount = (group: AdminDuplicateExternalAccountSummary) =>
  group.ownerCount ?? group.ownerIds.length;

interface UserDetailsModalProps {
  user: AdminOperationalOverviewUserSummary;
  onClose: () => void;
}

const UserDetailsModal = ({ user, onClose }: UserDetailsModalProps) => (
  <ModalBackdrop ariaLabel={copy.userDetailModalAriaLabel(user.ownerId)} onClose={onClose}>
    <section
      data-testid={`admin-overview-user-modal-${user.ownerId}`}
      className={cn(modalShellClassName("xl"), "min-h-0 max-h-[90vh] gap-0")}
    >
      <ModalCloseButton
        onClose={onClose}
        testId={`admin-overview-user-modal-close-${user.ownerId}`}
      />

      <header className="shrink-0 border-b border-[var(--oh-border)] px-7 pb-4 pt-7 pr-12">
        <div className="flex items-start gap-3">
          <OwnerAvatar ownerId={user.ownerId} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">{user.ownerId}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {copy.connectionCount(
                user.totalConnections,
                pluralize(user.totalConnections, copy.connectionLabel, copy.connectionsLabel),
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{copy.pendingAccessRequestsLabel}: {user.pendingAccessRequests}</Badge>
              <Badge>{copy.notificationsLabel}: {user.notifications}</Badge>
              {user.duplicateExternalAccounts.length > 0 ? (
                <Badge tone="warning">
                  {copy.duplicateGroupCount(user.duplicateExternalAccounts.length)}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-5">
        <AdminOverviewUserDetails user={user} />
      </div>

      <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
        <BrandButton type="button" variant="secondary" onClick={onClose}>
          {copy.userDetailCloseLabel}
        </BrandButton>
      </div>
    </section>
  </ModalBackdrop>
);

interface DuplicateGroupModalProps {
  group: AdminDuplicateExternalAccountSummary;
  onClose: () => void;
  onSelectOwner: (ownerId: string) => void;
}

const DuplicateGroupModal = ({
  group,
  onClose,
  onSelectOwner,
}: DuplicateGroupModalProps) => {
  const ownerCount = duplicateOwnerCount(group);
  const displayNames = group.displayNames ?? [];

  return (
    <ModalBackdrop
      ariaLabel={copy.duplicateGroupModalAriaLabel(group.provider, group.externalAccountId)}
      onClose={onClose}
    >
      <section
        data-testid="admin-overview-duplicate-group-modal"
        className={cn(modalShellClassName("lg"), "min-h-0 max-h-[90vh] gap-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="admin-overview-duplicate-group-modal-close"
        />

        <header className="shrink-0 border-b border-[var(--oh-border)] px-7 pb-4 pt-7 pr-12">
          <h2 className="text-base font-semibold text-white">{group.provider}</h2>
          <p className="mt-1 text-xs leading-5 text-tertiary-light">
            {group.externalAccountId} · {copy.duplicateOwnerCount(ownerCount)}
          </p>
          {displayNames.length > 0 ? (
            <p className="mt-2 text-xs text-tertiary-light">{displayNames.join(", ")}</p>
          ) : null}
        </header>

        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-5">
          <h3 className="text-sm font-semibold text-white">{copy.duplicateOwnersLabel}</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
            {group.ownerIds.map((ownerId) => (
              <button
                key={ownerId}
                type="button"
                onClick={() => onSelectOwner(ownerId)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-[var(--color-interactive-hover)]"
              >
                <span className="min-w-0 truncate">{ownerId}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-tertiary-light" />
              </button>
            ))}
          </div>
        </div>

        <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {copy.userDetailCloseLabel}
          </BrandButton>
        </div>
      </section>
    </ModalBackdrop>
  );
};

interface AdminOverviewUserListProps {
  users: AdminOperationalOverviewUserSummary[];
  duplicateGroups: AdminDuplicateExternalAccountSummary[];
}

export function AdminOverviewUserList({
  users,
  duplicateGroups,
}: AdminOverviewUserListProps) {
  const [search, setSearch] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  const visibleUsers = useMemo(
    () => users.filter((user) => matchesUserSearch(user, search)),
    [users, search],
  );

  const visibleDuplicateGroups = useMemo(
    () => duplicateGroups.filter((group) => matchesDuplicateSearch(group, search)),
    [duplicateGroups, search],
  );

  const selectedUser = selectedOwnerId
    ? users.find((user) => user.ownerId === selectedOwnerId) ?? null
    : null;

  const selectedGroup = selectedGroupKey
    ? duplicateGroups.find((group) => duplicateGroupKey(group) === selectedGroupKey) ?? null
    : null;

  return (
    <div data-testid="admin-overview-users-card" className="min-w-0">
      <IntegrationsSearchInput
        testId="admin-overview-search"
        value={search}
        onChange={setSearch}
        placeholder={copy.usersSearchPlaceholder}
        ariaLabel={copy.usersSearchPlaceholder}
        className="w-full"
      />

      <div className="mt-4">
        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
            {copy.noUsersYet}
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
            {copy.usersSearchEmpty}
          </div>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
            {visibleUsers.map((user) => {
              const isOpen = selectedOwnerId === user.ownerId;
              const duplicateCount = user.duplicateExternalAccounts.length;
              const rowMeta = [
                copy.connectionCount(
                  user.totalConnections,
                  pluralize(user.totalConnections, copy.connectionLabel, copy.connectionsLabel),
                ),
                `${user.pendingAccessRequests} ${copy.pendingLabel}`,
                copy.notificationsInline(user.notifications),
                duplicateCount > 0 ? copy.duplicateGroupCount(duplicateCount) : null,
              ].filter(Boolean).join(" · ");

              return (
                <div key={user.ownerId} data-testid="admin-overview-user-row">
                  <button
                    type="button"
                    onClick={() => setSelectedOwnerId(user.ownerId)}
                    aria-expanded={isOpen}
                    aria-haspopup="dialog"
                    className={cn(
                      "flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-interactive-hover)]",
                      isOpen && "bg-[var(--color-interactive-hover)]",
                    )}
                  >
                    <span className="shrink-0 font-medium text-white">{user.ownerId}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-tertiary-light">
                      {rowMeta}
                    </span>
                    <ChevronRight
                      data-testid="admin-overview-user-row-caret"
                      className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {duplicateGroups.length > 0 ? (
        <div data-testid="admin-overview-duplicates-card" className="mt-6">
          <h2 className="text-base font-semibold text-foreground">
            {copy.duplicateAccountsDeploymentTitle}
          </h2>
          <p className="mt-1 text-sm leading-5 text-tertiary-light">
            {copy.duplicateAccountsDeploymentDescription}
          </p>
          <div className="mt-3">
            {visibleDuplicateGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
                {copy.duplicateGroupsSearchEmpty}
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
                {visibleDuplicateGroups.map((group) => {
                  const groupKey = duplicateGroupKey(group);
                  const isOpen = selectedGroupKey === groupKey;
                  const ownerCount = duplicateOwnerCount(group);
                  const rowMeta = [
                    group.externalAccountId,
                    copy.duplicateOwnerCount(ownerCount),
                    group.ownerIds.join(", "),
                  ].join(" · ");

                  return (
                    <div
                      key={groupKey}
                      data-testid="admin-overview-duplicate-group-row"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedGroupKey(groupKey)}
                        aria-expanded={isOpen}
                        aria-haspopup="dialog"
                        className={cn(
                          "flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-interactive-hover)]",
                          isOpen && "bg-[var(--color-interactive-hover)]",
                        )}
                      >
                        <span className="shrink-0 font-medium text-white">
                          {group.provider}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-tertiary-light">
                          {rowMeta}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-tertiary-light" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedOwnerId(null)} />
      ) : null}
      {selectedGroup && !selectedUser ? (
        <DuplicateGroupModal
          group={selectedGroup}
          onClose={() => setSelectedGroupKey(null)}
          onSelectOwner={(ownerId) => {
            setSelectedGroupKey(null);
            setSelectedOwnerId(ownerId);
          }}
        />
      ) : null}
    </div>
  );
}

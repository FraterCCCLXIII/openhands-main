"use client";

import React from "react";
import { MoreVertical } from "lucide-react";

import { DeletePermissionProfileModal } from "@/src/components/permission-profiles/delete-permission-profile-modal";
import { PermissionProfileActionsMenu } from "@/src/components/permission-profiles/permission-profile-actions-menu";
import { PermissionProfileApiKeyField } from "@/src/components/permission-profiles/permission-profile-api-key-field";
import {
  formatPermissionProfileSummary,
  formatPermissionProfileUpdatedAt,
  isDefaultPermissionProfile,
  permissionProfileLabel,
} from "@/src/components/permission-profiles/permission-profile-utils";
import { SemanticStatusPill } from "@/src/components/ui/semantic-status-pill";
import { cn } from "@/src/lib/utils";
import {
  settingsListIconActionButtonClassName,
  settingsListRowClassName,
} from "@/src/styles/settings-list-classes";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface SavedPermissionProfileRowProps {
  profile: PermissionProfile;
  actionPending?: boolean;
  onLoadProfile?: (profile: PermissionProfile) => void;
  onUpdateProfile?: (profile: PermissionProfile) => void;
  onDeleteProfile?: (profile: PermissionProfile) => void;
}

export function SavedPermissionProfileRow({
  profile,
  actionPending = false,
  onLoadProfile,
  onUpdateProfile,
  onDeleteProfile,
}: SavedPermissionProfileRowProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const label = permissionProfileLabel(profile);
  const updatedAtLabel = formatPermissionProfileUpdatedAt(profile);
  const summary = formatPermissionProfileSummary(profile);
  const isDefault = isDefaultPermissionProfile(profile);

  return (
    <div
      data-testid={`permission-profile-row-${profile.id}`}
      className={cn(
        settingsListRowClassName,
        "h-auto min-h-12 flex-col items-stretch gap-3 py-3 sm:flex-row sm:items-center sm:gap-4",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="min-w-0 truncate text-sm font-medium text-white"
            title={label}
          >
            {label}
          </span>
          {isDefault ? (
            <SemanticStatusPill variant="success" className="shrink-0">
              Default
            </SemanticStatusPill>
          ) : null}
          <span
            className="text-xs text-[var(--oh-text-dim)]"
            title={`Updated ${updatedAtLabel}`}
          >
            Updated {updatedAtLabel}
          </span>
        </div>
        <p
          className="mt-1 truncate text-xs text-[var(--oh-text-dim)]"
          title={summary}
        >
          {summary}
        </p>
      </div>

      <div className="flex w-full items-center gap-2 sm:contents">
        <PermissionProfileApiKeyField
          profile={profile}
          className="w-full sm:w-auto"
        />

        <div className="relative shrink-0">
          <button
            ref={menuTriggerRef}
            type="button"
            data-testid={`permission-profile-menu-trigger-${profile.id}`}
            aria-label={`${label} actions`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            disabled={actionPending}
            onClick={() => setIsMenuOpen((open) => !open)}
            className={settingsListIconActionButtonClassName}
          >
            <MoreVertical aria-hidden className="size-4" strokeWidth={2} />
          </button>

          {isMenuOpen ? (
            <PermissionProfileActionsMenu
              profileName={label}
              anchorRef={menuTriggerRef}
              onClose={() => setIsMenuOpen(false)}
              onLoadProfile={() => onLoadProfile?.(profile)}
              onUpdateFromCurrent={() => onUpdateProfile?.(profile)}
              onDelete={() => setIsDeleteModalOpen(true)}
              isDeleteDisabled={isDefault}
            />
          ) : null}
        </div>
      </div>

      {isDeleteModalOpen ? (
        <DeletePermissionProfileModal
          profile={profile}
          actionPending={actionPending}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => onDeleteProfile?.(profile)}
        />
      ) : null}
    </div>
  );
}

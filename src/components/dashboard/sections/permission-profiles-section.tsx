"use client";

import { SavePermissionsModal } from "@/src/components/permission-profiles/save-permissions-modal";
import { SavedPermissionProfilesList } from "@/src/components/permission-profiles/saved-permission-profiles-list";
import { PERMISSION_PROFILES_PAGE_COPY } from "@/src/constants/permission-profiles-page";
import { cn } from "@/src/lib/utils";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface PermissionProfilesSectionProps {
  profiles: PermissionProfile[];
  isPending: boolean;
  errorMessage?: string | null;
  actionPending: boolean;
  isSaveModalOpen: boolean;
  onCloseSaveModal: () => void;
  onOpenSaveModal: () => void;
  onSaveProfile: (profileName: string) => void;
  onLoadProfile: (profile: PermissionProfile) => void;
  onUpdateProfile: (profile: PermissionProfile) => void;
  onDeleteProfile: (profile: PermissionProfile) => void;
}

export function PermissionProfilesSection({
  profiles,
  isPending,
  errorMessage,
  actionPending,
  isSaveModalOpen,
  onCloseSaveModal,
  onOpenSaveModal,
  onSaveProfile,
  onLoadProfile,
  onUpdateProfile,
  onDeleteProfile,
}: PermissionProfilesSectionProps) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          data-testid="permission-profiles-new-profile"
          disabled={actionPending}
          onClick={onOpenSaveModal}
          className={cn(
            formControlButtonClassName,
            "shrink-0 border border-[var(--oh-border)] bg-base-secondary text-white hover:bg-surface-raised",
          )}
        >
          {PERMISSION_PROFILES_PAGE_COPY.newProfileButton}
        </button>
      </div>

      <SavedPermissionProfilesList
        profiles={profiles}
        isPending={isPending}
        errorMessage={errorMessage}
        actionPending={actionPending}
        onLoadProfile={onLoadProfile}
        onUpdateProfile={onUpdateProfile}
        onDeleteProfile={onDeleteProfile}
      />

      {isSaveModalOpen ? (
        <SavePermissionsModal
          actionPending={actionPending}
          onClose={onCloseSaveModal}
          onSave={onSaveProfile}
        />
      ) : null}
    </>
  );
}

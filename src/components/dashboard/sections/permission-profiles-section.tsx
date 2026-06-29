"use client";

import { SavePermissionsModal } from "@/src/components/permission-profiles/save-permissions-modal";
import { SavedPermissionProfilesList } from "@/src/components/permission-profiles/saved-permission-profiles-list";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface PermissionProfilesSectionProps {
  profiles: PermissionProfile[];
  isPending: boolean;
  errorMessage?: string | null;
  actionPending: boolean;
  isSaveModalOpen: boolean;
  onCloseSaveModal: () => void;
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
  onSaveProfile,
  onLoadProfile,
  onUpdateProfile,
  onDeleteProfile,
}: PermissionProfilesSectionProps) {
  return (
    <>
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

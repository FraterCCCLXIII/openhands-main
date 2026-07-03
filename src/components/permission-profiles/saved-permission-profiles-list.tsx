import { SavedPermissionProfileRow } from "@/src/components/permission-profiles/saved-permission-profile-row";
import { PERMISSION_PROFILES_PAGE_COPY } from "@/src/constants/permission-profiles-page";
import { cn } from "@/src/lib/utils";
import { extensionModuleEmptyStateClassName } from "@/src/styles/extension-module-card-classes";
import {
  settingsListContainerClassName,
  settingsListDividerClassName,
} from "@/src/styles/settings-list-classes";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface SavedPermissionProfilesListProps {
  profiles: PermissionProfile[];
  isPending?: boolean;
  errorMessage?: string | null;
  actionPending?: boolean;
  onLoadProfile?: (profile: PermissionProfile) => void;
  onUpdateProfile?: (profile: PermissionProfile) => void;
  onDeleteProfile?: (profile: PermissionProfile) => void;
}

export function SavedPermissionProfilesList({
  profiles,
  isPending = false,
  errorMessage = null,
  actionPending = false,
  onLoadProfile,
  onUpdateProfile,
  onDeleteProfile,
}: SavedPermissionProfilesListProps) {
  return (
    <section data-testid="saved-permission-profiles-section">
      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] px-3 py-2 text-sm text-[var(--oh-color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? (
        <p className="text-sm text-[var(--oh-text-secondary)]">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className={extensionModuleEmptyStateClassName}>
          <p className="text-sm text-muted">
            {PERMISSION_PROFILES_PAGE_COPY.savedProfilesEmpty}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            settingsListContainerClassName,
            settingsListDividerClassName,
          )}
        >
          {profiles.map((profile) => (
            <SavedPermissionProfileRow
              key={profile.id}
              profile={profile}
              actionPending={actionPending}
              onLoadProfile={onLoadProfile}
              onUpdateProfile={onUpdateProfile}
              onDeleteProfile={onDeleteProfile}
            />
          ))}
        </div>
      )}
    </section>
  );
}

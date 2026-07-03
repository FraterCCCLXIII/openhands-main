import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import {
  permissionProfileLabel,
} from "@/src/components/permission-profiles/permission-profile-utils";
import { PERMISSION_PROFILES_PAGE_COPY } from "@/src/constants/permission-profiles-page";
import { cn } from "@/src/lib/utils";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface DeletePermissionProfileModalProps {
  profile: PermissionProfile;
  onClose: () => void;
  onConfirm: () => void;
  actionPending?: boolean;
}

export function DeletePermissionProfileModal({
  profile,
  onClose,
  onConfirm,
  actionPending = false,
}: DeletePermissionProfileModalProps) {
  const handleConfirm = () => {
    if (actionPending) return;
    onConfirm();
    onClose();
  };

  const label = permissionProfileLabel(profile);

  return (
    <ModalBackdrop
      ariaLabel={PERMISSION_PROFILES_PAGE_COPY.deleteModalAriaLabel}
      onClose={onClose}
    >
      <div
        data-testid="delete-permission-profile-modal"
        className={cn(
          "relative flex w-[520px] max-w-[90vw] flex-col gap-4",
          "rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6",
        )}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="delete-permission-profile-modal-close"
        />

        <h2 className="pr-6 text-base font-semibold text-white">
          {PERMISSION_PROFILES_PAGE_COPY.deleteModalTitle}
        </h2>

        <p className="text-sm leading-5 text-tertiary-light">
          {PERMISSION_PROFILES_PAGE_COPY.deleteModalDescription(label)}
        </p>

        <div className="mt-2 flex justify-end gap-2">
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {PERMISSION_PROFILES_PAGE_COPY.cancel}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            className="bg-danger text-white hover:opacity-80"
            isDisabled={actionPending}
            onClick={handleConfirm}
          >
            {PERMISSION_PROFILES_PAGE_COPY.deleteConfirm}
          </BrandButton>
        </div>
      </div>
    </ModalBackdrop>
  );
}

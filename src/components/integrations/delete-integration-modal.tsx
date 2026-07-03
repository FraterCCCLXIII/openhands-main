import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { Button } from "@/src/components/ui/button";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { cn } from "@/src/lib/utils";
import type { IntegrationSpec } from "@/src/types/integrations-hub";

interface DeleteIntegrationModalProps {
  integration: IntegrationSpec;
  onClose: () => void;
  onConfirm: () => void;
  actionPending?: boolean;
}

export function DeleteIntegrationModal({
  integration,
  onClose,
  onConfirm,
  actionPending = false,
}: DeleteIntegrationModalProps) {
  const handleConfirm = () => {
    if (actionPending) {
      return;
    }

    onConfirm();
    onClose();
  };

  return (
    <ModalBackdrop
      ariaLabel={INTEGRATIONS_PAGE_COPY.deleteModalAriaLabel}
      onClose={onClose}
    >
      <div
        data-testid="delete-integration-modal"
        className={cn(
          "relative flex w-[520px] max-w-[90vw] flex-col gap-4",
          "rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6",
        )}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="delete-integration-modal-close"
        />

        <h2 className="pr-6 text-base font-semibold text-white">
          {INTEGRATIONS_PAGE_COPY.deleteModalTitle}
        </h2>

        <p className="text-sm leading-5 text-tertiary-light">
          {INTEGRATIONS_PAGE_COPY.deleteModalDescription(integration.name)}
        </p>

        <div className="mt-2 flex justify-end gap-2">
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {INTEGRATIONS_PAGE_COPY.cancel}
          </BrandButton>
          <Button
            type="button"
            variant="danger"
            disabled={actionPending}
            data-testid="delete-integration-modal-confirm"
            onClick={handleConfirm}
          >
            {INTEGRATIONS_PAGE_COPY.deleteConfirm}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

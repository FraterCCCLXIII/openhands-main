"use client";

import { IntegrationWizard } from "@/src/components/integrations/wizard/wizard";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalShellClassName } from "@/src/components/ui/modal-shell";
import { type AdminSection } from "@/src/lib/admin-routes";

interface IntegrationWizardModalProps {
  isAdmin: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
  redirectSection?: AdminSection;
}

export function IntegrationWizardModal({
  isAdmin,
  onClose,
  onCreated,
  onStatus,
  redirectSection = "integrations",
}: IntegrationWizardModalProps) {
  return (
    <ModalBackdrop
      ariaLabel={INTEGRATIONS_PAGE_COPY.wizardModalAriaLabel}
      onClose={onClose}
    >
      <section
        data-testid="integration-wizard-modal"
        className={modalShellClassName("xl")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="integration-wizard-modal-close"
        />
        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-7">
          <IntegrationWizard
            isAdmin={isAdmin}
            onCreated={onCreated}
            onStatus={onStatus}
            redirectSection={redirectSection}
          />
        </div>
      </section>
    </ModalBackdrop>
  );
}

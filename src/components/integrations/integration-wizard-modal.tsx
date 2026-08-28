"use client";

import { useSearchParams } from "next/navigation";

import { IntegrationWizard } from "@/src/components/integrations/wizard/wizard";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalShellClassName } from "@/src/components/ui/modal-shell";
import { cn } from "@/src/lib/utils";
import { type AdminSection } from "@/src/lib/admin-routes";
import { getWizardFlow } from "@/src/components/integrations/wizard/utils";

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
  const searchParams = useSearchParams();
  const flow = getWizardFlow(searchParams);

  return (
    <ModalBackdrop
      ariaLabel={INTEGRATIONS_PAGE_COPY.wizardModalAriaLabel}
      onClose={onClose}
    >
      <section
        data-testid="integration-wizard-modal"
        data-flow={flow}
        className={cn(modalShellClassName("xl"), "gap-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="integration-wizard-modal-close"
        />

        <div className="flex min-h-0 flex-col overflow-hidden">
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

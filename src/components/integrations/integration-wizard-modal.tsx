"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { IntegrationWizard } from "@/src/components/integrations/wizard/wizard";
import { WizardProgressBar } from "@/src/components/integrations/wizard/wizard-progress-bar";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalShellClassName } from "@/src/components/ui/modal-shell";
import { cn } from "@/src/lib/utils";
import { type AdminSection } from "@/src/lib/admin-routes";
import type { OAuthReturnStatus } from "@/src/components/integrations/wizard/shared";
import {
  getWizardFlow,
  type WizardStep,
} from "@/src/components/integrations/wizard/utils";

interface IntegrationWizardModalProps {
  isAdmin: boolean;
  oauthStatus?: OAuthReturnStatus | null;
  onClose: () => void;
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
  redirectSection?: AdminSection;
}

function getWizardStepId(step: WizardStep): "chooseType" | "connect" | "review" {
  if (step === 1) {
    return "chooseType";
  }
  if (step === 2) {
    return "connect";
  }
  return "review";
}

export function IntegrationWizardModal({
  isAdmin,
  oauthStatus = null,
  onClose,
  onCreated,
  onStatus,
  redirectSection = "integrations",
}: IntegrationWizardModalProps) {
  const searchParams = useSearchParams();
  const flow = getWizardFlow(searchParams);
  const [currentStep] = useState<WizardStep>(() =>
    flow === "catalog" ? 2 : 1,
  );

  return (
    <ModalBackdrop
      ariaLabel={INTEGRATIONS_PAGE_COPY.wizardModalAriaLabel}
      onClose={onClose}
    >
      <section
        data-testid="integration-wizard-modal"
        data-current-step={getWizardStepId(currentStep)}
        data-flow={flow}
        className={cn(modalShellClassName("xl"), "gap-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="integration-wizard-modal-close"
        />

        <header className="flex shrink-0 flex-col gap-3 px-7 pb-4 pt-7 pr-12">
          <WizardProgressBar currentStep={currentStep} flow={flow} />
        </header>

        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-7">
          <IntegrationWizard
            isAdmin={isAdmin}
            oauthStatus={oauthStatus}
            onCreated={onCreated}
            onStatus={onStatus}
            redirectSection={redirectSection}
          />
        </div>
      </section>
    </ModalBackdrop>
  );
}

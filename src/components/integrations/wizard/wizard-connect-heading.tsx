import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { WizardStepInfoPopover } from "@/src/components/integrations/wizard/wizard-step-info-popover";
import type { IntegrationKind } from "@/src/components/integrations/wizard/utils";

export type WizardStepHeadingVariant = "connect" | "review";

interface WizardStepHeadingProps {
  variant: WizardStepHeadingVariant;
  kind: IntegrationKind | null;
}

const HEADING_COPY: Record<
  WizardStepHeadingVariant,
  { title: string; description: string }
> = {
  connect: {
    title: INTEGRATIONS_PAGE_COPY.wizardConnectStepTitle,
    description: INTEGRATIONS_PAGE_COPY.wizardConnectStepDescription,
  },
  review: {
    title: INTEGRATIONS_PAGE_COPY.wizardReviewStepTitle,
    description: INTEGRATIONS_PAGE_COPY.wizardReviewStepDescription,
  },
};

export function WizardStepHeading({ variant, kind }: WizardStepHeadingProps) {
  const { title, description } = HEADING_COPY[variant];

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {variant === "connect" ? <WizardStepInfoPopover kind={kind} /> : null}
      </div>
      <p className="text-sm text-muted">{description}</p>
    </header>
  );
}

import { cn } from "@/src/lib/utils";
import {
  getWizardProgressIndex,
  getWizardTotalSteps,
  type WizardFlow,
  type WizardStep,
} from "@/src/components/integrations/wizard/utils";

interface WizardProgressBarProps {
  currentStep: WizardStep;
  flow?: WizardFlow;
  className?: string;
}

export function WizardProgressBar({
  currentStep,
  flow = "add",
  className,
}: WizardProgressBarProps) {
  const totalSteps = getWizardTotalSteps(flow);
  const progressIndex = getWizardProgressIndex(flow, currentStep);

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={progressIndex + 1}
      data-testid="integration-wizard-progress-bar"
      data-flow={flow}
      className={cn("flex w-full items-center gap-2", className)}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const isCompleted = index < progressIndex;
        const isCurrent = index === progressIndex;

        return (
          <div
            key={index}
            data-testid={`integration-wizard-progress-step-${index}`}
            data-state={
              isCompleted ? "completed" : isCurrent ? "current" : "upcoming"
            }
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              isCompleted || isCurrent ? "bg-white" : "bg-white/15",
            )}
          />
        );
      })}
    </div>
  );
}

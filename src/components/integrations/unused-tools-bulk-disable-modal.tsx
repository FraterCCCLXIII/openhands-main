"use client";

import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import {
  formatBulkDisableDescription,
  formatToolsMatchedLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { Button } from "@/src/components/ui/button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { dashboardInputClassName } from "@/src/components/dashboard/shared";
import {
  UNUSED_TOOL_WINDOW_OPTIONS,
} from "@/src/components/dashboard/utils";
import { cn } from "@/src/lib/utils";
import type { UnusedToolWindowUnit } from "@/src/types/integrations-hub";

interface UnusedToolsBulkDisableModalProps {
  unusedCutoffDateLabel: string;
  unusedToolCandidateCount: number;
  unusedThresholdUnit: UnusedToolWindowUnit;
  unusedThresholdValue: string;
  isBulkDisablePending: boolean;
  onClose: () => void;
  onDisable: () => void;
  onUnusedThresholdValueChange: (value: string) => void;
  onUnusedThresholdUnitChange: (value: UnusedToolWindowUnit) => void;
  onUnusedThresholdBlur: () => void;
}

export function UnusedToolsBulkDisableModal({
  unusedCutoffDateLabel,
  unusedToolCandidateCount,
  unusedThresholdUnit,
  unusedThresholdValue,
  isBulkDisablePending,
  onClose,
  onDisable,
  onUnusedThresholdValueChange,
  onUnusedThresholdUnitChange,
  onUnusedThresholdBlur,
}: UnusedToolsBulkDisableModalProps) {
  return (
    <ModalBackdrop
      ariaLabel={INTEGRATIONS_PAGE_COPY.bulkDisableModalAriaLabel}
      onClose={onClose}
    >
      <section
        data-testid="unused-tools-bulk-disable-modal"
        className={modalShellClassName("lg")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="unused-tools-bulk-disable-modal-close"
        />

        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-7">
          <div className="space-y-1 pr-8">
            <h2 className="text-base font-semibold text-white">
              {INTEGRATIONS_PAGE_COPY.bulkDisableTitle}
            </h2>
            <p className="text-xs leading-5 text-[var(--oh-text-secondary)]">
              {formatBulkDisableDescription(unusedCutoffDateLabel)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
            <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
              <span>{INTEGRATIONS_PAGE_COPY.bulkDisableUnusedForLabel}</span>
              <input
                type="number"
                min={1}
                max={3650}
                inputMode="numeric"
                value={unusedThresholdValue}
                aria-label="Unused threshold value"
                onChange={(event) => onUnusedThresholdValueChange(event.target.value)}
                onBlur={onUnusedThresholdBlur}
                className={cn(dashboardInputClassName, "w-28")}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
              <span>{INTEGRATIONS_PAGE_COPY.bulkDisableWindowLabel}</span>
              <SelectDropdown
                testId="unused-tools-threshold-unit-select"
                value={unusedThresholdUnit}
                ariaLabel="Unused threshold unit"
                onChange={(nextValue) =>
                  onUnusedThresholdUnitChange(nextValue as UnusedToolWindowUnit)
                }
                options={UNUSED_TOOL_WINDOW_OPTIONS}
                className="w-32"
              />
            </label>
            <p
              data-testid="unused-tools-matched-count"
              className="text-xs text-[var(--oh-text-secondary)] md:ml-auto md:pb-2"
            >
              {formatToolsMatchedLabel(unusedToolCandidateCount)}
            </p>
          </div>

          <div className={cn(modalFooterActionsClassName, "mt-6")}>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={onDisable}
              disabled={isBulkDisablePending}
              aria-label="Disable unused tools"
            >
              {INTEGRATIONS_PAGE_COPY.bulkDisableDisableButton}
            </Button>
          </div>
        </div>
      </section>
    </ModalBackdrop>
  );
}

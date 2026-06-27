import { Eraser } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CompactPanel,
  dashboardInputClassName,
} from "@/src/components/dashboard/shared";
import { Button } from "@/src/components/ui/button";
import {
  UNUSED_TOOL_WINDOW_OPTIONS,
  buildUnusedToolCandidates,
  subtractUnusedWindow,
} from "@/src/components/dashboard/utils";
import { cn } from "@/src/lib/utils";
import type { IntegrationSpec, UnusedToolWindowUnit } from "@/src/types/integrations-hub";

interface BulkDisablePanelProps {
  integrations: IntegrationSpec[];
  isPending: boolean;
  onDisable: (thresholdValue: number, thresholdUnit: UnusedToolWindowUnit) => void;
  onStatus: (message: string) => void;
}

export const BulkDisablePanel = ({
  integrations,
  isPending,
  onDisable,
  onStatus,
}: BulkDisablePanelProps) => {
  // Local threshold state so keystrokes only re-render this panel, not the
  // integration cards in the sibling "Your integrations" panel.
  const [thresholdValue, setThresholdValue] = useState("30");
  const [thresholdUnit, setThresholdUnit] = useState<UnusedToolWindowUnit>("days");

  const normalizedThresholdValue = useMemo(() => {
    const parsed = Number(thresholdValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 30;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), 3650);
  }, [thresholdValue]);

  const cutoffDate = useMemo(
    () => subtractUnusedWindow(new Date(), normalizedThresholdValue, thresholdUnit),
    [normalizedThresholdValue, thresholdUnit],
  );

  const candidateCount = useMemo(
    () => buildUnusedToolCandidates({ integrations, cutoffDate }).length,
    [integrations, cutoffDate],
  );

  const handleBlur = () => {
    setThresholdValue(String(normalizedThresholdValue));
  };

  const handleDisable = () => {
    if (candidateCount === 0) {
      onStatus("No tracked tools matched the selected unused window.");
      return;
    }
    onDisable(normalizedThresholdValue, thresholdUnit);
  };

  return (
    <CompactPanel title="Disable unused tools" icon={Eraser}>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-6">
          <div className="space-y-1 xl:max-w-2xl">
            <h4 className="text-sm font-semibold text-white">
              One-time bulk disable for unused tools
            </h4>
            <p className="text-xs leading-6 text-[var(--color-text-base)]">
              Disable enabled tools with tracked usage that has been inactive
              since before {cutoffDate.toLocaleDateString()}. Tools without tracked
              invocation history are skipped until new tracking data exists.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end md:gap-3 xl:flex-nowrap">
            <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
              <span>Unused for at least</span>
              <input
                type="number"
                min={1}
                max={3650}
                inputMode="numeric"
                value={thresholdValue}
                aria-label="Unused threshold value"
                onChange={(event) => setThresholdValue(event.target.value)}
                onBlur={handleBlur}
                className={cn(dashboardInputClassName, "w-28")}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
              <span>Window</span>
              <select
                value={thresholdUnit}
                aria-label="Unused threshold unit"
                onChange={(event) =>
                  setThresholdUnit(event.target.value as UnusedToolWindowUnit)
                }
                className={cn(dashboardInputClassName, "w-32")}
              >
                {UNUSED_TOOL_WINDOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs text-[var(--color-text-base)]">
                {candidateCount} tool{candidateCount === 1 ? "" : "s"} matched
              </p>
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 rounded-md px-4 text-xs"
                onClick={handleDisable}
                disabled={isPending}
                aria-label="Disable unused tools"
              >
                Disable
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CompactPanel>
  );
};

import { ChevronRight } from "lucide-react";

import { ToolAccessBulkActionsMenu } from "@/src/components/integrations/tool-access-bulk-actions-menu";
import {
  getToolAccessMode,
  ToolRow,
} from "@/src/components/integrations/tool-access-controls";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { Button } from "@/src/components/ui/button";
import { modalFooterActionsClassName } from "@/src/components/ui/modal-shell";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import type { ToolAccessMode, ToolSpec } from "@/src/types/integrations-hub";

interface ReviewStepProps {
  createPending: boolean;
  filteredReviewedTools: Array<[string, ToolSpec]>;
  toolModes: Record<string, ToolAccessMode>;
  toolSearch: string;
  hasMatchingTools: boolean;
  matchingToolNames: string[];
  reviewedTools: Array<[string, ToolSpec]>;
  selectedToolCount: number;
  selectedToolNames: string[];
  selectedTools: Record<string, boolean>;
  selectedMatchingCount: number;
  allMatchingSelected: boolean;
  expandedTools: Record<string, boolean>;
  onBack: () => void;
  onCreate: () => void;
  onToolSearchChange: (value: string) => void;
  onSetAccessModeForTools: (
    names: string[],
    accessMode: ToolAccessMode,
  ) => void;
  onSetToolMode: (name: string, nextMode: ToolAccessMode) => void;
  onSetSelectedTools: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSetSelectedStateForTools: (names: string[], selected: boolean) => void;
  onToggleToolExpanded: (name: string) => void;
}

export const ReviewStep = ({
  createPending,
  filteredReviewedTools,
  toolModes,
  toolSearch,
  hasMatchingTools,
  matchingToolNames,
  reviewedTools,
  selectedToolCount,
  selectedToolNames,
  selectedTools,
  selectedMatchingCount,
  allMatchingSelected,
  expandedTools,
  onBack,
  onCreate,
  onToolSearchChange,
  onSetAccessModeForTools,
  onSetToolMode,
  onSetSelectedTools,
  onSetSelectedStateForTools,
  onToggleToolExpanded,
}: ReviewStepProps) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
    {reviewedTools.length === 0 ? (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
        No tools were discovered for this connector. Go back and confirm the
        selected managed connector or MCP server URL.
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-stretch gap-2">
          <IntegrationsSearchInput
            value={toolSearch}
            onChange={onToolSearchChange}
            placeholder={INTEGRATIONS_PAGE_COPY.wizardSearchToolsPlaceholder}
            ariaLabel={INTEGRATIONS_PAGE_COPY.wizardSearchToolsPlaceholder}
            testId="wizard-tools-search"
            className="min-w-0 flex-1"
          />
          <ToolAccessBulkActionsMenu
            canSelectAll={hasMatchingTools && !allMatchingSelected}
            canDeselect={hasMatchingTools && selectedMatchingCount > 0}
            canChangeAccess={selectedToolCount > 0}
            onSelectAll={() =>
              onSetSelectedStateForTools(matchingToolNames, true)
            }
            onDeselect={() =>
              onSetSelectedStateForTools(matchingToolNames, false)
            }
            onEnableSelected={() =>
              onSetAccessModeForTools(selectedToolNames, "enabled")
            }
            onCaseByCaseSelected={() =>
              onSetAccessModeForTools(selectedToolNames, "approval_required")
            }
            onDisableSelected={() =>
              onSetAccessModeForTools(selectedToolNames, "disabled")
            }
          />
        </div>

        {filteredReviewedTools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
            No tools match this search. Try a different term.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--oh-border)] bg-[var(--oh-bg-input)]">
            <div className="divide-y divide-[var(--oh-border)]">
              {filteredReviewedTools.map(([name, toolSpec]) => {
                const accessMode =
                  toolModes[name] ?? getToolAccessMode(toolSpec);
                const isSelected = selectedTools[name] ?? false;

                return (
                  <ToolRow
                    key={name}
                    name={name}
                    toolSpec={toolSpec}
                    accessMode={accessMode}
                    onAccessModeChange={(nextMode) => onSetToolMode(name, nextMode)}
                    selected={isSelected}
                    onToggleSelected={(checked) =>
                      onSetSelectedTools((current) => ({
                        ...current,
                        [name]: checked,
                      }))
                    }
                    defaultExpanded={expandedTools[name] ?? false}
                    onToggleExpanded={onToggleToolExpanded}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}
    </div>

    <div className={cn(modalFooterActionsClassName, "shrink-0 pt-4")}>
      <Button variant="secondary" type="button" onClick={onBack}>
        Back
      </Button>
      <Button
        type="button"
        disabled={reviewedTools.length === 0 || createPending}
        onClick={onCreate}
      >
        {createPending ? "Saving…" : "Create integration"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
);

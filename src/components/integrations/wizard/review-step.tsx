import { ChevronRight } from "lucide-react";

import {
  accessModeButtonClassName,
  getToolAccessMode,
  ToolRow,
} from "@/src/components/integrations/tool-access-controls";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  integrationWizardInputClassName,
} from "@/src/components/integrations/wizard/utils";
import type { ToolAccessMode, ToolSpec } from "@/src/types/integrations-hub";

interface ReviewStepProps {
  createPending: boolean;
  draftName: string;
  draftKey: string;
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
  draftName,
  draftKey,
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
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-base)]">
      <span>
        {reviewedTools.length} tool
        {reviewedTools.length === 1 ? "" : "s"} discovered for {draftName || draftKey}
      </span>
    </div>

    {reviewedTools.length === 0 ? (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
        No tools were discovered for this connector. Go back and confirm the
        selected managed connector or MCP server URL.
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={toolSearch}
            onChange={(event) => onToolSearchChange(event.target.value)}
            placeholder="Search tools"
            aria-label="Search tools"
            className={cn(integrationWizardInputClassName, "w-full lg:max-w-xs")}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
            <Badge>{filteredReviewedTools.length} matching</Badge>
            <Badge>{selectedToolCount} selected</Badge>
            {toolSearch.trim() ? (
              <Badge>{selectedMatchingCount} selected in view</Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-md px-3 text-xs"
              disabled={!hasMatchingTools || allMatchingSelected}
              onClick={() => onSetSelectedStateForTools(matchingToolNames, true)}
            >
              Select all matches
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-md px-3 text-xs"
              disabled={!hasMatchingTools || selectedMatchingCount === 0}
              onClick={() => onSetSelectedStateForTools(matchingToolNames, false)}
            >
              Deselect matches
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className={cn("h-8 rounded-md px-3 text-xs", accessModeButtonClassName.enabled)}
            disabled={selectedToolCount === 0}
            onClick={() => onSetAccessModeForTools(selectedToolNames, "enabled")}
          >
            Enable selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-8 rounded-md px-3 text-xs",
              accessModeButtonClassName.approval_required,
            )}
            disabled={selectedToolCount === 0}
            onClick={() =>
              onSetAccessModeForTools(selectedToolNames, "approval_required")
            }
          >
            Case-by-case selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn("h-8 rounded-md px-3 text-xs", accessModeButtonClassName.disabled)}
            disabled={selectedToolCount === 0}
            onClick={() => onSetAccessModeForTools(selectedToolNames, "disabled")}
          >
            Disable selected
          </Button>
        </div>

        {filteredReviewedTools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
            No tools match this search. Try a different term.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
            <div className="divide-y divide-[var(--color-border)]">
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

    <div className="flex flex-wrap gap-3 pt-1">
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

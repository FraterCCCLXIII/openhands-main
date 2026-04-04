import { ChevronRight } from "lucide-react";

import {
  AccessModeSlider,
  accessModeButtonClassName,
  getToolAccessMode,
} from "@/src/components/integrations/function-access-controls";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  authStrategyLabel,
  integrationWizardInputClassName,
  type DiscoveryResponse,
  type IntegrationKind,
} from "@/src/components/integrations/wizard/utils";
import type { ToolAccessMode, ToolSpec } from "@/src/types/context-layer";

interface ReviewStepProps {
  createPending: boolean;
  discovery: DiscoveryResponse;
  draftName: string;
  draftKey: string;
  filteredReviewedTools: Array<[string, ToolSpec]>;
  toolModes: Record<string, ToolAccessMode>;
  toolSearch: string;
  hasMatchingTools: boolean;
  kind: IntegrationKind;
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
  discovery,
  draftName,
  draftKey,
  filteredReviewedTools,
  toolModes,
  toolSearch,
  hasMatchingTools,
  kind,
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
  <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm text-[var(--color-text-base)]">
      <Badge>{kind === "built_in" ? "Built-in" : "MCP"}</Badge>
      <Badge>{discovery.provider}</Badge>
      <Badge>{authStrategyLabel(discovery.authStrategy)}</Badge>
      <span>
        {reviewedTools.length} tool
        {reviewedTools.length === 1 ? "" : "s"} discovered for {draftName || draftKey}
      </span>
    </div>

    {reviewedTools.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm text-[var(--color-text-base)]">
        No tools were discovered for this connector. Go back and confirm the
        selected managed connector or MCP server URL.
      </div>
    ) : (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                Review tool access defaults
              </h3>
              <p className="text-xs leading-6 text-[var(--color-text-base)]">
                Search, select, and update multiple tools at once. Bulk actions
                apply to the currently selected tools, while select all and
                deselect only affect the current search results.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
              <Badge>{filteredReviewedTools.length} matching</Badge>
              <Badge>{selectedToolCount} selected</Badge>
              {toolSearch.trim() ? (
                <Badge>{selectedMatchingCount} selected in view</Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="search"
              value={toolSearch}
              onChange={(event) => onToolSearchChange(event.target.value)}
              placeholder="Search tools"
              aria-label="Search tools"
              className={cn(integrationWizardInputClassName, "w-full lg:max-w-md")}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-md px-3 text-xs"
                disabled={!hasMatchingTools || allMatchingSelected}
                onClick={() => onSetSelectedStateForTools(matchingToolNames, true)}
              >
                Select all matches
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-md px-3 text-xs"
                disabled={!hasMatchingTools || selectedMatchingCount === 0}
                onClick={() => onSetSelectedStateForTools(matchingToolNames, false)}
              >
                Deselect matches
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              className={cn("h-9 rounded-md px-3 text-xs", accessModeButtonClassName.enabled)}
              disabled={selectedToolCount === 0}
              onClick={() => onSetAccessModeForTools(selectedToolNames, "enabled")}
            >
              Enable selected
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-9 rounded-md px-3 text-xs",
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
              className={cn("h-9 rounded-md px-3 text-xs", accessModeButtonClassName.disabled)}
              disabled={selectedToolCount === 0}
              onClick={() => onSetAccessModeForTools(selectedToolNames, "disabled")}
            >
              Disable selected
            </Button>
          </div>
        </div>

        {filteredReviewedTools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm text-[var(--color-text-base)]">
            No tools match this search. Try a different term.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
            <div className="divide-y divide-[var(--color-border)]">
              {filteredReviewedTools.map(([name, toolSpec]) => {
                const accessMode =
                  toolModes[name] ?? getToolAccessMode(toolSpec);
                const isExpanded = expandedTools[name] ?? false;
                const isSelected = selectedTools[name] ?? false;

                return (
                  <div
                    key={name}
                    className="px-4 py-4"
                    data-tool-name={name}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-accent)]"
                            checked={isSelected}
                            aria-label={`Select ${name}`}
                            onChange={(event) =>
                              onSetSelectedTools((current) => ({
                                ...current,
                                [name]: event.target.checked,
                              }))
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{name}</p>
                            <p className="mt-1 truncate text-xs leading-6 text-[var(--color-text-base)]">
                              {toolSpec.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <AccessModeSlider
                          toolName={name}
                          mode={accessMode}
                          onChange={(nextMode) => onSetToolMode(name, nextMode)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 rounded-md px-3 text-xs"
                          aria-expanded={isExpanded}
                          aria-controls={`tool-details-${name}`}
                          onClick={() => onToggleToolExpanded(name)}
                        >
                          {isExpanded ? "Hide details" : "Show details"}
                          <ChevronRight
                            className={cn(
                              "ml-1 h-4 w-4 transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div
                        id={`tool-details-${name}`}
                        className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4"
                      >
                        <p className="text-sm leading-7 text-[var(--color-text-base)]">
                          {toolSpec.description || "No description provided."}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                          Default scopes: {toolSpec.defaultScopes.join(", ") || "none"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

    <div className="flex flex-wrap gap-3">
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

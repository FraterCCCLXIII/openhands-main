import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/src/components/ui/button";
import {
  functionAccessModes,
  getAllowedFunctionAccessModes,
} from "@/src/lib/function-access-mode";
import { matchesSearchQuery } from "@/src/lib/text-utils";
import { cn } from "@/src/lib/utils";
import type { ToolAccessMode, ToolSpec } from "@/src/types/integrations-hub";

export const accessModeLabel = (mode: ToolAccessMode) => {
  switch (mode) {
    case "enabled":
      return "Enabled";
    case "disabled":
      return "Disabled";
    case "approval_required":
      return "Case-by-case";
  }
};

export const getToolAccessMode = (toolSpec: ToolSpec): ToolAccessMode =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

export const matchesToolSearch = (
  name: string,
  toolSpec: ToolSpec,
  query: string,
) =>
  matchesSearchQuery(
    [name, toolSpec.description, toolSpec.defaultScopes.join(" ")],
    query,
  );

export const accessModeButtonClassName: Record<ToolAccessMode, string> = {
  enabled:
    "border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.12)] text-[var(--oh-color-success)] hover:bg-[color:rgba(165,231,94,0.18)]",
  approval_required:
    "border-[color:rgba(217,181,90,0.28)] bg-[color:rgba(217,181,90,0.12)] text-[var(--oh-warning)] hover:bg-[color:rgba(217,181,90,0.18)]",
  disabled:
    "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--oh-color-danger)] hover:bg-[color:rgba(231,106,94,0.18)]",
};

const accessModeSegmentClassName: Record<ToolAccessMode, string> = {
  enabled: "bg-[color:rgba(165,231,94,0.16)] text-[var(--oh-color-success)]",
  approval_required:
    "bg-[color:rgba(217,181,90,0.16)] text-[var(--oh-warning)]",
  disabled: "bg-[color:rgba(231,106,94,0.16)] text-[var(--oh-color-danger)]",
};

const accessModeOptions: Array<{
  value: ToolAccessMode;
  label: string;
}> = functionAccessModes.map((value) => ({
  value,
  label: accessModeLabel(value),
}));

export const AccessModeSlider = ({
  toolName,
  mode,
  maxMode,
  onChange,
}: {
  toolName: string;
  mode: ToolAccessMode;
  maxMode?: ToolAccessMode;
  onChange: (mode: ToolAccessMode) => void;
}) => {
  const allowedModes = maxMode ? getAllowedFunctionAccessModes(maxMode) : functionAccessModes;

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--oh-border)] bg-[var(--oh-bg-input)] p-1"
      role="group"
      aria-label={`Default access for ${toolName}`}
      data-access-mode={mode}
      data-max-access-mode={maxMode}
    >
      {accessModeOptions.map((option) => {
        const active = option.value === mode;
        const allowed = allowedModes.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? accessModeSegmentClassName[option.value]
                : "text-[var(--oh-text-secondary)] hover:bg-[var(--oh-interactive-active)] hover:text-white disabled:hover:bg-transparent disabled:hover:text-[var(--oh-text-secondary)]",
            )}
            aria-pressed={active}
            aria-label={`${accessModeLabel(option.value)} access for ${toolName}`}
            disabled={!allowed}
            onClick={() => {
              if (!allowed) {
                return;
              }
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export interface ToolRowSpec {
  description?: string;
  defaultScopes: string[];
  maxAccessMode?: ToolAccessMode;
}

export interface ToolRowProps {
  name: string;
  toolSpec: ToolRowSpec;
  accessMode: ToolAccessMode;
  onAccessModeChange: (mode: ToolAccessMode) => void;
  selected?: boolean;
  onToggleSelected?: (selected: boolean) => void;
  defaultExpanded?: boolean;
  onToggleExpanded?: (name: string) => void;
  className?: string;
}

export const ToolRow = ({
  name,
  toolSpec,
  accessMode,
  onAccessModeChange,
  selected,
  onToggleSelected,
  defaultExpanded = false,
  onToggleExpanded,
  className,
}: ToolRowProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const detailsId = useId();

  return (
    <div
      className={cn("px-3.5 py-3", className)}
      data-tool-name={name}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {onToggleSelected ? (
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-accent)]"
                checked={selected ?? false}
                aria-label={`Select ${name}`}
                onChange={(event) => onToggleSelected(event.target.checked)}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 truncate text-xs leading-5 text-[var(--color-text-base)]">
                {toolSpec.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AccessModeSlider
            toolName={name}
            mode={accessMode}
            maxMode={toolSpec.maxAccessMode}
            onChange={onAccessModeChange}
          />
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-md px-3 text-xs"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={() => {
              setIsExpanded((prev) => !prev);
              onToggleExpanded?.(name);
            }}
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
          id={detailsId}
          className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] p-3.5"
        >
          <p className="text-sm leading-6 text-[var(--color-text-base)]">
            {toolSpec.description || "No description provided."}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-base)]">
            Default scopes: {toolSpec.defaultScopes.join(", ") || "none"}
          </p>
        </div>
      ) : null}
    </div>
  );
};

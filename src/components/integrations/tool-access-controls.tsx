import { Ban, Check, ListTodo, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";

import { DetailsRevealCaret } from "@/src/components/integrations/details-reveal-caret";
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import {
  functionAccessModes,
  getAllowedFunctionAccessModes,
} from "@/src/lib/function-access-mode";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
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

const accessModeTriggerClassName: Record<ToolAccessMode, string> = {
  enabled:
    "border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.12)] text-[var(--oh-color-success)] hover:bg-[color:rgba(165,231,94,0.18)] hover:text-[var(--oh-color-success)]",
  approval_required:
    "border-[color:rgba(217,181,90,0.28)] bg-[color:rgba(217,181,90,0.12)] text-[var(--oh-warning)] hover:bg-[color:rgba(217,181,90,0.18)] hover:text-[var(--oh-warning)]",
  disabled:
    "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--oh-color-danger)] hover:bg-[color:rgba(231,106,94,0.18)] hover:text-[var(--oh-color-danger)]",
};

const accessModeIcons: Record<ToolAccessMode, LucideIcon> = {
  enabled: Check,
  approval_required: ListTodo,
  disabled: Ban,
};

const accessModeOptions: Array<{
  value: ToolAccessMode;
  label: string;
  icon: LucideIcon;
}> = functionAccessModes.map((value) => ({
  value,
  label: accessModeLabel(value),
  icon: accessModeIcons[value],
}));

export const getAccessModeDropdownTestId = (toolName: string) =>
  `access-mode-${toolName}`;

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
  const allowedModes = maxMode
    ? getAllowedFunctionAccessModes(maxMode)
    : functionAccessModes;
  const options = accessModeOptions.filter((option) =>
    allowedModes.includes(option.value),
  );

  return (
    <div
      className="w-fit shrink-0"
      data-access-mode={mode}
      data-max-access-mode={maxMode}
    >
      <SelectDropdown
        testId={getAccessModeDropdownTestId(toolName)}
        value={mode}
        options={options}
        ariaLabel={`Default access for ${toolName}`}
        variant="filter"
        menuAlign="right"
        className="w-fit"
        triggerClassName={cn(
          accessModeTriggerClassName[mode],
          "h-7 min-h-7 w-fit gap-1 px-2 text-[10px] font-semibold leading-4",
        )}
        onChange={(nextValue) => onChange(nextValue as ToolAccessMode)}
      />
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
      className={cn("px-4 py-4", className)}
      data-tool-name={name}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {onToggleSelected ? (
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[var(--oh-border)] bg-[var(--oh-bg-input)] accent-[var(--oh-accent)]"
                checked={selected ?? false}
                aria-label={`Select ${name}`}
                onChange={(event) => onToggleSelected(event.target.checked)}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 truncate text-xs leading-5 text-[var(--oh-text-secondary)]">
                {toolSpec.description ||
                  INTEGRATIONS_PAGE_COPY.installedToolNoDescription}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start">
          <AccessModeSlider
            toolName={name}
            mode={accessMode}
            maxMode={toolSpec.maxAccessMode}
            onChange={onAccessModeChange}
          />
          <DetailsRevealCaret
            expanded={isExpanded}
            controlsId={detailsId}
            showLabel={INTEGRATIONS_PAGE_COPY.installedShowToolDetails}
            hideLabel={INTEGRATIONS_PAGE_COPY.installedHideToolDetails}
            onToggle={() => {
              setIsExpanded((prev) => !prev);
              onToggleExpanded?.(name);
            }}
          />
        </div>
      </div>

      {isExpanded ? (
        <div
          id={detailsId}
          className="mt-3 rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] p-4"
        >
          <p className="text-sm leading-5 text-[var(--oh-text-secondary)]">
            {toolSpec.description ||
              INTEGRATIONS_PAGE_COPY.installedToolNoDescription}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--oh-text-secondary)]">
            {INTEGRATIONS_PAGE_COPY.installedDefaultScopesLabel}{" "}
            {toolSpec.defaultScopes.join(", ") ||
              INTEGRATIONS_PAGE_COPY.installedNoneLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
};

"use client";

import React from "react";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/src/lib/utils";

interface CirclePlusCheckToggleProps {
  testId?: string;
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
  enableLabel: string;
  disableLabel: string;
  enableTooltip: string;
  disableTooltip?: string;
  removeTooltip: string;
}

export function CirclePlusCheckToggle({
  testId,
  isSelected,
  onToggle,
  isDisabled = false,
  className,
  enableLabel,
  disableLabel,
  enableTooltip,
  disableTooltip,
  removeTooltip,
}: CirclePlusCheckToggleProps) {
  const [isPointerOver, setIsPointerOver] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isDisabled) {
      return;
    }
    onToggle(!isSelected);
    event.currentTarget.blur();
  };

  const showRemoveIcon = isSelected && isPointerOver;
  const selectedTooltip = disableTooltip ?? removeTooltip;
  const tooltipLabel = isSelected ? selectedTooltip : enableTooltip;
  const ariaLabel = isSelected ? disableLabel : enableLabel;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isSelected}
      data-testid={testId}
      data-showing-remove={showRemoveIcon ? "true" : "false"}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={tooltipLabel}
      onClick={handleClick}
      onPointerEnter={() => setIsPointerOver(true)}
      onPointerLeave={() => setIsPointerOver(false)}
      className={cn(
        "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 transition-colors",
        isSelected &&
          (showRemoveIcon
            ? "border-0 bg-[rgba(248,113,113,0.14)] text-[#ef4444] hover:bg-[rgba(248,113,113,0.24)]"
            : "border border-white bg-transparent text-white"),
        !isSelected &&
          "border-0 bg-surface-raised text-white hover:bg-[var(--oh-interactive-hover)]",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {isSelected ? (
        showRemoveIcon ? (
          <X className="size-3.5 stroke-[2.5]" aria-hidden />
        ) : (
          <Check className="size-3.5" aria-hidden />
        )
      ) : (
        <Plus className="size-3" aria-hidden />
      )}
    </button>
  );
}

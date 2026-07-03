"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/src/lib/utils";

interface DetailsRevealCaretProps {
  expanded: boolean;
  controlsId: string;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
  className?: string;
}

export function DetailsRevealCaret({
  expanded,
  controlsId,
  showLabel,
  hideLabel,
  onToggle,
  className,
}: DetailsRevealCaretProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={expanded ? hideLabel : showLabel}
      onClick={onToggle}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-tertiary-alt transition-colors hover:bg-[var(--oh-interactive-active)] hover:text-white",
        className,
      )}
    >
      <ChevronDown
        aria-hidden
        className={cn(
          "h-4 w-4 shrink-0 transition-transform",
          expanded && "rotate-180",
        )}
      />
    </button>
  );
}

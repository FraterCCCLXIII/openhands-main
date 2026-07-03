"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  dropdownMenuRowForegroundClassName,
  dropdownMenuRowIconClassName,
} from "@/src/styles/dropdown-classes";

interface DropdownMenuToggleRowProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onToggle: () => void;
  testId?: string;
}

export function DropdownMenuToggleRow({
  icon: Icon,
  label,
  checked,
  onToggle,
  testId,
}: DropdownMenuToggleRowProps) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={onToggle}
      className={dropdownMenuRowForegroundClassName}
    >
      <Icon
        className={cn("h-3.5 w-3.5", dropdownMenuRowIconClassName)}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? (
        <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
      ) : null}
    </button>
  );
}

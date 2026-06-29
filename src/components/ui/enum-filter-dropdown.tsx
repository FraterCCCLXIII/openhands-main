"use client";

import { Check, ChevronDown } from "lucide-react";
import React from "react";

import { cn } from "@/src/lib/utils";
import { formControlFilterTriggerClassName } from "@/src/styles/form-control-classes";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";

interface EnumFilterDropdownProps<T extends string> {
  testId: string;
  triggerTestId?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labelByValue: Record<T, string>;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
}

export function EnumFilterDropdown<T extends string>({
  testId,
  triggerTestId,
  value,
  onChange,
  options,
  labelByValue,
  ariaLabel,
  className,
  triggerClassName,
}: EnumFilterDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const defaultOption = options[0];
  const selectedLabel = labelByValue[value];

  React.useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("relative shrink-0", className)}
      data-testid={testId}
    >
      <button
        type="button"
        data-testid={triggerTestId ?? `${testId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          formControlFilterTriggerClassName,
          defaultOption &&
            value !== defaultOption &&
            "border-white/60 bg-white/10",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate whitespace-nowrap">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-tertiary-alt transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          data-testid={`${testId}-menu`}
          aria-label={ariaLabel}
          className={cn(
            dropdownMenuSurfaceClassName,
            "absolute right-0 top-full mt-1 min-w-full w-max max-h-60 overflow-auto",
            dropdownMenuListClassName,
          )}
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                data-testid={`${testId}-${option}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cn(
                  dropdownMenuRowClassName,
                  selected && "bg-[var(--oh-interactive-selected)]",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{labelByValue[option]}</span>
                {selected ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

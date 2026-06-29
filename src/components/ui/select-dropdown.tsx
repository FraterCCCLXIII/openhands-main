"use client";

import { Check, ChevronDown } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/src/lib/utils";
import {
  formControlFilterTriggerClassName,
  formControlSelectTriggerClassName,
} from "@/src/styles/form-control-classes";
import {
  dropdownInstantColorClassName,
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";

export interface SelectDropdownOption {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  testId?: string;
  triggerTestId?: string;
  name?: string;
  value: string;
  options: readonly SelectDropdownOption[];
  ariaLabel: string;
  disabled?: boolean;
  variant?: "field" | "filter";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  menuAlign?: "left" | "right";
  highlightWhenNotDefault?: boolean;
  defaultValue?: string;
  onChange: (value: string) => void;
}

export function SelectDropdown({
  testId,
  triggerTestId,
  name,
  value,
  options,
  ariaLabel,
  disabled = false,
  variant = "field",
  className,
  triggerClassName,
  menuClassName,
  menuAlign = "left",
  highlightWhenNotDefault = false,
  defaultValue,
  onChange,
}: SelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<React.CSSProperties>();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? value;
  const resolvedDefaultValue = defaultValue ?? options[0]?.value;

  React.useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(undefined);
      return undefined;
    }

    const trigger = triggerRef.current;
    if (!trigger) {
      return undefined;
    }

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      const menuOffset = variant === "filter" ? 8 : 4;
      setMenuPosition(
        menuAlign === "right"
          ? {
              position: "fixed",
              top: rect.bottom + menuOffset,
              right: window.innerWidth - rect.right,
              minWidth: rect.width,
              zIndex: 60,
            }
          : {
              position: "fixed",
              top: rect.bottom + menuOffset,
              left: rect.left,
              minWidth: rect.width,
              zIndex: 60,
            },
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuAlign, open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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

  const triggerBaseClassName =
    variant === "filter"
      ? cn(formControlFilterTriggerClassName, dropdownInstantColorClassName)
      : formControlSelectTriggerClassName;

  const menu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            data-testid={testId ? `${testId}-menu` : undefined}
            aria-label={ariaLabel}
            style={menuPosition}
            className={cn(
              dropdownMenuSurfaceClassName,
              "max-h-60 w-max overflow-auto",
              dropdownMenuListClassName,
              menuClassName,
            )}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  data-testid={testId ? `${testId}-${option.value}` : undefined}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    dropdownMenuRowClassName,
                    selected && "bg-[var(--oh-interactive-selected)]",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={cn(
        "relative",
        variant === "filter" ? "w-fit shrink-0" : "w-full min-w-0",
        className,
      )}
      data-testid={testId}
    >
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <button
        ref={triggerRef}
        type="button"
        data-testid={triggerTestId ?? (testId ? `${testId}-trigger` : undefined)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          triggerBaseClassName,
          highlightWhenNotDefault &&
            resolvedDefaultValue &&
            value !== resolvedDefaultValue &&
            "border-white/60 bg-white/10",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate whitespace-nowrap text-left",
            variant === "field" && "flex-1",
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-current transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {menu}
    </div>
  );
}

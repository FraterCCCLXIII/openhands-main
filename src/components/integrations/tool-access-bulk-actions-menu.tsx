"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

import { APPROVALS_PAGE_COPY } from "@/src/constants/approvals-page";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";

interface ToolAccessBulkActionsMenuProps {
  isDisabled?: boolean;
  onEnableSelected?: () => void;
  onCaseByCaseSelected?: () => void;
  onDisableSelected?: () => void;
}

export function ToolAccessBulkActionsMenu({
  isDisabled = false,
  onEnableSelected,
  onCaseByCaseSelected,
  onDisableSelected,
}: ToolAccessBulkActionsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

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

  const closeMenu = () => setOpen(false);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      data-testid="tool-access-bulk-actions-menu"
    >
      <button
        type="button"
        data-testid="approvals-decision-trigger"
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={APPROVALS_PAGE_COPY.decisionMenuLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          formControlButtonClassName,
          "shrink-0 whitespace-nowrap border border-[var(--oh-border)] bg-base-secondary text-xs text-white hover:bg-surface-raised",
        )}
      >
        <span>{APPROVALS_PAGE_COPY.decisionMenuLabel}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-75",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && !isDisabled ? (
        <div
          role="menu"
          data-testid="tool-access-bulk-actions-menu-panel"
          aria-label={APPROVALS_PAGE_COPY.decisionMenuLabel}
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-max min-w-full",
            dropdownMenuSurfaceClassName,
          )}
        >
          <ul className={dropdownMenuListClassName}>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="tool-access-enable-selected"
                onClick={() => {
                  onEnableSelected?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {INTEGRATIONS_PAGE_COPY.wizardEnableSelected}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="tool-access-case-by-case-selected"
                onClick={() => {
                  onCaseByCaseSelected?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {INTEGRATIONS_PAGE_COPY.wizardCaseByCaseSelected}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="tool-access-disable-selected"
                onClick={() => {
                  onDisableSelected?.();
                  closeMenu();
                }}
                className={cn(
                  dropdownMenuRowClassName,
                  "text-[var(--oh-danger)] hover:bg-[color:rgba(231,106,94,0.12)] hover:text-[var(--oh-danger)]",
                )}
              >
                {INTEGRATIONS_PAGE_COPY.wizardDisableSelected}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

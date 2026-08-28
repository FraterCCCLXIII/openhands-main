"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

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
  canSelectAll?: boolean;
  canDeselect?: boolean;
  canChangeAccess?: boolean;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onEnableSelected?: () => void;
  onCaseByCaseSelected?: () => void;
  onDisableSelected?: () => void;
}

export function ToolAccessBulkActionsMenu({
  isDisabled = false,
  canSelectAll = false,
  canDeselect = false,
  canChangeAccess = false,
  onSelectAll,
  onDeselect,
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
        data-testid="tool-access-bulk-actions-trigger"
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={INTEGRATIONS_PAGE_COPY.wizardBulkActions}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          formControlButtonClassName,
          "shrink-0 whitespace-nowrap border border-[var(--oh-border)] bg-base-secondary text-xs text-white hover:bg-surface-raised",
        )}
      >
        <span>{INTEGRATIONS_PAGE_COPY.wizardBulkActions}</span>
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
          aria-label={INTEGRATIONS_PAGE_COPY.wizardBulkActions}
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
                data-testid="tool-access-select-all-matches"
                disabled={!canSelectAll}
                onClick={() => {
                  if (!canSelectAll) return;
                  onSelectAll?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {INTEGRATIONS_PAGE_COPY.wizardSelectAllMatches}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="tool-access-deselect-matches"
                disabled={!canDeselect}
                onClick={() => {
                  if (!canDeselect) return;
                  onDeselect?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {INTEGRATIONS_PAGE_COPY.wizardDeselectMatches}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="tool-access-enable-selected"
                disabled={!canChangeAccess}
                onClick={() => {
                  if (!canChangeAccess) return;
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
                disabled={!canChangeAccess}
                onClick={() => {
                  if (!canChangeAccess) return;
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
                disabled={!canChangeAccess}
                onClick={() => {
                  if (!canChangeAccess) return;
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

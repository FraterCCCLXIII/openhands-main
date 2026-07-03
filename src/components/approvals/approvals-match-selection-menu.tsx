"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

import { APPROVALS_PAGE_COPY } from "@/src/constants/approvals-page";
import { cn } from "@/src/lib/utils";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";

interface ApprovalsMatchSelectionMenuProps {
  isDisabled?: boolean;
  onSelectAll?: () => void;
  onDeselect?: () => void;
}

export function ApprovalsMatchSelectionMenu({
  isDisabled = false,
  onSelectAll,
  onDeselect,
}: ApprovalsMatchSelectionMenuProps) {
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
      data-testid="approvals-match-selection-menu"
    >
      <button
        type="button"
        data-testid="approvals-match-selection-trigger"
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={APPROVALS_PAGE_COPY.selectionMenuLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          formControlButtonClassName,
          "shrink-0 whitespace-nowrap border border-[var(--oh-border)] bg-base-secondary text-xs text-white hover:bg-surface-raised",
        )}
      >
        <span>{APPROVALS_PAGE_COPY.selectionMenuLabel}</span>
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
          data-testid="approvals-match-selection-menu-panel"
          aria-label={APPROVALS_PAGE_COPY.selectionMenuLabel}
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
                data-testid="approvals-select-all-matches"
                onClick={() => {
                  onSelectAll?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {APPROVALS_PAGE_COPY.selectAllMatches}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="approvals-deselect-matches"
                onClick={() => {
                  onDeselect?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {APPROVALS_PAGE_COPY.deselectMatches}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

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

interface ApprovalsDecisionMenuProps {
  isDisabled?: boolean;
  canSelectAll?: boolean;
  canDeselect?: boolean;
  canApprove?: boolean;
  canDeny?: boolean;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function ApprovalsDecisionMenu({
  isDisabled = false,
  canSelectAll = false,
  canDeselect = false,
  canApprove = false,
  canDeny = false,
  onSelectAll,
  onDeselect,
  onApprove,
  onDeny,
}: ApprovalsDecisionMenuProps) {
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
      className="relative shrink-0 self-end"
      data-testid="approvals-decision-menu"
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
          data-testid="approvals-decision-menu-panel"
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
                data-testid="approvals-select-all-matches"
                disabled={!canSelectAll}
                onClick={() => {
                  if (!canSelectAll) return;
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
                disabled={!canDeselect}
                onClick={() => {
                  if (!canDeselect) return;
                  onDeselect?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {APPROVALS_PAGE_COPY.deselectMatches}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="approvals-approve-selected"
                disabled={!canApprove}
                onClick={() => {
                  if (!canApprove) return;
                  onApprove?.();
                  closeMenu();
                }}
                className={dropdownMenuRowClassName}
              >
                {APPROVALS_PAGE_COPY.approveSelected}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="approvals-deny-selected"
                disabled={!canDeny}
                onClick={() => {
                  if (!canDeny) return;
                  onDeny?.();
                  closeMenu();
                }}
                className={cn(
                  dropdownMenuRowClassName,
                  "text-[var(--oh-danger)] hover:bg-[color:rgba(231,106,94,0.12)] hover:text-[var(--oh-danger)]",
                )}
              >
                {APPROVALS_PAGE_COPY.denySelected}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

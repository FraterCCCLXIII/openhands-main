"use client";

import React from "react";
import { createPortal } from "react-dom";
import { EyeOff, ToggleLeft } from "lucide-react";

import { DropdownMenuToggleRow } from "@/src/components/ui/dropdown-menu-toggle-row";
import { MenuDivider } from "@/src/components/ui/menu-divider";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuRowIconWrapperClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";

interface IntegrationsSectionActionsMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  hideDisabledTools: boolean;
  onClose: () => void;
  onHideDisabledToolsChange: (value: boolean) => void;
  onOpenBulkDisable: () => void;
}

export function IntegrationsSectionActionsMenu({
  anchorRef,
  hideDisabledTools,
  onClose,
  onHideDisabledToolsChange,
  onOpenBulkDisable,
}: IntegrationsSectionActionsMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<React.CSSProperties>();

  React.useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return undefined;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      setPosition({
        position: "fixed",
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        width: "max-content",
        minWidth: "12rem",
        zIndex: 60,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  React.useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose]);

  if (typeof document === "undefined" || !position) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={INTEGRATIONS_PAGE_COPY.sectionActionsAriaLabel}
      data-testid="integrations-section-actions-menu"
      style={position}
      className={cn(dropdownMenuSurfaceClassName, dropdownMenuListClassName)}
    >
      <DropdownMenuToggleRow
        icon={EyeOff}
        label={INTEGRATIONS_PAGE_COPY.hideDisabledToolsLabel}
        checked={hideDisabledTools}
        testId="integrations-hide-disabled-tools-toggle"
        onToggle={() => onHideDisabledToolsChange(!hideDisabledTools)}
      />
      <MenuDivider />
      <button
        type="button"
        role="menuitem"
        data-testid="integrations-disable-unused-tools-menu-item"
        onClick={() => {
          onOpenBulkDisable();
          onClose();
        }}
        className={dropdownMenuRowClassName}
      >
        <span className={dropdownMenuRowIconWrapperClassName}>
          <ToggleLeft width={14} height={14} aria-hidden />
        </span>
        <span className="min-w-0 truncate">
          {INTEGRATIONS_PAGE_COPY.disableUnusedToolsMenuItem}
        </span>
      </button>
    </div>,
    document.body,
  );
}

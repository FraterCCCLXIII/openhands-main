"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Download, RefreshCw, Trash2 } from "lucide-react";

import { MenuDivider } from "@/src/components/ui/menu-divider";
import { PERMISSION_PROFILES_PAGE_COPY } from "@/src/constants/permission-profiles-page";
import { cn } from "@/src/lib/utils";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuRowIconWrapperClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";

interface PermissionProfileActionsMenuProps {
  profileName: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onLoadProfile?: () => void;
  onUpdateFromCurrent?: () => void;
  onDelete?: () => void;
  isDeleteDisabled?: boolean;
}

export function PermissionProfileActionsMenu({
  profileName,
  anchorRef,
  onClose,
  onLoadProfile,
  onUpdateFromCurrent,
  onDelete,
  isDeleteDisabled = false,
}: PermissionProfileActionsMenuProps) {
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
        left: Math.max(8, rect.right - 192),
        width: 192,
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

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${profileName} actions`}
      data-testid="permission-profile-actions-menu"
      style={position}
      className={cn(dropdownMenuSurfaceClassName, dropdownMenuListClassName)}
    >
      <button
        type="button"
        role="menuitem"
        data-testid="permission-profile-load"
        onClick={() => handleAction(onLoadProfile)}
        className={dropdownMenuRowClassName}
      >
        <span className={dropdownMenuRowIconWrapperClassName}>
          <Download width={14} height={14} aria-hidden />
        </span>
        <span className="min-w-0 truncate">
          {PERMISSION_PROFILES_PAGE_COPY.loadProfile}
        </span>
      </button>
      <button
        type="button"
        role="menuitem"
        data-testid="permission-profile-update-from-current"
        onClick={() => handleAction(onUpdateFromCurrent)}
        className={dropdownMenuRowClassName}
      >
        <span className={dropdownMenuRowIconWrapperClassName}>
          <RefreshCw width={14} height={14} aria-hidden />
        </span>
        <span className="min-w-0 truncate">
          {PERMISSION_PROFILES_PAGE_COPY.updateFromCurrent}
        </span>
      </button>
      <MenuDivider />
      <button
        type="button"
        role="menuitem"
        data-testid="permission-profile-delete"
        disabled={isDeleteDisabled}
        onClick={() => handleAction(onDelete)}
        className={cn(
          dropdownMenuRowClassName,
          "text-[var(--oh-danger)] hover:bg-[color:rgba(231,106,94,0.12)] hover:text-[var(--oh-danger)]",
          "[&_svg]:text-[var(--oh-danger)] group-hover:[&_svg]:text-[var(--oh-danger)]",
        )}
      >
        <span
          className={cn(
            dropdownMenuRowIconWrapperClassName,
            "text-[var(--oh-danger)] group-hover:text-[var(--oh-danger)]",
          )}
        >
          <Trash2 width={14} height={14} aria-hidden />
        </span>
        <span className="min-w-0 truncate">
          {PERMISSION_PROFILES_PAGE_COPY.deleteProfile}
        </span>
      </button>
    </div>,
    document.body,
  );
}

"use client";

import { ChevronUp, LogOut, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import { clearStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";

import { DashboardCollapsedIconSlot } from "@/src/components/layout/dashboard-collapsed-icon-slot";
import { SidebarTooltip } from "@/src/components/ui/sidebar-tooltip";
import { cn } from "@/src/lib/utils";
import {
  dropdownMenuListClassName,
  dropdownMenuRowClassName,
  dropdownMenuRowIconWrapperClassName,
  dropdownMenuSurfaceClassName,
} from "@/src/styles/dropdown-classes";
import {
  SIDEBAR_ICON_SLOT_CLASS,
  SIDEBAR_ROW_INTERACTIVE_CLASS,
  sidebarNavLabelClassName,
  sidebarNavRowClassName,
} from "@/src/styles/sidebar-layout";

interface DashboardUserMenuProps {
  displayName: string;
  email: string;
  collapsed?: boolean;
}

export function DashboardUserMenu({
  displayName,
  email,
  collapsed = false,
}: DashboardUserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleLogout = () => {
    closeMenu();
    clearStoredOpenHandsToken();
    window.location.href = "/";
  };

  const trigger = (
    <button
      type="button"
      data-testid="dashboard-user-menu-trigger"
      aria-label="Account menu"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((isOpen) => !isOpen)}
      className={cn(
        sidebarNavRowClassName({ collapsed }),
        !collapsed && SIDEBAR_ROW_INTERACTIVE_CLASS.idle,
        open && !collapsed && SIDEBAR_ROW_INTERACTIVE_CLASS.active,
        collapsed ? "h-9 min-h-9 py-0" : "h-auto min-h-9 w-full py-2",
      )}
    >
      {collapsed ? (
        <DashboardCollapsedIconSlot active={open}>
          <User width={18} height={18} aria-hidden />
        </DashboardCollapsedIconSlot>
      ) : (
        <>
          <span className={SIDEBAR_ICON_SLOT_CLASS}>
            <User width={18} height={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">
            <span className="block truncate text-sm font-medium text-white">
              {displayName}
            </span>
            <span className="mt-0.5 block truncate text-xs text-text-dim">{email}</span>
          </span>
          <ChevronUp
            width={14}
            height={14}
            className={cn(
              "shrink-0 text-text-dim transition-transform duration-75",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </>
      )}
      {collapsed ? (
        <span className={sidebarNavLabelClassName(true)}>{displayName}</span>
      ) : null}
    </button>
  );

  return (
    <div ref={menuRef} className="relative w-full">
      {collapsed ? (
        <SidebarTooltip content={displayName} placement="right">
          {trigger}
        </SidebarTooltip>
      ) : (
        trigger
      )}

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          data-testid="dashboard-user-menu-panel"
          className={cn(
            dropdownMenuSurfaceClassName,
            collapsed
              ? "absolute bottom-0 left-full z-50 ml-2.5 min-w-[240px]"
              : "absolute bottom-full left-0 right-0 mb-1 min-w-full",
          )}
        >
          <ul className={dropdownMenuListClassName}>
            <li role="none">
              <Link
                href="/profile"
                role="menuitem"
                data-testid="dashboard-user-menu-profile"
                onClick={closeMenu}
                className={dropdownMenuRowClassName}
              >
                <span className={dropdownMenuRowIconWrapperClassName}>
                  <User width={14} height={14} aria-hidden />
                </span>
                <span className="min-w-0 truncate">Profile</span>
              </Link>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-testid="dashboard-user-menu-logout"
                onClick={handleLogout}
                className={dropdownMenuRowClassName}
              >
                <span className={dropdownMenuRowIconWrapperClassName}>
                  <LogOut width={14} height={14} aria-hidden />
                </span>
                <span className="min-w-0 truncate">Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

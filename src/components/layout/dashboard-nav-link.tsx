"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { DashboardCollapsedIconSlot } from "@/src/components/layout/dashboard-collapsed-icon-slot";
import { SidebarTooltip } from "@/src/components/ui/sidebar-tooltip";
import { cn } from "@/src/lib/utils";
import {
  SIDEBAR_ICON_SLOT_CLASS,
  SIDEBAR_ROW_INTERACTIVE_CLASS,
  sidebarNavLabelClassName,
  sidebarNavRowClassName,
} from "@/src/styles/sidebar-layout";

const ICON_SIZE = 18;

const navTrailingCountPillClassName =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--oh-surface-subtle)] font-medium tabular-nums text-foreground";

interface DashboardNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  accentWhenActive?: boolean;
  collapsed?: boolean;
  trailingCount?: number;
}

function formatNavTrailingCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function NavTrailingCountPill({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-testid="dashboard-nav-trailing-count"
      className={cn(navTrailingCountPillClassName, className)}
    >
      {formatNavTrailingCount(count)}
    </span>
  );
}

export function DashboardNavLink({
  href,
  icon: Icon,
  label,
  active = false,
  accentWhenActive = false,
  collapsed = false,
  trailingCount = 0,
}: DashboardNavLinkProps) {
  const pendingSuffix =
    trailingCount > 0 ? `, ${formatNavTrailingCount(trailingCount)} pending` : "";

  const iconElement = (
    <Icon
      width={ICON_SIZE}
      height={ICON_SIZE}
      aria-hidden
      className={cn(accentWhenActive && active && !collapsed && "text-primary")}
    />
  );

  const link = (
    <Link
      href={href}
      aria-label={collapsed ? `${label}${pendingSuffix}` : undefined}
      className={cn(
        sidebarNavRowClassName({ collapsed }),
        !collapsed &&
          (active
            ? SIDEBAR_ROW_INTERACTIVE_CLASS.active
            : SIDEBAR_ROW_INTERACTIVE_CLASS.idle),
      )}
    >
      {collapsed ? (
        <span className="relative h-9 w-full shrink-0">
          <DashboardCollapsedIconSlot active={active}>{iconElement}</DashboardCollapsedIconSlot>
          {trailingCount > 0 ? (
            <NavTrailingCountPill
              count={trailingCount}
              className="pointer-events-none absolute -top-1 right-0 z-[2] h-3.5 min-w-3.5 px-0.5 text-[9px] leading-none"
            />
          ) : null}
        </span>
      ) : (
        <span className={SIDEBAR_ICON_SLOT_CLASS}>{iconElement}</span>
      )}
      <span className={cn(sidebarNavLabelClassName(collapsed), !collapsed && "min-w-0 flex-1")}>
        {label}
      </span>
      {!collapsed && trailingCount > 0 ? (
        <NavTrailingCountPill
          count={trailingCount}
          className="ml-auto h-5 min-w-5 px-1.5 text-[11px] leading-none"
        />
      ) : null}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <SidebarTooltip content={label} placement="right">
      {link}
    </SidebarTooltip>
  );
}

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

interface DashboardNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  accentWhenActive?: boolean;
  collapsed?: boolean;
}

export function DashboardNavLink({
  href,
  icon: Icon,
  label,
  active = false,
  accentWhenActive = false,
  collapsed = false,
}: DashboardNavLinkProps) {
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
      aria-label={collapsed ? label : undefined}
      className={cn(
        sidebarNavRowClassName({ collapsed }),
        !collapsed &&
          (active
            ? SIDEBAR_ROW_INTERACTIVE_CLASS.active
            : SIDEBAR_ROW_INTERACTIVE_CLASS.idle),
      )}
    >
      {collapsed ? (
        <DashboardCollapsedIconSlot active={active}>{iconElement}</DashboardCollapsedIconSlot>
      ) : (
        <span className={SIDEBAR_ICON_SLOT_CLASS}>{iconElement}</span>
      )}
      <span className={sidebarNavLabelClassName(collapsed)}>{label}</span>
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

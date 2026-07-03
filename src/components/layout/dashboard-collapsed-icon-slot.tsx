import type { ReactNode } from "react";

import { cn } from "@/src/lib/utils";
import {
  SIDEBAR_COLLAPSED_ICON_SLOT_CLASS,
  sidebarCollapsedIconBgClassName,
  sidebarCollapsedIconGlyphClassName,
} from "@/src/styles/sidebar-layout";

interface DashboardCollapsedIconSlotProps {
  active: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardCollapsedIconSlot({
  active,
  className,
  children,
}: DashboardCollapsedIconSlotProps) {
  return (
    <span className={cn(SIDEBAR_COLLAPSED_ICON_SLOT_CLASS, className)}>
      <span aria-hidden className={sidebarCollapsedIconBgClassName(active)} />
      <span className={sidebarCollapsedIconGlyphClassName(active)}>{children}</span>
    </span>
  );
}

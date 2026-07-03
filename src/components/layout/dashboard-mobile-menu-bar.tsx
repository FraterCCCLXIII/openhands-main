"use client";

import { DashboardMobileMenuToggle } from "@/src/components/layout/dashboard-mobile-menu-toggle";
import { SIDEBAR_LABELS } from "@/src/constants/sidebar-labels";

export function DashboardMobileMenuBar() {
  return (
    <header
      className="flex h-12 shrink-0 items-center gap-2 px-2.5 md:hidden"
      aria-label={SIDEBAR_LABELS.navigationAriaLabel}
    >
      <DashboardMobileMenuToggle />
    </header>
  );
}

"use client";

import { PanelLeft } from "lucide-react";

import { SIDEBAR_LABELS } from "@/src/constants/sidebar-labels";
import { useDashboardMobileNav } from "@/src/components/layout/dashboard-mobile-nav-context";
import {
  mobileTopBarIconButtonClassName,
  mobileTopBarIconClassName,
} from "@/src/utils/mobile-top-bar-icon-button-classes";

export function DashboardMobileMenuToggle() {
  const { isOpen, toggle } = useDashboardMobileNav();

  return (
    <button
      type="button"
      data-testid="dashboard-mobile-menu-toggle"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? SIDEBAR_LABELS.closeMenu : SIDEBAR_LABELS.openMenu}
      className={mobileTopBarIconButtonClassName}
    >
      <PanelLeft className={mobileTopBarIconClassName} aria-hidden strokeWidth={2} />
    </button>
  );
}

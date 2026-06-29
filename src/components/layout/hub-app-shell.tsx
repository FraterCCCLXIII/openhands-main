"use client";

import type { ReactNode } from "react";

import {
  DashboardSidebar,
  type DashboardSidebarItemId,
  type DashboardSidebarStats,
} from "@/src/components/layout/dashboard-sidebar";
import { DashboardMobileMenuBar } from "@/src/components/layout/dashboard-mobile-menu-bar";
import { DashboardMobileNavProvider } from "@/src/components/layout/dashboard-mobile-nav-context";
import {
  hubAppShellClassName,
  hubMainScrollClassName,
} from "@/src/styles/neo-layout";

interface HubAppShellProps {
  activeItem: DashboardSidebarItemId;
  stats: DashboardSidebarStats;
  userDisplayName: string;
  userEmail: string;
  showAdminOverviewLink?: boolean;
  showAdminIntegrationsLink?: boolean;
  showApprovalsLink?: boolean;
  children: ReactNode;
}

export function HubAppShell({
  activeItem,
  stats,
  userDisplayName,
  userEmail,
  showAdminOverviewLink = false,
  showAdminIntegrationsLink = false,
  showApprovalsLink = true,
  children,
}: HubAppShellProps) {
  return (
    <DashboardMobileNavProvider>
      <div className={hubAppShellClassName}>
        <DashboardSidebar
          activeItem={activeItem}
          stats={stats}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          showAdminOverviewLink={showAdminOverviewLink}
          showAdminIntegrationsLink={showAdminIntegrationsLink}
          showApprovalsLink={showApprovalsLink}
        />
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <DashboardMobileMenuBar />
          <div className={hubMainScrollClassName}>{children}</div>
        </div>
      </div>
    </DashboardMobileNavProvider>
  );
}

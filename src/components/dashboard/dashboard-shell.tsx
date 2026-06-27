"use client";

import type { ReactNode } from "react";

import { Badge } from "@/src/components/ui/badge";
import {
  DashboardSidebar,
  DashboardSidebarUserPanel,
  getDashboardSections,
} from "@/src/components/layout/dashboard-sidebar";
import { DashboardSignOutButton } from "@/src/components/layout/dashboard-sign-out-button";
import type { AdminSection } from "@/src/lib/admin-routes";

interface DashboardShellProps {
  activeSection: AdminSection;
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  enabledIntegrationCount: number;
  discoveredToolCount: number;
  pendingAccessRequestCount: number;
  integrationCount: number;
  statusMessage: string | null;
  oauthStatusMessage: string | null;
  showOAuthStatus: boolean;
  agentApiReady: boolean;
  children: ReactNode;
}

export const DashboardShell = ({
  activeSection,
  isAdmin,
  userName,
  userEmail,
  enabledIntegrationCount,
  discoveredToolCount,
  pendingAccessRequestCount,
  integrationCount,
  statusMessage,
  oauthStatusMessage,
  showOAuthStatus,
  agentApiReady,
  children,
}: DashboardShellProps) => {
  const sections = getDashboardSections();
  const activeSectionMeta =
    sections.find((section) => section.id === activeSection) ?? {
      id: activeSection,
      label: "Dashboard",
      icon: sections[0]?.icon ?? null,
    };

  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
      <DashboardSidebar
        badge={<Badge>{enabledIntegrationCount} live</Badge>}
        activeItem={activeSection}
        showAdminOverviewLink={isAdmin}
        showAdminIntegrationsLink={isAdmin}
        footer={
          <DashboardSidebarUserPanel
            userName={userName}
            userEmail={userEmail}
            badges={[
              <Badge key="pending">{pendingAccessRequestCount} pending</Badge>,
              <Badge key="tools">{discoveredToolCount} tools</Badge>,
            ]}
            action={<DashboardSignOutButton />}
          />
        }
      />

      <div className="space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
              OpenHands Integrations Hub
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {activeSectionMeta.label}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{integrationCount} integrations</Badge>
            <Badge>{enabledIntegrationCount} enabled</Badge>
            <Badge>{pendingAccessRequestCount} pending approvals</Badge>
          </div>
        </header>

        {statusMessage || (oauthStatusMessage && showOAuthStatus) ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text-active)]">
            {statusMessage || oauthStatusMessage}
          </div>
        ) : null}

        {!agentApiReady ? (
          <div className="rounded-xl border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] px-3 py-2 text-sm text-[var(--color-warning)]">
            Open <code className="text-white">/integrations</code> once to provision
            the agent key before agents call <code className="text-white">/api/agent/*</code>.
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
};

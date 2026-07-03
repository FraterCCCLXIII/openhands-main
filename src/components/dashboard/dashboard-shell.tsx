"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { HubAppShell } from "@/src/components/layout/hub-app-shell";
import { PageHeader } from "@/src/components/layout/page-header";
import { buildAdminSectionHref, type AdminSection } from "@/src/lib/admin-routes";
import { hubPageShellClassName } from "@/src/styles/neo-layout";

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

const sectionCopy: Record<AdminSection, { title: string; description: ReactNode }> = {
  profile: {
    title: "Profile",
    description: "Review the account and runtime state used by this Integrations Hub session.",
  },
  integrations: {
    title: "Integrations",
    description: (
      <>
        Connect tools, tune per-tool access, and manage your active agent integrations. Can&apos;t find an integration?{" "}
        <Link
          href="/admin-integrations"
          data-testid="integrations-admin-catalog-link"
          className="text-white transition-opacity hover:opacity-80"
        >
          Open the admin catalog
        </Link>
        .
      </>
    ),
  },
  permissionProfiles: {
    title: "Permission Profiles",
    description: "Save and reapply integration permission snapshots without storing provider credentials.",
  },
  apiKeys: {
    title: "Agent Connection",
    description: "Copy API keys, schemas, and prompts for connecting OpenHands agents to this hub.",
  },
  caseByCaseApprovals: {
    title: "Case-by-case Approvals",
    description: "Review temporary tool-access requests and approve only the work you trust.",
  },
};

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
  const copy = sectionCopy[activeSection];

  return (
    <HubAppShell
      activeItem={activeSection}
      stats={{
        liveIntegrations: enabledIntegrationCount,
        toolCount: discoveredToolCount,
      }}
      userDisplayName={userName}
      userEmail={userEmail}
      showAdminOverviewLink={isAdmin}
      showAdminIntegrationsLink={isAdmin}
    >
      <div className={hubPageShellClassName}>
        <PageHeader
          title={copy.title}
          description={copy.description}
          pills={[
            `${integrationCount} integrations`,
            `${enabledIntegrationCount} enabled`,
            `${pendingAccessRequestCount} pending approvals`,
          ]}
          actions={
            activeSection === "integrations" && isAdmin ? (
              <Link
                href={buildAdminSectionHref("integrations", {
                  showIntegrationWizard: "1",
                })}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--oh-border)] bg-base-secondary px-3 text-xs font-medium text-white transition-colors hover:bg-surface-raised"
              >
                Request integration
              </Link>
            ) : null
          }
        />

        <div className="mt-5 space-y-4">
          {statusMessage || (oauthStatusMessage && showOAuthStatus) ? (
            <div className="rounded-xl border border-[var(--oh-border)] bg-base-secondary px-3 py-2 text-sm text-white">
              {statusMessage || oauthStatusMessage}
            </div>
          ) : null}

          {!agentApiReady ? (
            <div className="rounded-xl border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] px-3 py-2 text-sm text-[var(--oh-warning)]">
              Open <code className="text-white">/integrations</code> once to provision
              the agent key before agents call <code className="text-white">/api/agent/*</code>.
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </HubAppShell>
  );
};

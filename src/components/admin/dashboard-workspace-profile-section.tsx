import { ShieldCheck, User } from "lucide-react";

import {
  CompactPanel,
  KeyValueRow,
} from "@/src/components/admin/dashboard-workspace-shared";

interface DashboardProfileSectionProps {
  userName: string;
  userEmail: string;
  authMode: string;
  contextApiBaseUrl: string;
  contextApiReady: boolean;
  integrationCount: number;
  pendingAccessRequestCount: number;
}

export const DashboardProfileSection = ({
  userName,
  userEmail,
  authMode,
  contextApiBaseUrl,
  contextApiReady,
  integrationCount,
  pendingAccessRequestCount,
}: DashboardProfileSectionProps) => (
  <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
    <CompactPanel title="User profile" icon={User}>
      <div className="divide-y divide-[var(--color-border)]">
        <KeyValueRow label="Name" value={userName} />
        <KeyValueRow label="Email" value={userEmail} />
        <KeyValueRow label="Session type" value={authMode} />
        <KeyValueRow
          label="Context API base URL"
          value={
            <code className="break-all text-xs text-[var(--color-text-active)]">
              {contextApiBaseUrl}
            </code>
          }
        />
      </div>
    </CompactPanel>

    <CompactPanel title="Connection context" icon={ShieldCheck}>
      <div className="divide-y divide-[var(--color-border)]">
        <KeyValueRow
          label="Agent key status"
          value={contextApiReady ? "Provisioned" : "Not available yet"}
        />
        <KeyValueRow label="Visible integrations" value={String(integrationCount)} />
        <KeyValueRow
          label="Pending approvals"
          value={String(pendingAccessRequestCount)}
        />
        <KeyValueRow
          label="Endpoint pattern"
          value={
            <code className="break-all text-xs text-[var(--color-text-active)]">
              {`${contextApiBaseUrl}/api/context/{integrationKey}/{functionName}`}
            </code>
          }
        />
      </div>
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
        The agent key belongs to <code className="text-white">{userEmail}</code>.
        Provider credentials stay server-side in integration settings or per-user
        OAuth records and are never handed directly to the agent.
      </div>
    </CompactPanel>
  </section>
);

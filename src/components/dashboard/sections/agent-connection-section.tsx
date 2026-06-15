import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardApiKeyCard } from "@/src/components/dashboard/api-key-card";
import { PermissionProfileAgentKeyCard } from "@/src/components/dashboard/permission-profile-agent-key-card";
import {
  CompactPanel,
  KeyValueRow,
  dashboardInputClassName,
} from "@/src/components/dashboard/shared";
import { Badge } from "@/src/components/ui/badge";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface ConnectionDetailCardProps {
  body: string;
  label: string;
  promptExample: string;
  schemaEndpoint: string;
}

const ConnectionDetailCard = ({
  body,
  label,
  promptExample,
  schemaEndpoint,
}: ConnectionDetailCardProps) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
    <h3 className="text-sm font-semibold text-white">{label}</h3>
    <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">{body}</p>
    <div className="mt-3 divide-y divide-[var(--color-border)]">
      <KeyValueRow
        label="OpenAPI schema"
        value={<code className="break-all text-xs text-[var(--color-text-active)]">{schemaEndpoint}</code>}
      />
    </div>
    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
        Example agent prompt
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
        {promptExample}
      </pre>
    </div>
  </div>
);

interface DashboardConnectionDetailsProps {
  adminPromptExample?: string;
  adminSchemaEndpoint?: string;
  agentMcpConfigExample: string;
  agentMcpEndpoint: string;
  agentMcpToolName: string;
  agentOpenApiSchemaEndpoint: string;
  agentRestPromptExample: string;
  isAdmin: boolean;
  userOpenApiSchemaEndpoint: string;
  userRestPromptExample: string;
}

const DashboardConnectionDetails = ({
  adminPromptExample,
  adminSchemaEndpoint,
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  isAdmin,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
}: DashboardConnectionDetailsProps) => (
  <CompactPanel title="Connection details" icon={ShieldCheck}>
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <h3 className="text-sm font-semibold text-white">Agent MCP</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-base)]">
          Connect your MCP client to the streamable HTTP endpoint below and
          authenticate with the agent key.
        </p>
        <div className="mt-3 divide-y divide-[var(--color-border)]">
          <KeyValueRow
            label="Endpoint"
            value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentMcpEndpoint}</code>}
          />
          <KeyValueRow
            label="Example tool"
            value={<code className="break-all text-xs text-[var(--color-text-active)]">{agentMcpToolName}</code>}
          />
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
            MCP config example
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 text-xs leading-6 text-[var(--color-text-base)]">
            {agentMcpConfigExample}
          </pre>
        </div>
      </div>

      <ConnectionDetailCard
        label="Agent REST API"
        body="Give your agent the agent key and the OpenAPI schema for the tool surface."
        promptExample={agentRestPromptExample}
        schemaEndpoint={agentOpenApiSchemaEndpoint}
      />
      <ConnectionDetailCard
        label="User REST API"
        body="Use the user automation key with the dashboard-equivalent OpenAPI schema."
        promptExample={userRestPromptExample}
        schemaEndpoint={userOpenApiSchemaEndpoint}
      />
      {isAdmin && adminPromptExample && adminSchemaEndpoint ? (
        <ConnectionDetailCard
          label="Admin REST API"
          body="Use the admin automation key with the admin-only OpenAPI schema for connector, discovery, and approval QA."
          promptExample={adminPromptExample}
          schemaEndpoint={adminSchemaEndpoint}
        />
      ) : null}
    </div>
  </CompactPanel>
);

const profileLabel = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

const AgentKeyProfileSelector = ({
  profiles,
}: {
  profiles: PermissionProfile[];
}) => {
  const defaultProfileId = useMemo(
    () => profiles.find((profile) => profile.name === null)?.id ?? profiles[0]?.id ?? "",
    [profiles],
  );
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);

  useEffect(() => {
    if (!defaultProfileId) {
      setSelectedProfileId("");
      return;
    }

    const selectedProfileExists = profiles.some(
      (profile) => profile.id === selectedProfileId,
    );
    if (!selectedProfileId || !selectedProfileExists) {
      setSelectedProfileId(defaultProfileId);
    }
  }, [defaultProfileId, profiles, selectedProfileId]);

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ??
    profiles.find((profile) => profile.id === defaultProfileId);

  if (!selectedProfile) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Agent key</h3>
          <p className="mt-1 text-sm text-[var(--color-text-base)]">
            Give your agent the key for the permission profile it should use.
          </p>
        </div>
        <Badge>{profiles.length} profiles</Badge>
      </div>
      <label className="mt-4 block space-y-2">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
          Permission profile
        </span>
        <select
          className={`${dashboardInputClassName} w-full`}
          value={selectedProfile.id}
          onChange={(event) => setSelectedProfileId(event.target.value)}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profileLabel(profile)}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4">
        <PermissionProfileAgentKeyCard
          key={selectedProfile.id}
          profile={selectedProfile}
          variant="inline"
        />
      </div>
    </div>
  );
};

interface AgentConnectionSectionProps {
  adminKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
    handleRotate: () => void | Promise<void>;
    hasKey: boolean;
    maskedValue: string;
    revealed: boolean;
  };
  adminPromptExample: string;
  adminSchemaEndpoint: string;
  agentKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleRotate: () => void | Promise<void>;
    maskedValue: string;
    revealed: boolean;
    toggleReveal: () => void;
  };
  agentMcpConfigExample: string;
  agentMcpEndpoint: string;
  agentMcpToolName: string;
  agentOpenApiSchemaEndpoint: string;
  agentRestPromptExample: string;
  contextApiReady: boolean;
  isAdmin: boolean;
  permissionProfiles: PermissionProfile[];

  userKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
    handleRotate: () => void | Promise<void>;
    hasKey: boolean;
    maskedValue: string;
    revealed: boolean;
  };
  userOpenApiSchemaEndpoint: string;
  userRestPromptExample: string;
}

export const AgentConnectionSection = ({
  adminKey,
  adminPromptExample,
  adminSchemaEndpoint,
  agentKey,
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  contextApiReady,
  isAdmin,
  permissionProfiles,
  userKey,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
}: AgentConnectionSectionProps) => (
  <section className="space-y-3">
    <CompactPanel title="API keys" icon={KeyRound}>
      <div className="space-y-3">
        {permissionProfiles.length > 0 ? (
          <AgentKeyProfileSelector profiles={permissionProfiles} />
        ) : (
          <DashboardApiKeyCard
            label="Agent key"
            description="Give this key to your agent."
            maskedValue={agentKey.maskedValue || "No agent key available yet."}
            badgeTone={contextApiReady ? "success" : "warning"}
            badgeLabel="agent"
            copied={agentKey.copied}
            onRevealToggle={agentKey.toggleReveal}
            onCopy={agentKey.handleCopy}
            onRotate={agentKey.handleRotate}
            revealDisabled={!contextApiReady}
            revealed={agentKey.revealed}
          />
        )}
        <DashboardApiKeyCard
          label="User automation key"
          description="Use this key to programmatically manage user-scoped integrations-hub settings."
          maskedValue={userKey.maskedValue || "No user automation key yet. Reveal or copy to create one."}
          badgeTone={userKey.hasKey ? "warning" : "default"}
          badgeLabel="user"
          copied={userKey.copied}
          onRevealToggle={userKey.handleReveal}
          onCopy={userKey.handleCopy}
          onRotate={userKey.handleRotate}
          revealed={userKey.revealed}
          rotateLabel={userKey.hasKey ? "Rotate" : "Create"}
        />
        {isAdmin ? (
          <DashboardApiKeyCard
            label="Admin automation key"
            description="Use this key for admin-only QA and operational automation surfaces."
            maskedValue={adminKey.maskedValue || "No admin automation key yet. Reveal or copy to create one."}
            badgeTone={adminKey.hasKey ? "warning" : "default"}
            badgeLabel="admin"
            copied={adminKey.copied}
            onRevealToggle={adminKey.handleReveal}
            onCopy={adminKey.handleCopy}
            onRotate={adminKey.handleRotate}
            revealed={adminKey.revealed}
            rotateLabel={adminKey.hasKey ? "Rotate" : "Create"}
          />
        ) : null}
      </div>
    </CompactPanel>

    <DashboardConnectionDetails
      adminPromptExample={adminPromptExample}
      adminSchemaEndpoint={adminSchemaEndpoint}
      agentMcpConfigExample={agentMcpConfigExample}
      agentMcpEndpoint={agentMcpEndpoint}
      agentMcpToolName={agentMcpToolName}
      agentOpenApiSchemaEndpoint={agentOpenApiSchemaEndpoint}
      agentRestPromptExample={agentRestPromptExample}
      isAdmin={isAdmin}
      userOpenApiSchemaEndpoint={userOpenApiSchemaEndpoint}
      userRestPromptExample={userRestPromptExample}
    />
  </section>
);

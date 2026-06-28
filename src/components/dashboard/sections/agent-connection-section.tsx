import {
  CircleCheck,
  CircleX,
  Copy,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { DashboardApiKeyCard } from "@/src/components/dashboard/api-key-card";
import { PermissionProfileAgentKeyCard } from "@/src/components/dashboard/permission-profile-agent-key-card";
import {
  CompactPanel,
  KeyValueRow,
  dashboardInputClassName,
} from "@/src/components/dashboard/shared";
import { copyTextToClipboard } from "@/src/components/dashboard/utils";
import { Badge } from "@/src/components/ui/badge";
import type { PermissionProfile } from "@/src/types/integrations-hub";

interface CopyableFieldProps {
  label?: string;
  render: () => ReactNode;
  value: string;
}

type CopyStatus = "idle" | "copied" | "error";

const CopyableField = ({ label, render, value }: CopyableFieldProps) => {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const scheduleReset = () => {
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setStatus("idle");
    }, 2000);
  };

  const handleCopy = async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      await copyTextToClipboard(value);
      setStatus("copied");
      scheduleReset();
    } catch (errorValue) {
      console.error("Failed to copy to clipboard", errorValue);
      setStatus("error");
      scheduleReset();
    }
  };

  const ariaLabel = status === "error"
    ? `${label ?? "Copy to clipboard"} (failed)`
    : label ?? "Copy to clipboard";

  return (
    <div className="group relative">
      {render()}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        data-copied={status === "copied"}
        data-error={status === "error"}
        className="absolute right-1.5 top-1.5 cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[copied=true]:opacity-100 data-[error=true]:opacity-100 data-[copied=false]:data-[error=false]:opacity-0"
      >
        {status === "error" ? (
          <CircleX className="h-3.5 w-3.5 text-red-400" />
        ) : status === "copied" ? (
          <CircleCheck className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-[var(--color-text-base)]" />
        )}
      </button>
    </div>
  );
};

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
        value={
          <CopyableField
            value={schemaEndpoint}
            label={`Copy ${label} OpenAPI schema URL`}
            render={() => (
              <code className="block break-all pr-7 text-xs text-[var(--color-text-active)]">{schemaEndpoint}</code>
            )}
          />
        }
      />
    </div>
    <CopyableField
      value={promptExample}
      label={`Copy ${label} example agent prompt`}
      render={() => (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
            Example agent prompt
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 pr-9 text-xs leading-6 text-[var(--color-text-base)]">
            {promptExample}
          </pre>
        </div>
      )}
    />
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
            value={
              <CopyableField
                value={agentMcpEndpoint}
                label="Copy MCP endpoint"
                render={() => (
                  <code className="block break-all pr-7 text-xs text-[var(--color-text-active)]">{agentMcpEndpoint}</code>
                )}
              />
            }
          />
          <KeyValueRow
            label="Example tool"
            value={
              <CopyableField
                value={agentMcpToolName}
                label="Copy example tool name"
                render={() => (
                  <code className="block break-all pr-7 text-xs text-[var(--color-text-active)]">{agentMcpToolName}</code>
                )}
              />
            }
          />
        </div>
        <CopyableField
          value={agentMcpConfigExample}
          label="Copy MCP config example"
          render={() => (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
                MCP config example
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 pr-9 text-xs leading-6 text-[var(--color-text-base)]">
                {agentMcpConfigExample}
              </pre>
            </div>
          )}
        />
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
  isLoading,
  error,
}: {
  profiles: PermissionProfile[];
  isLoading: boolean;
  error: string | null;
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
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <h3 className="text-sm font-semibold text-white">Agent key</h3>
        <p className="mt-1 text-sm text-[var(--color-text-base)]">
          {error
            ? `Unable to load agent key: ${error}`
            : isLoading
              ? "Loading agent key…"
              : "No agent key available. Save a permission profile to provision one."}
        </p>
      </div>
    );
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
  agentMcpConfigExample: string;
  agentMcpEndpoint: string;
  agentMcpToolName: string;
  agentOpenApiSchemaEndpoint: string;
  agentRestPromptExample: string;
  isAdmin: boolean;
  permissionProfiles: PermissionProfile[];
  permissionProfilesLoading: boolean;
  permissionProfilesError: string | null;

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
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  isAdmin,
  permissionProfiles,
  permissionProfilesLoading,
  permissionProfilesError,
  userKey,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
}: AgentConnectionSectionProps) => (
  <section className="space-y-3">
    <CompactPanel title="API keys" icon={KeyRound}>
      <div className="space-y-3">
        <AgentKeyProfileSelector
          profiles={permissionProfiles}
          isLoading={permissionProfilesLoading}
          error={permissionProfilesError}
        />
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

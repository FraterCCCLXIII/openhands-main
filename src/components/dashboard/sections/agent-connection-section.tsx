import { CheckCircle2, Copy, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

import {
  CompactPanel,
  KeyValueRow,
} from "@/src/components/dashboard/shared";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

interface DashboardApiKeyCardProps {
  description: string;
  maskedValue: string;
  badgeTone?: "default" | "success" | "warning" | "danger";
  badgeLabel: string;
  copied: boolean;
  label: string;
  onCopy: () => void | Promise<void>;
  onRevealToggle: () => void | Promise<void>;
  revealDisabled?: boolean;
  revealed: boolean;
}

const DashboardApiKeyCard = ({
  description,
  maskedValue,
  badgeTone = "default",
  badgeLabel,
  copied,
  label,
  onCopy,
  onRevealToggle,
  revealDisabled = false,
  revealed,
}: DashboardApiKeyCardProps) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <p className="mt-1 text-sm text-[var(--color-text-base)]">{description}</p>
      </div>
      <Badge tone={badgeTone}>{badgeLabel}</Badge>
    </div>
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
      <code className="block break-all text-sm text-white">{maskedValue}</code>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="secondary"
        className="h-8 gap-2 rounded-md px-3 text-xs"
        onClick={onRevealToggle}
        disabled={revealDisabled}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {revealed ? "Hide" : "Reveal"}
      </Button>
      <Button
        variant="secondary"
        className="h-8 gap-2 rounded-md px-3 text-xs"
        onClick={onCopy}
        disabled={revealDisabled}
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        Copy
      </Button>
    </div>
  </div>
);

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

interface AgentConnectionSectionProps {
  adminKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
    hasKey: boolean;
    maskedValue: string;
    revealed: boolean;
  };
  adminPromptExample: string;
  adminSchemaEndpoint: string;
  agentKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
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
  userKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
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
  userKey,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
}: AgentConnectionSectionProps) => (
  <section className="space-y-3">
    <CompactPanel title="API keys" icon={KeyRound}>
      <div className="space-y-3">
        <DashboardApiKeyCard
          label="Agent key"
          description="Give this key to your agent."
          maskedValue={agentKey.maskedValue || "No agent key available yet."}
          badgeTone={contextApiReady ? "success" : "warning"}
          badgeLabel="agent"
          copied={agentKey.copied}
          onRevealToggle={agentKey.toggleReveal}
          onCopy={agentKey.handleCopy}
          revealDisabled={!contextApiReady}
          revealed={agentKey.revealed}
        />
        <DashboardApiKeyCard
          label="User automation key"
          description="Use this key to programmatically manage user-scoped context-layer settings."
          maskedValue={userKey.maskedValue || "No user automation key yet. Reveal or copy to create one."}
          badgeTone={userKey.hasKey ? "warning" : "default"}
          badgeLabel="user"
          copied={userKey.copied}
          onRevealToggle={userKey.handleReveal}
          onCopy={userKey.handleCopy}
          revealed={userKey.revealed}
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
            revealed={adminKey.revealed}
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

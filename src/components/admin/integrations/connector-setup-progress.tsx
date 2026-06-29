"use client";

import { CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import { type ReactNode, useState } from "react";

import { isOAuthMcpConnector } from "@/src/components/admin/integrations/connector-predicates";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { fetchJson } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

export interface ConnectorSetupProgressProps {
  connector: ManagedConnectorDefinition;
  connection: IntegrationConnectionStatus | null;
  indexing: boolean;
  onIndex: () => void;
}

interface SetupStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  /** Optional CTA for the step. */
  action?: ReactNode;
  gatedHint?: string;
}

const oauthClientConfigured = (connector: ManagedConnectorDefinition) =>
  Boolean(
    connector.oauthConfigured &&
      connector.oauthClientStatus !== "missing" &&
      connector.oauthClientStatus !== "unreadable",
  );

const buildOAuthStartPath = (connector: ManagedConnectorDefinition) =>
  `/api/oauth/${encodeURIComponent(connector.slug)}/start?integrationKey=${encodeURIComponent(
    connector.slug,
  )}&redirectTo=${encodeURIComponent(
    `/admin-integrations/?managedConnector=${encodeURIComponent(connector.slug)}`,
  )}`;

interface OAuthStartResponse {
  redirectUrl: string;
}

async function startOAuthConnection(connector: ManagedConnectorDefinition) {
  const response = await fetchJson<OAuthStartResponse>(
    buildOAuthStartPath(connector),
    { headers: { Accept: "application/json" } },
  );
  if (!response.redirectUrl) {
    throw new Error("OAuth start response did not include a redirect URL.");
  }
  window.location.href = response.redirectUrl;
}

const StepRow = ({ step }: { step: SetupStep }) => (
  <li
    className={cn(
      "flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-3 text-sm leading-6 text-[var(--color-text-base)] md:flex-row md:items-center md:justify-between",
    )}
    data-setup-step={step.key}
    data-setup-step-completed={step.completed ? "true" : "false"}
  >
    <div className="flex min-w-0 items-start gap-2">
      {step.completed ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
      ) : (
        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-white">{step.title}</p>
        <p className="text-xs leading-5 text-[var(--color-text-base)]">
          {step.description}
        </p>
        {step.gatedHint && !step.completed ? (
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
            {step.gatedHint}
          </p>
        ) : null}
      </div>
    </div>
    {step.action ? <div className="shrink-0">{step.action}</div> : null}
  </li>
);

export const ConnectorSetupProgress = ({
  connector,
  connection,
  indexing,
  onIndex,
}: ConnectorSetupProgressProps) => {
  const isOauthMcp = isOAuthMcpConnector(connector);
  const clientConfigured = oauthClientConfigured(connector);
  const connectionConfigured = Boolean(connection);
  const toolsIndexed = connector.tools.length > 0;
  const [oauthStarting, setOauthStarting] = useState(false);

  const steps: SetupStep[] = [];

  if (connector.authStrategy === "oauth2") {
    steps.push({
      key: "oauth-client",
      title: "Configure OAuth client",
      description:
        "Store the OAuth client ID and secret from the provider so users can authorize their own accounts.",
      completed: clientConfigured,
      action: clientConfigured ? (
        <Badge tone="success">Configured</Badge>
      ) : (
        <Badge tone="warning">Missing</Badge>
      ),
    });
  } else if (connector.authStrategy !== "none") {
    steps.push({
      key: "service-credentials",
      title: "Confirm service credentials",
      description: `Each user supplies their own ${connector.credentialLabel} when they connect. No admin credential is required.`,
      completed: true,
      action: <Badge tone="success">Per-user</Badge>,
    });
  }

  if (isOauthMcp) {
    steps.push({
      key: "connect-account",
      title: "Connect your own account",
      description:
        "Authorize your own provider account so the deployment can list tools and verify the connector works before users see it.",
      completed: connectionConfigured,
      gatedHint: clientConfigured
        ? undefined
        : "Configure the OAuth client above first.",
      action: connectionConfigured ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            Connected as {connection?.displayName || connection?.externalAccountId || "your account"}
          </span>
          <button
            type="button"
            disabled={oauthStarting}
            onClick={() => {
              setOauthStarting(true);
              void startOAuthConnection(connector).catch(() => setOauthStarting(false));
            }}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {oauthStarting ? "Redirecting…" : "Reconnect"}
          </button>
        </div>
      ) : clientConfigured ? (
        <button
          type="button"
          disabled={oauthStarting}
          onClick={() => {
            setOauthStarting(true);
            void startOAuthConnection(connector).catch(() => setOauthStarting(false));
          }}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {oauthStarting ? "Redirecting…" : `Connect ${connector.name}`}
        </button>
      ) : (
        <Badge tone="warning">Pending</Badge>
      ),
    });
  }

  steps.push({
    key: "index-tools",
    title: "Index tools",
    description: isOauthMcp
      ? "Discover the full tool list from the provider so it can be reviewed and constrained for users."
      : "Generate the full tool list from the published schema so it can be reviewed and constrained for users.",
    completed: toolsIndexed,
    gatedHint: isOauthMcp && !connectionConfigured
      ? "Connect your own account above first — the provider requires a user token to list tools."
      : undefined,
    action: (
      <Button
        type="button"
        variant="ghost"
        className="h-8 gap-2 rounded-md px-3 text-xs"
        disabled={indexing || (isOauthMcp && !connectionConfigured)}
        onClick={onIndex}
        aria-label={`Index ${connector.name} tools`}
      >
        <RefreshCw className={cn("h-4 w-4", indexing && "animate-spin")} />
        {indexing
          ? "Indexing…"
          : toolsIndexed
            ? "Refresh indexed tools"
            : "Index tools"}
      </Button>
    ),
  });

  steps.push({
    key: "set-access",
    title: "Set tool access ceilings",
    description:
      "Choose the maximum access level each user is allowed for every indexed tool. Users inherit these ceilings when they connect.",
    completed: toolsIndexed,
    gatedHint: toolsIndexed
      ? undefined
      : "Index tools above first to review and constrain them.",
    action: toolsIndexed ? (
      <Badge tone="success">{connector.tools.length} tools</Badge>
    ) : (
      <Badge tone="warning">No tools yet</Badge>
    ),
  });

  const completedCount = steps.filter((step) => step.completed).length;
  const allComplete = completedCount === steps.length && steps.length > 0;

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] p-4"
      data-connector-setup-progress={connector.slug}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">Setup progress</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-base)]">
            Complete each step to make sure {connector.name} works for every user
            before it leaves this page.
          </p>
        </div>
        <Badge tone={allComplete ? "success" : "warning"}>
          {completedCount}/{steps.length} steps
        </Badge>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </ol>
      {allComplete ? (
        <p className="mt-3 rounded-lg border border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.1)] px-3 py-2 text-xs leading-5 text-[var(--color-success)]">
          {connector.name} is ready for users. They can connect it from the
          integrations wizard.
        </p>
      ) : null}
    </div>
  );
};

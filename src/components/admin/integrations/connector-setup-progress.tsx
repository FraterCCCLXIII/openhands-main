"use client";

import { CheckCircle2, ChevronDown, ChevronRight, CircleDashed, RefreshCw, Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { isOAuthMcpConnector } from "@/src/components/admin/integrations/connector-predicates";
import { getToolAccessMode, ToolRow } from "@/src/components/integrations/tool-access-controls";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { fetchJson } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

// ── helpers ──────────────────────────────────────────────────────────────

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

const parseScopes = (value: string) =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

// ── config form state ────────────────────────────────────────────────────

export interface ConfigFormState {
  provider: "mcp" | "http";
  apiBaseUrl: string;
  serverUrl: string;
  openApiUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string;
  optionalScopes: string;
  oauthClientId: string;
  oauthClientSecret: string;
  submitting: boolean;
  deleting: boolean;
  indexing: boolean;
  status: "idle" | "success" | "error";
  message: string;
}

export const createConfigForm = (connector: ManagedConnectorDefinition): ConfigFormState => ({
  provider: (connector.provider as "mcp" | "http") || "mcp",
  apiBaseUrl: connector.apiBaseUrl ?? "",
  serverUrl: connector.serverUrl ?? "",
  openApiUrl: connector.openApiUrl ?? "",
  authorizationUrl: connector.oauthConfig?.authorizationUrl ?? "",
  tokenUrl: connector.oauthConfig?.tokenUrl ?? "",
  scopes: (connector.oauthConfig?.scopes ?? []).join(", "),
  optionalScopes: (connector.oauthConfig?.optionalScopes ?? []).join(", "),
  oauthClientId: "",
  oauthClientSecret: "",
  submitting: false,
  deleting: false,
  indexing: false,
  status: "idle",
  message: "",
});

export const buildConfigPayload = (connector: ManagedConnectorDefinition, form: ConfigFormState) => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
  iconBg: connector.iconBg,
  iconColor: connector.iconColor,
  appUrl: connector.appUrl,
  docsUrl: connector.docsUrl,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  provider: form.provider,
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
  apiBaseUrl: form.provider === "http" ? form.apiBaseUrl.trim() : undefined,
  serverUrl: form.provider === "mcp" ? form.serverUrl.trim() : undefined,
  openApiUrl: form.provider === "http" ? form.openApiUrl.trim() || undefined : undefined,
  oauthConfig: connector.authStrategy === "oauth2" ? {
    authorizationUrl: form.authorizationUrl.trim(),
    tokenUrl: form.tokenUrl.trim(),
    scopes: parseScopes(form.scopes),
    optionalScopes: parseScopes(form.optionalScopes),
    pkce: connector.oauthConfig?.pkce,
    clientAuthentication: connector.oauthConfig?.clientAuthentication,
    registrationUrl: connector.oauthConfig?.registrationUrl,
    additionalAuthorizationParams: connector.oauthConfig?.additionalAuthorizationParams,
    additionalTokenParams: connector.oauthConfig?.additionalTokenParams,
  } : undefined,
  oauthClientId: form.oauthClientId.trim(),
  oauthClientSecret: form.oauthClientSecret.trim(),
  tools: connector.tools,
  enabled: connector.enabled,
});

// ── step card ────────────────────────────────────────────────────────────

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
  disabled?: boolean;
  disabledHint?: string;
  children?: ReactNode;
  dataStepKey: string;
}

const StepCard = ({ stepNumber, title, description, completed, disabled, disabledHint, children, dataStepKey }: StepCardProps) => {
  const [collapsed, setCollapsed] = useState(completed);
  const wasCompletedRef = useRef(completed);

  // Auto-collapse when a step transitions to completed, but allow re-expand
  useEffect(() => {
    if (completed && !wasCompletedRef.current) {
      setCollapsed(true);
    }
    wasCompletedRef.current = completed;
  }, [completed]);

  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--color-surface-subtle)] p-4",
        completed ? "border-[color:rgba(165,231,94,0.3)]" : "border-[var(--color-border)]",
      )}
      data-setup-step={dataStepKey}
      data-setup-step-completed={completed ? "true" : "false"}
    >
      <div className="flex items-start gap-2">
        {completed ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
        ) : (
          <CircleDashed className={cn("mt-0.5 h-5 w-5 shrink-0", disabled ? "text-[var(--color-text-muted)] opacity-50" : "text-[var(--color-text-muted)]")} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Step {stepNumber}</span>
            {completed ? <Badge tone="success">Done</Badge> : null}
            {completed && children ? (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
                aria-expanded={!collapsed}
                aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {collapsed ? "Show" : "Hide"}
              </button>
            ) : null}
          </div>
          <h4 className="mt-0.5 text-sm font-semibold text-white">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-base)]">{description}</p>
          {disabledHint && !completed ? (
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{disabledHint}</p>
          ) : null}
        </div>
      </div>
      {children && !collapsed ? <div className="mt-3">{children}</div> : null}
    </div>
  );
};

// ── action button (consistent styling) ───────────────────────────────────

const StepButton = ({ children, disabled, type, onClick }: { children: ReactNode; disabled?: boolean; type?: "button" | "submit"; onClick?: () => void }) => (
  <Button
    type={type ?? "button"}
    disabled={disabled}
    onClick={onClick}
    className="h-9 gap-2 rounded-md px-4 text-sm"
  >
    {children}
  </Button>
);

// ── main component ───────────────────────────────────────────────────────

export interface ConnectorSetupProgressProps {
  connector: ManagedConnectorDefinition;
  connection: IntegrationConnectionStatus | null;
  configForm: ConfigFormState;
  oauthCallbackBaseUrl: string;
  isRegistered: boolean;
  onConfigFormChange: (updates: Partial<ConfigFormState>) => void;
  onSaveConfig: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onIndex: () => void;
  onToolAccessModeChange: (toolName: string, nextMode: string) => void;
}

const inputClassName = "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]";

export const ConnectorSetupProgress = ({
  connector,
  connection,
  configForm,
  oauthCallbackBaseUrl,
  isRegistered,
  onConfigFormChange,
  onSaveConfig,
  onDelete,
  onIndex,
  onToolAccessModeChange,
}: ConnectorSetupProgressProps) => {
  const isOauthMcp = isOAuthMcpConnector(connector);
  const isOAuth = connector.authStrategy === "oauth2";
  const isDynamicOAuth = isOAuth && !connector.oauthConfig?.authorizationUrl;
  const clientConfigured =
    isRegistered && (isDynamicOAuth || oauthClientConfigured(connector));
  const connectionConfigured = Boolean(connection);
  const toolsIndexed = connector.tools.length > 0;
  const step1InferredDone = isRegistered && (isOauthMcp ? (clientConfigured || connectionConfigured || toolsIndexed) : true);
  const [oauthStarting, setOauthStarting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const callbackUrl = `${oauthCallbackBaseUrl}/${connector.slug}/callback`;

  const usesDynamicRegistration =
    isOAuth &&
    connector.oauthConfig?.clientAuthentication === "none" &&
    Boolean(connector.oauthConfig?.registrationUrl);
  const needsManualOAuthClient = isOAuth && !usesDynamicRegistration && !isDynamicOAuth;
  const isHttp = configForm.provider === "http";

  const handleConnect = () => {
    setOauthStarting(true);
    void startOAuthConnection(connector).catch(() => setOauthStarting(false));
  };

  const step1Completed = step1InferredDone;

  return (
    <>
      {/* Step 1: Configure integration */}
      <StepCard
        stepNumber={1}
        title="Configure integration"
        description={isDynamicOAuth
          ? "This connector uses dynamic OAuth — endpoints are discovered automatically at runtime. Register it to make it available, then connect your account."
          : isOAuth
            ? "Set the server URL, OAuth endpoints, scopes, and client credentials for this connector."
            : "Set the server URL and connection details for this connector."}
        completed={step1Completed}
        dataStepKey="configure-integration"
      >
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveConfig}>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
            Provider type
            <select
              value={configForm.provider}
              onChange={(e) => onConfigFormChange({ provider: e.target.value as "mcp" | "http" })}
              className={inputClassName}
            >
              <option value="mcp">Remote MCP</option>
              <option value="http">Managed HTTP / OpenAPI</option>
            </select>
          </label>
          <div className="flex items-end text-[11px] leading-5 text-[var(--color-text-base)]">
            Updated {new Date(connector.updatedAt).toLocaleString()}
          </div>

          {/* Advanced section (collapsed by default) */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Advanced
            </button>
            {advancedOpen ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {isHttp ? (
                  <>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                      API base URL
                      <input type="url" value={configForm.apiBaseUrl} onChange={(e) => onConfigFormChange({ apiBaseUrl: e.target.value })} className={inputClassName} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                      OpenAPI schema URL
                      <input type="url" value={configForm.openApiUrl} onChange={(e) => onConfigFormChange({ openApiUrl: e.target.value })} placeholder="https://developers.example.com/openapi.json" className={cn(inputClassName, "placeholder:text-[var(--color-text-base)]")} />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                    MCP server URL
                    <input type="url" value={configForm.serverUrl} onChange={(e) => onConfigFormChange({ serverUrl: e.target.value })} className={inputClassName} />
                  </label>
                )}

                {isOAuth ? (
                  <>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                      Authorization URL
                      <input type="url" value={configForm.authorizationUrl} onChange={(e) => onConfigFormChange({ authorizationUrl: e.target.value })} className={inputClassName} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                      Token URL
                      <input type="url" value={configForm.tokenUrl} onChange={(e) => onConfigFormChange({ tokenUrl: e.target.value })} className={inputClassName} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                      Required scopes (comma separated)
                      <input type="text" value={configForm.scopes} onChange={(e) => onConfigFormChange({ scopes: e.target.value })} className={inputClassName} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                      Optional scopes (comma separated)
                      <input type="text" value={configForm.optionalScopes} onChange={(e) => onConfigFormChange({ optionalScopes: e.target.value })} placeholder="contacts.write, settings.read" className={inputClassName} />
                    </label>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {needsManualOAuthClient ? (
            <>
              <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                OAuth client ID {clientConfigured ? "(replace)" : ""}
                <input type="text" value={configForm.oauthClientId} onChange={(e) => onConfigFormChange({ oauthClientId: e.target.value })} className={inputClassName} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                OAuth client secret {clientConfigured ? "(replace)" : ""}
                <input type="password" value={configForm.oauthClientSecret} onChange={(e) => onConfigFormChange({ oauthClientSecret: e.target.value })} className={inputClassName} />
              </label>
            </>
          ) : null}

          {/* Callback URL hint */}
          {needsManualOAuthClient ? (
            <div className="md:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-base)]">
              Set the redirect URI to <code className="mx-1 text-white">{callbackUrl}</code> for this deployment.
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <StepButton type="submit" disabled={configForm.submitting || configForm.deleting || configForm.indexing}>
              {configForm.submitting ? (isRegistered ? "Saving…" : "Registering…") : (isRegistered ? "Save Config" : "Register connector")}
            </StepButton>
            {isRegistered ? (
              <Button type="button" variant="danger" className="h-9 gap-2 rounded-md px-4 text-sm" disabled={configForm.submitting || configForm.deleting || configForm.indexing} aria-label={`Delete ${connector.name} connector`} onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                {configForm.deleting ? "Deleting…" : "Delete"}
              </Button>
            ) : null}
            {configForm.message ? (
              <p className={configForm.status === "error" ? "text-sm text-[var(--color-danger)]" : "text-sm text-[var(--color-text-base)]"}>
                {configForm.message}
              </p>
            ) : null}
          </div>
        </form>
      </StepCard>

      {/* Step 2: Connect your account (only for OAuth MCP) */}
      {isOauthMcp ? (
        <StepCard
          stepNumber={2}
          title="Connect your account"
          description="Authorize your own provider account so the deployment can list tools and verify the connector works."
          completed={connectionConfigured}
          disabled={!clientConfigured}
          disabledHint={!clientConfigured ? "Save the integration config above first." : undefined}
          dataStepKey="connect-account"
        >
          <div className="flex flex-wrap items-center gap-3">
            {connectionConfigured ? (
              <>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Connected as {connection?.displayName || connection?.externalAccountId || "your account"}
                </span>
                <StepButton disabled={oauthStarting || !clientConfigured} onClick={handleConnect}>
                  {oauthStarting ? "Redirecting…" : "Re-connect"}
                </StepButton>
              </>
            ) : (
              <StepButton disabled={oauthStarting || !clientConfigured} onClick={handleConnect}>
                {oauthStarting ? "Redirecting…" : "Connect"}
              </StepButton>
            )}
          </div>
        </StepCard>
      ) : null}

      {/* Step 3: Index tools & set access ceilings */}
      <StepCard
        stepNumber={isOauthMcp ? 3 : 2}
        title="Index tools"
        description={isOauthMcp
          ? "Discover the full tool list from the provider so it can be reviewed and constrained for users."
          : "Generate the full tool list from the published schema so it can be reviewed and constrained for users."}
        completed={toolsIndexed}
        disabled={isOauthMcp ? !connectionConfigured : !step1Completed}
        disabledHint={isOauthMcp && !connectionConfigured
          ? "Connect your account above first — the provider requires a user token to list tools."
          : !step1Completed
            ? "Save the integration config above first."
            : undefined}
        dataStepKey="index-tools"
      >
        <div className="flex flex-wrap items-center gap-3">
          <StepButton disabled={configForm.indexing || (isOauthMcp ? !connectionConfigured : !step1Completed)} onClick={onIndex}>
            <RefreshCw className={cn("h-4 w-4", configForm.indexing && "animate-spin")} />
            {configForm.indexing ? "Indexing…" : "Index Tools"}
          </StepButton>
          {toolsIndexed ? (
            <Badge tone="success">{connector.tools.length} tools indexed</Badge>
          ) : null}
        </div>

        {toolsIndexed ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              Optionally, select tool-level access controls. Changes are saved automatically.
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <div className="divide-y divide-[var(--color-border)]">
                {connector.tools.slice().sort((a, b) => a.name.localeCompare(b.name)).map((toolSpec) => {
                  const accessMode = getToolAccessMode({
                    name: toolSpec.name,
                    description: toolSpec.description,
                    enabled: toolSpec.accessMode !== "disabled",
                    accessMode: toolSpec.accessMode,
                    fineGrainedPermissions: true,
                    defaultScopes: toolSpec.defaultScopes,
                    executionMode: "provider",
                    config: {},
                  });
                  return (
                    <ToolRow
                      key={toolSpec.name}
                      name={toolSpec.name}
                      toolSpec={toolSpec}
                      accessMode={accessMode}
                      onAccessModeChange={(nextMode) => onToolAccessModeChange(toolSpec.name, nextMode)}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </StepCard>
      {/* All complete banner */}
      {step1Completed && (!isOauthMcp || connectionConfigured) && toolsIndexed ? (
        <p className="rounded-lg border border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.1)] px-3 py-2 text-xs leading-5 text-[var(--color-success)]">
          {connector.name} is ready for users. They can connect it from the integrations wizard.
        </p>
      ) : null}
    </>
  );
};

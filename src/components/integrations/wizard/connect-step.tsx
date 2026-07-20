import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { buildAdminSectionHref, type AdminSection } from "@/src/lib/admin-routes";
import { fetchJson } from "@/src/lib/fetch-json";
import { uiPath } from "@/src/shared/paths";
import type {
  ManagedConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/integrations-hub";
import {
  authStrategyLabel,
  formatDebugDetails,
  integrationWizardInputClassName,
  type DiscoverFeedback,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";
import { WizardFeedback } from "@/src/components/integrations/wizard/shared";
import { useTracking } from "@/src/hooks/use-tracking";

interface ConnectStepProps {
  managedConnectors: ManagedConnectorOption[];
  managedConnectorsError?: string | null;
  managedConnectorsPending: boolean;
  canDiscover: boolean;
  connectorSearch: string;
  discoverFeedback: DiscoverFeedback | null;
  discoverPending: boolean;
  draft: WizardDraft;
  isAdmin?: boolean;
  oauthConnectionEnabled: boolean;
  redirectSection: AdminSection;
  requiresOAuthConnection: boolean;
  selectedConnection: IntegrationConnectionStatus | null;
  selectedConnector: ManagedConnectorOption | null;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onConnectorSearchChange: (value: string) => void;
  onDiscover: () => void;
  onSelectKind: (kind: WizardDraft["kind"]) => void;
}

interface OAuthStartResponse {
  redirectUrl: string;
}

const buildOAuthStartPath = ({
  provider,
  integrationKey,
  redirectSection,
  managedConnector,
}: {
  provider: string;
  integrationKey: string;
  redirectSection: AdminSection;
  managedConnector: string;
}) =>
  `/api/oauth/${provider}/start?integrationKey=${encodeURIComponent(
    integrationKey,
  )}&redirectTo=${encodeURIComponent(
    buildAdminSectionHref(redirectSection, {
      showIntegrationWizard: "1",
      managedConnector,
      integrationKey,
    }),
  )}`;

const startOAuthConnection = async ({
  provider,
  integrationKey,
  redirectSection,
  managedConnector,
}: {
  provider: string;
  integrationKey: string;
  redirectSection: AdminSection;
  managedConnector: string;
}) => {
  const response = await fetchJson<OAuthStartResponse>(
    buildOAuthStartPath({
      provider,
      integrationKey,
      redirectSection,
      managedConnector,
    }),
    { headers: { Accept: "application/json" } },
  );
  if (!response.redirectUrl) {
    throw new Error("OAuth start response did not include a redirect URL.");
  }
  return response.redirectUrl;
};

export const ConnectStep = ({
  managedConnectors,
  managedConnectorsError,
  managedConnectorsPending,
  canDiscover,
  connectorSearch,
  discoverFeedback,
  discoverPending,
  draft,
  isAdmin = false,
  oauthConnectionEnabled,
  redirectSection,
  requiresOAuthConnection,
  selectedConnection,
  selectedConnector,
  setDraft,
  onConnectorSearchChange,
  onDiscover,
  onSelectKind,
}: ConnectStepProps) => {
  const { track } = useTracking();
  const managedConnectorAuthStrategy = selectedConnector?.authStrategy ?? null;
  const selectedResource =
    selectedConnection?.resources?.find(
      (resource) => resource.id === draft.resourceId,
    ) ??
    (selectedConnector?.connectionModel?.selectionMode === "automatic"
      ? selectedConnection?.resources?.[0]
      : undefined);
  const requiresResourceSelection =
    selectedConnector?.connectionModel?.selectionMode === "post_auth";

  return (
    <div className="space-y-4">
      {draft.kind === "managed" ? (
        <>
          <label className="grid gap-1.5 text-sm text-white">
            <span className="font-medium">Managed connector</span>
            <input
              className={integrationWizardInputClassName}
              list="managed-connector-options"
              placeholder={
                managedConnectorsPending
                  ? "Loading supported connectors..."
                  : "Search supported connectors..."
              }
              value={connectorSearch}
              onChange={(event) => onConnectorSearchChange(event.target.value)}
              disabled={managedConnectorsPending}
            />
            <datalist id="managed-connector-options">
              {managedConnectors.map((connector) => (
                <option
                  key={connector.slug}
                  value={`${connector.name} (${connector.slug})`}
                />
              ))}
            </datalist>
            <span className="text-xs leading-5 text-[var(--color-text-base)]">
              Don&apos;t see a connector you want?{" "}
              <a
                href={uiPath("/admin-integrations")}
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
              >
                Click here.
              </a>
            </span>
          </label>

          {managedConnectorsError ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              {managedConnectorsError}
            </div>
          ) : null}

          {selectedConnector ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3.5 text-sm text-[var(--color-text-base)]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{selectedConnector.name}</p>
                <Badge>{authStrategyLabel(selectedConnector.authStrategy)}</Badge>
                {selectedConnection ? <Badge tone="success">Connected</Badge> : null}
              </div>
              <p className="mt-1.5 leading-6">
                {selectedConnector.description ||
                  "This managed connector is registered for the current deployment."}
              </p>
              {requiresOAuthConnection ? (
                <div className="mt-3 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-white">
                      {selectedConnection
                        ? selectedConnection.displayName || `${selectedConnector.name} account connected`
                        : `Connect your ${selectedConnector.name} account`}
                    </p>
                    <p className="text-xs leading-5 text-[var(--color-text-base)]">
                      {!oauthConnectionEnabled
                        ? `${selectedConnector.name} needs an admin to configure OAuth for this deployment before users can connect it.`
                        : selectedConnection
                          ? `This ${selectedConnector.name} token is stored per user in the database and will be injected automatically for agent calls.`
                          : selectedConnector.credentialHelp}
                    </p>
                    {selectedConnection?.expiresAt ? (
                      <p className="text-xs leading-5 text-[var(--color-text-base)]">
                        Expires {new Date(selectedConnection.expiresAt).toLocaleString()}.
                      </p>
                    ) : null}
                    {selectedResource ? (
                      <p className="text-xs leading-5 text-[var(--color-text-base)]">
                        {selectedResource.resourceType}: {selectedResource.displayName || selectedResource.externalResourceId}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="h-9 shrink-0 rounded-lg px-4 text-xs"
                    disabled={!draft.managedConnectorSlug.trim() || !oauthConnectionEnabled}
                    onClick={() => {
                      const connectorSlug = selectedConnector.slug;
                      const action = selectedConnection ? "reconnect" : "connect";
                      void startOAuthConnection({
                        provider: selectedConnector.slug,
                        integrationKey: draft.key.trim() || selectedConnector.slug,
                        redirectSection,
                        managedConnector:
                          draft.managedConnectorSlug || selectedConnector.slug,
                      })
                        .then((redirectUrl) => {
                          track("integration_oauth_started", {
                            connector_slug: connectorSlug,
                            action,
                          });
                          window.location.href = redirectUrl;
                        })
                        .catch((error: unknown) => {
                          track("integration_setup_failed", {
                            stage: "oauth_start",
                            integration_kind: "managed",
                            connector_slug: connectorSlug,
                          });
                          window.alert(
                            error instanceof Error
                              ? error.message
                              : "Failed to start OAuth flow.",
                          );
                        });
                    }}
                  >
                    {!oauthConnectionEnabled
                      ? "Contact admin"
                      : selectedConnection
                        ? "Reconnect"
                        : "Connect"}
                  </Button>
                </div>
              ) : null}
              {requiresResourceSelection && selectedConnection ? (
                <label className="mt-3 grid gap-1.5 text-sm text-white">
                  <span className="font-medium">
                    Choose {selectedConnector.connectionModel?.resourceType || "resource"}
                  </span>
                  <select
                    className={integrationWizardInputClassName}
                    value={draft.resourceId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        resourceId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a resource…</option>
                    {(selectedConnection.resources ?? []).map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.displayName || resource.externalResourceId}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs leading-5 text-[var(--color-text-base)]">
                    This integration instance will be bound to the selected resource.
                  </span>
                </label>
              ) : null}
              {selectedConnector.appUrl ? (
                <a
                  href={selectedConnector.appUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  Open provider docs
                </a>
              ) : null}
            </div>
          ) : null}

          {selectedConnector ? (
            <details className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-white">
                <span>Integration key &amp; display name</span>
                <span className="text-xs text-[var(--color-text-base)] group-open:hidden">Edit</span>
                <span className="hidden text-xs text-[var(--color-text-base)] group-open:inline">Hide</span>
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-white">
                  <span className="font-medium">Integration key</span>
                  <input
                    className={integrationWizardInputClassName}
                    placeholder="github"
                    value={draft.key}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        key: event.target.value,
                      }))
                    }
                    disabled={!draft.managedConnectorSlug.trim()}
                  />
                  <span className="text-xs leading-5 text-[var(--color-text-base)]">
                    Edit this if you want more than one saved connection for the same
                    managed connector.
                  </span>
                </label>
                <label className="grid gap-1.5 text-sm text-white">
                  <span className="font-medium">Display name</span>
                  <input
                    className={integrationWizardInputClassName}
                    placeholder="GitHub"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    disabled={!draft.managedConnectorSlug.trim()}
                  />
                </label>
              </div>
            </details>
          ) : null}

          {requiresOAuthConnection ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
              {!oauthConnectionEnabled
                ? `Contact an admin to configure OAuth for ${selectedConnector?.name ?? "this provider"} before you can add it.`
                : selectedConnection
                  ? `${selectedConnector?.name} is connected. Click Discover to save this integration with your stored OAuth credentials.`
                  : `Connect ${selectedConnector?.name ?? "this provider"} before discovering tools.`}
            </div>
          ) : managedConnectorAuthStrategy === "api_key" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm text-white md:col-span-2">
                <span className="font-medium">
                  {selectedConnector?.credentialLabel ?? "API key"}
                </span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder={
                    selectedConnector?.credentialPlaceholder ??
                    "Paste the provider API key"
                  }
                  value={draft.apiKey}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      apiKey: event.target.value,
                    }))
                  }
                  disabled={!draft.managedConnectorSlug.trim()}
                />
                <span className="text-xs leading-5 text-[var(--color-text-base)]">
                  {selectedConnector?.credentialHelp ??
                    "Provide the provider API key that this managed connector should use upstream."}
                </span>
              </label>
              {selectedConnector?.apiKeyHeaderName ? (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs leading-5 text-[var(--color-text-base)] md:col-span-2">
                  This connector sends your API key in the <code className="text-white">{selectedConnector.apiKeyHeaderName}</code> header.
                </div>
              ) : (
                <label className="grid gap-1.5 text-sm text-white md:col-span-2">
                  <span className="font-medium">API key header name</span>
                  <input
                    className={integrationWizardInputClassName}
                    placeholder="X-API-Key"
                    value={draft.headerName}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        headerName: event.target.value,
                      }))
                    }
                    disabled={!draft.managedConnectorSlug.trim()}
                  />
                </label>
              )}
            </div>
          ) : managedConnectorAuthStrategy === "basic" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">Username</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder="demo"
                  value={draft.username}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  disabled={!draft.managedConnectorSlug.trim()}
                />
              </label>
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  className={integrationWizardInputClassName}
                  placeholder="secret"
                  value={draft.password}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  disabled={!draft.managedConnectorSlug.trim()}
                />
              </label>
              <div className="text-xs leading-5 text-[var(--color-text-base)] md:col-span-2">
                {selectedConnector?.credentialHelp ??
                  "Provide the provider credentials that this managed connector should use upstream."}
              </div>
            </div>
          ) : managedConnectorAuthStrategy === "none" ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] px-3.5 py-3 text-sm text-[var(--color-text-base)]">
              No provider credential is required for {selectedConnector?.name ?? "this connector"}. Click Discover to load the available tools.
            </div>
          ) : (
            <label className="grid gap-1.5 text-sm text-white">
              <span className="font-medium">
                {selectedConnector?.credentialLabel ?? "Access token"}
              </span>
              <input
                className={integrationWizardInputClassName}
                placeholder={
                  selectedConnector?.credentialPlaceholder ?? "Paste the provider token"
                }
                value={draft.accessToken}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    accessToken: event.target.value,
                  }))
                }
                disabled={!draft.managedConnectorSlug.trim()}
              />
              <span className="text-xs leading-5 text-[var(--color-text-base)]">
                {selectedConnector?.credentialHelp ??
                  "Provide the provider credential that this managed connector should use upstream."}
              </span>
            </label>
          )}

          {isAdmin ? (
            <button
              type="button"
              className="self-start text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
              onClick={() => onSelectKind("mcp")}
            >
              Use a custom MCP server URL instead
            </button>
          ) : null}
        </>
      ) : (
        <>
          <button
            type="button"
            className="self-start text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            onClick={() => onSelectKind("managed")}
          >
            ← Browse the connector catalog instead
          </button>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-white">
              <span className="font-medium">Integration key</span>
              <input
                className={integrationWizardInputClassName}
                placeholder="my-mcp"
                value={draft.key}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm text-white">
              <span className="font-medium">Display name</span>
              <input
                className={integrationWizardInputClassName}
                placeholder="My MCP"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm text-white">
            <span className="font-medium">MCP server URL</span>
            <input
              className={integrationWizardInputClassName}
              placeholder="https://example.com/mcp"
              value={draft.serverUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  serverUrl: event.target.value,
                }))
              }
            />
            <span className="text-xs leading-5 text-[var(--color-text-base)]">
              The dashboard connects to your MCP server and calls <code className="text-white">listTools</code>. GitHub&apos;s hosted MCP server uses <code className="text-white">https://api.githubcopilot.com/mcp/</code>.
            </span>
          </label>

          <details className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-white">
              <span>Credentials (optional)</span>
              <span className="text-xs text-[var(--color-text-base)] group-open:hidden">Add</span>
              <span className="hidden text-xs text-[var(--color-text-base)] group-open:inline">Hide</span>
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">Access token</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder="OAuth or bearer token"
                  value={draft.accessToken}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      accessToken: event.target.value,
                    }))
                  }
                />
                <span className="text-xs leading-5 text-[var(--color-text-base)]">
                  Use this for bearer-token MCP servers such as GitHub&apos;s hosted MCP.
                </span>
              </label>
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">API key</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder="Secret used with a header"
                  value={draft.apiKey}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      apiKey: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">API key header name</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder="X-API-Key"
                  value={draft.headerName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      headerName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">Username</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder="demo"
                  value={draft.username}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  className={integrationWizardInputClassName}
                  placeholder="secret"
                  value={draft.password}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </details>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="button" disabled={!canDiscover || discoverPending} onClick={onDiscover}>
          {discoverPending ? "Discovering…" : "Discover tools"}
        </Button>
      </div>

      {discoverFeedback ? (
        <WizardFeedback tone={discoverFeedback.tone} testId="discover-feedback">
          <p>{discoverFeedback.message}</p>
          {discoverFeedback.debugDetails ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Admin diagnostics
              </p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-white/85">
                {formatDebugDetails(discoverFeedback.debugDetails)}
              </pre>
            </div>
          ) : null}
        </WizardFeedback>
      ) : null}
    </div>
  );
};

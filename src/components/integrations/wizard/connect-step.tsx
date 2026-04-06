import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { buildAdminSectionHref, type AdminSection } from "@/src/lib/admin-routes";
import type {
  BuiltInConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/context-layer";
import {
  authStrategyLabel,
  formatDebugDetails,
  integrationWizardInputClassName,
  type DiscoverFeedback,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";
import { WizardFeedback } from "@/src/components/integrations/wizard/shared";

interface ConnectStepProps {
  builtInConnectors: BuiltInConnectorOption[];
  builtInConnectorsError?: string | null;
  builtInConnectorsPending: boolean;
  canDiscover: boolean;
  connectorSearch: string;
  discoverFeedback: DiscoverFeedback | null;
  discoverPending: boolean;
  draft: WizardDraft;
  oauthConnectionEnabled: boolean;
  redirectSection: AdminSection;
  requiresOAuthConnection: boolean;
  selectedConnection: IntegrationConnectionStatus | null;
  selectedConnector: BuiltInConnectorOption | null;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onBack: () => void;
  onConnectorSearchChange: (value: string) => void;
  onDiscover: () => void;
}

export const ConnectStep = ({
  builtInConnectors,
  builtInConnectorsError,
  builtInConnectorsPending,
  canDiscover,
  connectorSearch,
  discoverFeedback,
  discoverPending,
  draft,
  oauthConnectionEnabled,
  redirectSection,
  requiresOAuthConnection,
  selectedConnection,
  selectedConnector,
  setDraft,
  onBack,
  onConnectorSearchChange,
  onDiscover,
}: ConnectStepProps) => {
  const builtInAuthStrategy = selectedConnector?.authStrategy ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        {draft.kind === "built_in" ? (
          <>
            <label className="grid gap-2 text-sm text-white">
              <span className="font-medium">Built-in connector</span>
              <input
                className={integrationWizardInputClassName}
                list="built-in-connector-options"
                placeholder={
                  builtInConnectorsPending
                    ? "Loading supported connectors..."
                    : "Choose GitHub, Notion, Slack..."
                }
                value={connectorSearch}
                onChange={(event) => onConnectorSearchChange(event.target.value)}
                disabled={builtInConnectorsPending}
              />
              <datalist id="built-in-connector-options">
                {builtInConnectors.map((connector) => (
                  <option
                    key={connector.slug}
                    value={`${connector.name} (${connector.slug})`}
                  />
                ))}
              </datalist>
              <span className="text-xs leading-6 text-[var(--color-text-base)]">
                Use the dropdown and start typing to filter the managed connectors
                registered for this deployment. Selecting one auto-fills the key
                and display name below.
              </span>
              <span className="text-xs leading-6 text-[var(--color-text-base)]">
                Don&apos;t see a connector you want?{" "}
                <a
                  href="/admin-integrations"
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  Click here.
                </a>
              </span>
            </label>

            {builtInConnectorsError ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
                {builtInConnectorsError}
              </div>
            ) : null}

            {selectedConnector ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm text-[var(--color-text-base)]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{selectedConnector.name}</p>
                  <Badge>{selectedConnector.slug}</Badge>
                  <Badge>{authStrategyLabel(selectedConnector.authStrategy)}</Badge>
                  {selectedConnection ? <Badge tone="success">Connected</Badge> : null}
                </div>
                <p className="mt-2 leading-7">
                  {selectedConnector.description ||
                    "This managed connector is registered for the current deployment."}
                </p>
                {requiresOAuthConnection ? (
                  <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {selectedConnection
                            ? selectedConnection.displayName || `${selectedConnector.name} account connected`
                            : `Connect your ${selectedConnector.name} account`}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                          {!oauthConnectionEnabled
                            ? `${selectedConnector.name} is not available on this deployment yet. Visit the admin integrations page to request it.`
                            : selectedConnection
                              ? `This ${selectedConnector.name} token is stored per user in the database and will be injected automatically for agent calls.`
                              : selectedConnector.credentialHelp}
                        </p>
                        {selectedConnection?.expiresAt ? (
                          <p className="mt-1 text-xs leading-6 text-[var(--color-text-base)]">
                            Expires {new Date(selectedConnection.expiresAt).toLocaleString()}.
                          </p>
                        ) : null}
                      </div>
                      <Button
                        className="h-9 rounded-lg px-4 text-xs"
                        disabled={!draft.builtInSlug.trim() || !oauthConnectionEnabled}
                        onClick={() => {
                          window.location.href = `/api/oauth/${selectedConnector.slug}/start?integrationKey=${encodeURIComponent(
                            draft.key.trim() || selectedConnector.slug,
                          )}&redirectTo=${encodeURIComponent(
                            buildAdminSectionHref(redirectSection, {
                              showIntegrationWizard: "1",
                              builtIn: draft.builtInSlug || selectedConnector.slug,
                            }),
                          )}`;
                        }}
                      >
                        {!oauthConnectionEnabled
                          ? "Not available"
                          : selectedConnection
                            ? "Reconnect"
                            : "Connect"}
                      </Button>
                    </div>
                  </div>
                ) : null}
                {selectedConnector.appUrl ? (
                  <a
                    href={selectedConnector.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    Open provider docs
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white">
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
                  disabled={!draft.builtInSlug.trim()}
                />
                <span className="text-xs leading-6 text-[var(--color-text-base)]">
                  Edit this if you want more than one saved connection for the same
                  managed connector.
                </span>
              </label>

              <label className="grid gap-2 text-sm text-white">
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
                  disabled={!draft.builtInSlug.trim()}
                />
              </label>
            </div>

            {requiresOAuthConnection ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-text-base)]">
                {!oauthConnectionEnabled
                  ? `${selectedConnector?.name ?? "This provider"} is not available on this deployment yet. Visit /admin-integrations to request it.`
                  : selectedConnection
                    ? `${selectedConnector?.name} is connected. Click Discover to save this integration with your stored OAuth credentials.`
                    : `Connect ${selectedConnector?.name ?? "this provider"} before discovering tools.`}
              </div>
            ) : builtInAuthStrategy === "api_key" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-white md:col-span-2">
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
                    disabled={!draft.builtInSlug.trim()}
                  />
                  <span className="text-xs leading-6 text-[var(--color-text-base)]">
                    {selectedConnector?.credentialHelp ??
                      "Provide the provider API key that this managed connector should use upstream."}
                  </span>
                </label>
                {selectedConnector?.apiKeyHeaderName ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3 text-xs leading-6 text-[var(--color-text-base)] md:col-span-2">
                    This connector sends your API key in the <code className="text-white">{selectedConnector.apiKeyHeaderName}</code> header.
                  </div>
                ) : (
                  <label className="grid gap-2 text-sm text-white md:col-span-2">
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
                      disabled={!draft.builtInSlug.trim()}
                    />
                  </label>
                )}
              </div>
            ) : builtInAuthStrategy === "basic" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-white">
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
                    disabled={!draft.builtInSlug.trim()}
                  />
                </label>
                <label className="grid gap-2 text-sm text-white">
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
                    disabled={!draft.builtInSlug.trim()}
                  />
                </label>
                <div className="text-xs leading-6 text-[var(--color-text-base)] md:col-span-2">
                  {selectedConnector?.credentialHelp ??
                    "Provide the provider credentials that this managed connector should use upstream."}
                </div>
              </div>
            ) : builtInAuthStrategy === "none" ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-text-base)]">
                No provider credential is required for {selectedConnector?.name ?? "this connector"}. Click Discover to load the available tools.
              </div>
            ) : (
              <label className="grid gap-2 text-sm text-white">
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
                  disabled={!draft.builtInSlug.trim()}
                />
                <span className="text-xs leading-6 text-[var(--color-text-base)]">
                  {selectedConnector?.credentialHelp ??
                    "Provide the provider credential that this managed connector should use upstream."}
                </span>
              </label>
            )}
          </>
        ) : (
          <>
            <label className="grid gap-2 text-sm text-white">
              <span className="font-medium">Integration key</span>
              <input
                className={integrationWizardInputClassName}
                placeholder="figma-mcp"
                value={draft.key}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm text-white">
              <span className="font-medium">Display name</span>
              <input
                className={integrationWizardInputClassName}
                placeholder="Figma MCP"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm text-white">
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
              <span className="text-xs leading-6 text-[var(--color-text-base)]">
                Hosted MCP servers usually expose a streamable HTTP endpoint. GitHub&apos;s hosted MCP server uses <code className="text-white">https://api.githubcopilot.com/mcp/</code>. For local QA, a localhost MCP proxy URL also works.
              </span>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white">
                <span className="font-medium">Access token (optional)</span>
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
                <span className="text-xs leading-6 text-[var(--color-text-base)]">
                  Use this for bearer-token MCP servers such as GitHub&apos;s hosted MCP.
                </span>
              </label>
              <label className="grid gap-2 text-sm text-white">
                <span className="font-medium">API key (optional)</span>
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
              <label className="grid gap-2 text-sm text-white">
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
              <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Username (optional)</span>
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
                <label className="grid gap-2 text-sm text-white">
                  <span className="font-medium">Password (optional)</span>
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
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" type="button" onClick={onBack}>
            Back
          </Button>
          <Button type="button" disabled={!canDiscover || discoverPending} onClick={onDiscover}>
            {discoverPending ? "Discovering…" : "Discover tools"}
          </Button>
        </div>

        {discoverFeedback ? (
          <WizardFeedback tone={discoverFeedback.tone}>
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

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-sm leading-7 text-[var(--color-text-base)]">
        <p className="font-semibold text-white">What happens in this step</p>
        {draft.kind === "built_in" ? (
          <ul className="mt-3 space-y-2">
            <li>• The dashboard loads the managed connectors registered for this service.</li>
            <li>• Choosing a connector auto-fills the integration key and display name, while still letting you customize them if needed.</li>
            <li>• For OAuth connectors, each user connects their own account and the token is stored server-side for that user only.</li>
            <li>• Choosing Discover tools calls the MCP for the selected connector and brings its full tool list into the review step.</li>
          </ul>
        ) : (
          <ul className="mt-3 space-y-2">
            <li>
              • The dashboard connects to your MCP server and calls <code className="text-white">listTools</code>.
            </li>
            <li>• It infers auth from the credentials you provided, without making you choose an auth type explicitly.</li>
            <li>
              • For GitHub MCP, use <code className="text-white">https://api.githubcopilot.com/mcp/</code>{" "}
              plus a GitHub PAT in <span className="text-white">Access token</span>.
            </li>
            <li>• Every discovered tool is prepared as enabled by default for the review step.</li>
          </ul>
        )}
      </div>
    </div>
  );
};

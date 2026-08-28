"use client";

import { ChevronRight } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { isOAuthMcpConnector } from "@/src/components/admin/integrations/connector-predicates";
import { ConnectorSetupProgress, type ConfigFormState, createConfigForm, buildConfigPayload } from "@/src/components/admin/integrations/connector-setup-progress";
import { Badge } from "@/src/components/ui/badge";
import { apiFetch } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import type {
  IntegrationCatalogOption,
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

// ── helpers (ported from integration-catalog-panel) ──────────────────────

const getProviderAuthStrategy = (provider: IntegrationCatalogOption) =>
  provider.connectionDefaults?.authStrategy ?? "oauth2";

const usesOAuthConnector = (provider: IntegrationCatalogOption) =>
  getProviderAuthStrategy(provider) === "oauth2";

/** Dynamic OAuth connectors (e.g. Atlassian, PayPal) discover their OAuth
 *  endpoints at runtime via .well-known metadata — the catalog has no
 *  authorizationUrl. They need no admin-supplied client credentials. */
const isDynamicOAuthConnector = (provider: IntegrationCatalogOption) =>
  usesOAuthConnector(provider) &&
  !provider.connectionDefaults?.oauthConfig?.authorizationUrl;

const usesDynamicOAuthRegistration = (provider: IntegrationCatalogOption) =>
  usesOAuthConnector(provider) &&
  provider.connectionDefaults?.oauthConfig?.clientAuthentication === "none" &&
  Boolean(provider.connectionDefaults?.oauthConfig?.registrationUrl);

const requiresManualOAuthClientCredentials = (provider: IntegrationCatalogOption) =>
  usesOAuthConnector(provider) &&
  !usesDynamicOAuthRegistration(provider) &&
  !isDynamicOAuthConnector(provider);

const isHttpManagedConnector = (provider: IntegrationCatalogOption) =>
  provider.connectionDefaults?.provider === "http" ||
  (!provider.connectionDefaults?.serverUrl && Boolean(provider.connectionDefaults?.apiBaseUrl));

const getManagedConnectorProvider = (provider: IntegrationCatalogOption) =>
  provider.connectionDefaults?.provider ??
  (provider.connectionDefaults?.serverUrl ? "mcp" : "http");

const integrationStatusLabel = (provider: IntegrationCatalogOption) => {
  const strategy = getProviderAuthStrategy(provider);
  return strategy === "oauth2" ? "OAuth" : "Ready";
};

/** Convert a catalog option into a minimal ManagedConnectorDefinition so
 *  the same onboarding steps can be rendered for unregistered connectors. */
const catalogToConnector = (catalog: IntegrationCatalogOption): ManagedConnectorDefinition => {
  const cd = catalog.connectionDefaults;
  const authStrategy = cd?.authStrategy ?? "oauth2";
  return {
    slug: catalog.slug,
    name: catalog.name,
    description: catalog.description,
    logoUrl: catalog.logoUrl,
    iconBg: catalog.iconBg,
    iconColor: catalog.iconColor,
    appUrl: catalog.appUrl,
    docsUrl: catalog.docsUrl,
    categories: catalog.categories,
    authModes: cd?.authModes?.length && cd.authModes.every(Boolean) ? cd.authModes : [authStrategy],
    authStrategy,
    provider: (cd?.provider as "mcp" | "http") ?? getManagedConnectorProvider(catalog),
    oauthConfigured: cd?.oauthConfigured ?? false,
    oauthClientStatus: cd?.oauthConfigured ? "decryptable" : "missing",
    credentialLabel: cd?.credentialLabel ?? `Connect ${catalog.name}`,
    credentialPlaceholder: cd?.credentialPlaceholder ?? `Connect ${catalog.name}`,
    credentialHelp: cd?.credentialHelp ?? `OAuth connection for ${catalog.name}.`,
    apiBaseUrl: cd?.apiBaseUrl,
    openApiUrl: cd?.openApiUrl,
    serverUrl: cd?.serverUrl,
    oauthConfig: cd?.oauthConfig,
    connectionModel: cd?.connectionModel,
    tools: [],
    enabled: true,
    createdAt: "",
    updatedAt: "",
  };
};

const matchesSearch = (connector: { name: string; slug: string; description: string; categories: string[] }, query: string) => {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return [connector.name, connector.slug, connector.description, ...connector.categories].some((field) =>
    field.toLowerCase().includes(q),
  );
};

// ── types ────────────────────────────────────────────────────────────────

// ── avatar ───────────────────────────────────────────────────────────────

const ConnectorAvatar = ({ name, logoUrl, iconBg, iconColor }: { name: string; logoUrl?: string | null; iconBg?: string | null; iconColor?: string | null }) => {
  const style = { backgroundColor: iconBg ?? undefined, color: iconColor ?? undefined };
  if (logoUrl?.trim()) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" style={style} aria-hidden="true">
        <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-2" />
      </span>
    );
  }
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  return (
    <span role="img" aria-label={`${name} logo`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs font-semibold tracking-[0.14em] text-white" style={style}>
      {initials}
    </span>
  );
};

// ── main component ───────────────────────────────────────────────────────

export interface UnifiedConnectorListProps {
  integrationCatalog: IntegrationCatalogOption[];
  managedConnectors: ManagedConnectorDefinition[];
  connections: IntegrationConnectionStatus[];
  oauthCallbackBaseUrl: string;
  canRegisterManagedConnectors: boolean;
  initialExpandedSlug?: string | null;
  onConnectorRegistered?: (connector: ManagedConnectorDefinition) => void;
  onConnectorUpdated?: (connector: ManagedConnectorDefinition) => void;
  onConnectorDeleted?: (connector: ManagedConnectorDefinition) => void;
  onConnectionsStale?: () => void;
  onManagedConnectorsStale?: () => void;
  search?: string;
}

export function UnifiedConnectorList({
  integrationCatalog,
  managedConnectors,
  connections,
  oauthCallbackBaseUrl,
  canRegisterManagedConnectors,
  initialExpandedSlug = null,
  onConnectorRegistered,
  onConnectorUpdated,
  onConnectorDeleted,
  onConnectionsStale,
  onManagedConnectorsStale,
  search = "",
}: UnifiedConnectorListProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(initialExpandedSlug);
  const [configForms, setConfigForms] = useState<Record<string, ConfigFormState>>({});
  const [localManagedConnectors, setLocalManagedConnectors] = useState(
    () => (Array.isArray(managedConnectors) ? managedConnectors : []),
  );

  // Sync when the parent refetches (e.g. after registration or deletion)
  const [prevManagedConnectors, setPrevManagedConnectors] = useState(managedConnectors);
  if (managedConnectors !== prevManagedConnectors) {
    setPrevManagedConnectors(managedConnectors);
    setLocalManagedConnectors(
      Array.isArray(managedConnectors) ? managedConnectors : [],
    );
  }

  const connectionByKey = useMemo(() => {
    const map = new Map<string, IntegrationConnectionStatus>();
    for (const conn of Array.isArray(connections) ? connections : []) {
      map.set(conn.integrationKey, conn);
    }
    return map;
  }, [connections]);

  const managedBySlug = useMemo(() => {
    const map = new Map<string, ManagedConnectorDefinition>();
    for (const mc of localManagedConnectors) {
      map.set(mc.slug, mc);
    }
    return map;
  }, [localManagedConnectors]);

  // Build unified list: all catalog entries, joined with managed connector data
  const unifiedList = useMemo(() => {
    return integrationCatalog
      .map((catalogEntry) => {
        const managed = managedBySlug.get(catalogEntry.slug);
        return { catalog: catalogEntry, managed: managed ?? null };
      })
      .filter((entry) => matchesSearch(entry.catalog, search))
      .sort((a, b) => {
        // Registered connectors first, then by name
        if (a.managed && !b.managed) return -1;
        if (!a.managed && b.managed) return 1;
        return a.catalog.name.localeCompare(b.catalog.name);
      });
  }, [integrationCatalog, managedBySlug, search]);

  const getConfigForm = (connector: ManagedConnectorDefinition) =>
    configForms[connector.slug] ?? createConfigForm(connector);

  const updateConfigForm = (connector: ManagedConnectorDefinition, updates: Partial<ConfigFormState>) =>
    setConfigForms((current) => ({
      ...current,
      [connector.slug]: { ...(current[connector.slug] ?? createConfigForm(connector)), ...updates },
    }));

  // ── registration (step 1 for unregistered) ────────────────────────────

  const handleRegister = async (event: FormEvent<HTMLFormElement>, provider: IntegrationCatalogOption) => {
    event.preventDefault();
    const pseudoConnector = catalogToConnector(provider);
    const form = getConfigForm(pseudoConnector);

    if (requiresManualOAuthClientCredentials(provider)) {
      if (!form.oauthClientId.trim() || !form.oauthClientSecret.trim()) {
        updateConfigForm(pseudoConnector, {
          submitting: false,
          status: "error",
          message: "Paste both the OAuth client ID and client secret before registering this connector.",
        });
        return;
      }
    }

    const isHttp = isHttpManagedConnector(provider);
    if (isHttp && !(form.apiBaseUrl.trim() || provider.connectionDefaults?.apiBaseUrl)) {
      updateConfigForm(pseudoConnector, {
        submitting: false,
        status: "error",
        message: "Enter the API base URL before registering this connector.",
      });
      return;
    }

    updateConfigForm(pseudoConnector, { submitting: true, status: "idle", message: "" });

    try {
      const response = await apiFetch("/api/admin/modify-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildConfigPayload(pseudoConnector, form)),
      });
      const body = (await response.json().catch(() => null)) as ManagedConnectorDefinition & { detail?: string } | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to register connector.");
      }
      const updatedConnector = body as ManagedConnectorDefinition;
      setLocalManagedConnectors((current) => {
        const next = current.filter((c) => c.slug !== updatedConnector.slug);
        return [...next, updatedConnector];
      });
      onConnectorRegistered?.(updatedConnector);
      onManagedConnectorsStale?.();
      onConnectionsStale?.();
      updateConfigForm(pseudoConnector, { submitting: false, status: "success", message: "Connector registered." });
    } catch (error) {
      updateConfigForm(pseudoConnector, {
        submitting: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to register connector.",
      });
    }
  };

  // ── save (edit existing connector) ────────────────────────────────────

  const handleSave = async (event: FormEvent<HTMLFormElement>, connector: ManagedConnectorDefinition) => {
    event.preventDefault();
    const form = getConfigForm(connector);

    if (form.provider === "mcp" && !form.serverUrl.trim()) {
      updateConfigForm(connector, { status: "error", message: "Enter the MCP server URL before saving." });
      return;
    }
    if (form.provider === "http" && !form.apiBaseUrl.trim()) {
      updateConfigForm(connector, { status: "error", message: "Enter the API base URL before saving." });
      return;
    }

    updateConfigForm(connector, { submitting: true, status: "idle", message: "" });

    try {
      const response = await apiFetch("/api/admin/modify-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildConfigPayload(connector, form)),
      });
      const body = (await response.json().catch(() => null)) as ManagedConnectorDefinition & { detail?: string } | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to save connector changes.");
      }
      const updatedConnector = body as ManagedConnectorDefinition;
      setLocalManagedConnectors((current) =>
        current.map((c) => (c.slug === updatedConnector.slug ? updatedConnector : c)),
      );
      onConnectorUpdated?.(updatedConnector);
      onConnectionsStale?.();
      updateConfigForm(connector, { submitting: false, status: "success", message: "Connector updated." });
    } catch (error) {
      updateConfigForm(connector, {
        submitting: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to save connector changes.",
      });
    }
  };

  // ── delete ────────────────────────────────────────────────────────────

  const handleDelete = async (connector: ManagedConnectorDefinition) => {
    if (typeof window !== "undefined" && typeof window.confirm === "function" &&
      !window.confirm(`Delete the managed connector "${connector.name}" (${connector.slug})? Existing user integrations will need this connector to be re-registered before they can be used again.`)) {
      return;
    }
    updateConfigForm(connector, { deleting: true, status: "idle", message: "" });
    try {
      const response = await apiFetch(`/api/admin/modify-integrations/${encodeURIComponent(connector.slug)}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to delete connector.");
      }
      setLocalManagedConnectors((current) => current.filter((c) => c.slug !== connector.slug));
      onConnectorDeleted?.(connector);
      onConnectionsStale?.();
      onManagedConnectorsStale?.();
      setConfigForms((current) => {
        const next = { ...current };
        delete next[connector.slug];
        return next;
      });
      setExpandedSlug((current) => (current === connector.slug ? null : current));
    } catch (error) {
      updateConfigForm(connector, {
        deleting: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to delete connector.",
      });
    }
  };

  // ── index tools ───────────────────────────────────────────────────────

  const handleIndex = async (connector: ManagedConnectorDefinition) => {
    updateConfigForm(connector, { indexing: true, status: "idle", message: "" });
    try {
      const response = await apiFetch(`/api/admin/modify-integrations/${encodeURIComponent(connector.slug)}/functions`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as ManagedConnectorDefinition & { detail?: string } | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to index tools.");
      }
      const updatedConnector = { ...connector, tools: (body as ManagedConnectorDefinition).tools ?? connector.tools };
      setLocalManagedConnectors((current) =>
        current.map((c) => (c.slug === updatedConnector.slug ? updatedConnector : c)),
      );
      onConnectorUpdated?.(updatedConnector);
      onManagedConnectorsStale?.();
      updateConfigForm(connector, { indexing: false, status: "success", message: `Indexed ${(body as ManagedConnectorDefinition).tools?.length ?? 0} tools.` });
    } catch (error) {
      updateConfigForm(connector, {
        indexing: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to index tools.",
      });
    }
  };

  // ── tool access mode change ───────────────────────────────────────────

  const handleToolAccessModeChange = async (connector: ManagedConnectorDefinition, toolName: string, nextMode: string) => {
    const updatedTools = connector.tools.map((t) =>
      t.name === toolName ? { ...t, accessMode: nextMode as typeof t.accessMode } : t,
    );
    const updatedConnector = { ...connector, tools: updatedTools };
    setLocalManagedConnectors((current) =>
      current.map((c) => (c.slug === updatedConnector.slug ? updatedConnector : c)),
    );
    try {
      await apiFetch("/api/admin/modify-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildConfigPayload(updatedConnector, getConfigForm(updatedConnector))),
      });
      onConnectorUpdated?.(updatedConnector);
    } catch {
      // revert on failure
      setLocalManagedConnectors((current) =>
        current.map((c) => (c.slug === connector.slug ? connector : c)),
      );
    }
  };

  // ── render ────────────────────────────────────────────────────────────

  if (unifiedList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
        No connectors matched the current search.
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
      {unifiedList.map(({ catalog, managed }) => {
        const isExpanded = expandedSlug === catalog.slug;
        const isRegistered = managed !== null;
        const authStrategy = getProviderAuthStrategy(catalog);
        const connection = managed ? connectionByKey.get(managed.slug) ?? null : null;
        const stepsCompleted = managed
          ? [
              isOAuthMcpConnector(managed)
                ? Boolean(managed.oauthConfigured) || Boolean(connection) || managed.tools.length > 0
                : true,
              isOAuthMcpConnector(managed) ? Boolean(connection) : true,
              managed.tools.length > 0,
            ].filter(Boolean).length
          : 0;

        return (
          <div key={catalog.slug} data-connector-slug={catalog.slug} data-connector-registered={isRegistered}>
            {/* Row header */}
            <button
              type="button"
              onClick={() => setExpandedSlug(isExpanded ? null : catalog.slug)}
              aria-expanded={isExpanded}
              className="flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-3 text-left text-sm"
            >
              <ConnectorAvatar name={catalog.name} logoUrl={catalog.logoUrl} iconBg={catalog.iconBg} iconColor={catalog.iconColor} />
              <span className="shrink-0 font-medium text-white">{catalog.name}</span>
              <span className="shrink-0 text-[var(--color-text-muted)]">({catalog.slug})</span>
              <span className="shrink-0 text-[var(--color-text-base)]">—</span>
              <span className="shrink-0 text-[var(--color-text-base)]">
                {isRegistered ? `${stepsCompleted} steps done` : integrationStatusLabel(catalog)}
              </span>
              {isRegistered && managed?.tools.length ? (
                <span className="shrink-0 text-[var(--color-accent)]">— {managed.tools.length} tools</span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[var(--color-text-base)]">{catalog.description}</span>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {isExpanded ? "Hide" : "Show"}
              </span>
              <ChevronRight className={cn("h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform", isExpanded && "rotate-90")} />
            </button>

            {/* Expanded panel */}
            {isExpanded ? (
              <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm leading-7 text-[var(--color-text-base)]">
                {/* Description + badges */}
                {catalog.notes ? <p className="mb-3">{catalog.notes}</p> : null}
                <div className={`${catalog.notes ? "mt-3" : ""} mb-4 flex flex-wrap gap-2`}>
                  {catalog.categories.map((cat) => (
                    <Badge key={`${catalog.slug}-${cat}`}>{cat}</Badge>
                  ))}
                  <Badge>{authStrategy}</Badge>
                  {isRegistered ? <Badge tone="success">Registered</Badge> : <Badge tone="warning">Not registered</Badge>}
                </div>

                {canRegisterManagedConnectors ? (
                  <div className="space-y-3">
                    <ConnectorSetupProgress
                      connector={managed ?? catalogToConnector(catalog)}
                      connection={connection}
                      configForm={getConfigForm(managed ?? catalogToConnector(catalog))}
                      oauthCallbackBaseUrl={oauthCallbackBaseUrl ?? ""}
                      isRegistered={isRegistered}
                      onConfigFormChange={(updates) => updateConfigForm(managed ?? catalogToConnector(catalog), updates)}
                      onSaveConfig={(e) => void (isRegistered && managed ? handleSave(e, managed) : handleRegister(e, catalog))}
                      onDelete={() => { if (managed) void handleDelete(managed); }}
                      onIndex={() => { if (managed) void handleIndex(managed); }}
                      onToolAccessModeChange={(toolName, nextMode) => { if (managed) void handleToolAccessModeChange(managed, toolName, nextMode); }}
                    />
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-base)]">
                    Only app administrators listed in <code className="text-white">INTHUB_APP_ADMIN_EMAILS</code> can register providers from this page.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

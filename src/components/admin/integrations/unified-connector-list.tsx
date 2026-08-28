"use client";

import { ChevronRight } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { isOAuthMcpConnector } from "@/src/components/admin/integrations/connector-predicates";
import { ConnectorSetupProgress, type ConfigFormState, createConfigForm, buildConfigPayload } from "@/src/components/admin/integrations/connector-setup-progress";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { Badge } from "@/src/components/ui/badge";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
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
/** Synthesize a catalog row for a registered connector that is not in the
 *  researched provider list (for example a custom MCP server). */
export const managedToCatalogOption = (
  connector: ManagedConnectorDefinition,
): IntegrationCatalogOption => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  categories: connector.categories?.length ? connector.categories : ["Custom"],
  appUrl: connector.appUrl,
  docsUrl: connector.docsUrl,
  logoUrl: connector.logoUrl,
  iconBg: connector.iconBg,
  iconColor: connector.iconColor,
  notes: "",
  popularityRank: 0,
  connectionDefaults: {
    provider: connector.provider ?? "mcp",
    authModes: connector.authModes,
    authStrategy: connector.authStrategy === "mcp_session" ? "none" : connector.authStrategy,
    oauthConfigured: connector.oauthConfigured,
    oauthConfig: connector.oauthConfig,
    credentialLabel: connector.credentialLabel,
    credentialPlaceholder: connector.credentialPlaceholder,
    credentialHelp: connector.credentialHelp,
    apiBaseUrl: connector.apiBaseUrl,
    serverUrl: connector.serverUrl,
    openApiUrl: connector.openApiUrl,
    connectionModel: connector.connectionModel,
  },
});

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

// ── details modal ────────────────────────────────────────────────────────

interface ConnectorDetailsModalProps {
  catalog: IntegrationCatalogOption;
  children: ReactNode;
  onClose: () => void;
}

const ConnectorDetailsModal = ({ catalog, children, onClose }: ConnectorDetailsModalProps) => (
  <ModalBackdrop
    ariaLabel={ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDetailModalAriaLabel(catalog.name)}
    onClose={onClose}
  >
    <section
      data-testid={`connector-details-modal-${catalog.slug}`}
      data-connector-details={catalog.slug}
      className={cn(modalShellClassName("xl"), "min-h-0 max-h-[90vh] gap-0")}
    >
      <ModalCloseButton
        onClose={onClose}
        testId={`connector-details-modal-close-${catalog.slug}`}
      />

      <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-7">
        <div className="flex items-start gap-3 pr-6">
          <ConnectorAvatar
            name={catalog.name}
            logoUrl={catalog.logoUrl}
            iconBg={catalog.iconBg}
            iconColor={catalog.iconColor}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">{catalog.name}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {catalog.slug}
            </p>
            {catalog.description ? (
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-base)]">
                {catalog.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 text-sm leading-7 text-[var(--color-text-base)]">
          {children}
        </div>
      </div>

      <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
        <BrandButton type="button" variant="secondary" onClick={onClose}>
          {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorCloseLabel}
        </BrandButton>
      </div>
    </section>
  </ModalBackdrop>
);

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
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialExpandedSlug);
  const [prevInitialExpandedSlug, setPrevInitialExpandedSlug] = useState(initialExpandedSlug);
  if (initialExpandedSlug !== prevInitialExpandedSlug) {
    setPrevInitialExpandedSlug(initialExpandedSlug);
    if (initialExpandedSlug) {
      setSelectedSlug(initialExpandedSlug);
    }
  }
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

  // Catalog entries plus registered connectors that are not in the researched
  // provider list (custom MCP servers).
  const unifiedList = useMemo(() => {
    const catalogSlugs = new Set(integrationCatalog.map((entry) => entry.slug));
    const fromCatalog = integrationCatalog.map((catalogEntry) => ({
      catalog: catalogEntry,
      managed: managedBySlug.get(catalogEntry.slug) ?? null,
    }));
    const customOnly = localManagedConnectors
      .filter((connector) => !catalogSlugs.has(connector.slug))
      .map((connector) => ({
        catalog: managedToCatalogOption(connector),
        managed: connector,
      }));
    return [...fromCatalog, ...customOnly]
      .filter((entry) => matchesSearch(entry.catalog, search))
      .sort((a, b) => {
        if (a.managed && !b.managed) return -1;
        if (!a.managed && b.managed) return 1;
        return a.catalog.name.localeCompare(b.catalog.name);
      });
  }, [integrationCatalog, localManagedConnectors, managedBySlug, search]);

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
      setSelectedSlug((current) => (current === connector.slug ? null : current));
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

  const selectedCatalog = selectedSlug
    ? unifiedList.find((entry) => entry.catalog.slug === selectedSlug)?.catalog ?? null
    : null;
  const selectedManaged = selectedSlug ? managedBySlug.get(selectedSlug) ?? null : null;
  const selectedConnection = selectedManaged
    ? connectionByKey.get(selectedManaged.slug) ?? null
    : null;
  const selectedAuthStrategy = selectedCatalog ? getProviderAuthStrategy(selectedCatalog) : null;
  const selectedIsRegistered = selectedManaged !== null;

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
        {unifiedList.map(({ catalog, managed }) => {
          const isOpen = selectedSlug === catalog.slug;
          const isRegistered = managed !== null;
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
              <button
                type="button"
                onClick={() => setSelectedSlug(catalog.slug)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={cn(
                  "flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-interactive-hover)]",
                  isOpen && "bg-[var(--color-interactive-hover)]",
                )}
              >
                <ConnectorAvatar name={catalog.name} logoUrl={catalog.logoUrl} iconBg={catalog.iconBg} iconColor={catalog.iconColor} />
                <span className="shrink-0 font-medium text-white">{catalog.name}</span>
                {isRegistered ? (
                  <span className="shrink-0 text-[var(--color-text-base)]">
                    {stepsCompleted} steps done
                  </span>
                ) : (
                  <Badge>{integrationStatusLabel(catalog)}</Badge>
                )}
                {isRegistered && managed?.tools.length ? (
                  <span className="shrink-0 text-[var(--color-accent)]">— {managed.tools.length} tools</span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-[var(--color-text-base)]">{catalog.description}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              </button>
            </div>
          );
        })}
      </div>

      {selectedCatalog ? (
        <ConnectorDetailsModal
          catalog={selectedCatalog}
          onClose={() => setSelectedSlug(null)}
        >
          {selectedCatalog.notes ? <p className="mb-3">{selectedCatalog.notes}</p> : null}
          <div className={`${selectedCatalog.notes ? "mt-3" : ""} mb-4 flex flex-wrap gap-2`}>
            {selectedCatalog.categories.map((cat) => (
              <Badge key={`${selectedCatalog.slug}-${cat}`}>{cat}</Badge>
            ))}
            {selectedAuthStrategy ? <Badge>{selectedAuthStrategy}</Badge> : null}
            {selectedIsRegistered ? <Badge tone="success">Registered</Badge> : <Badge tone="warning">Not registered</Badge>}
          </div>

          {canRegisterManagedConnectors ? (
            <div className="space-y-3">
              <ConnectorSetupProgress
                connector={selectedManaged ?? catalogToConnector(selectedCatalog)}
                connection={selectedConnection}
                configForm={getConfigForm(selectedManaged ?? catalogToConnector(selectedCatalog))}
                oauthCallbackBaseUrl={oauthCallbackBaseUrl ?? ""}
                isRegistered={selectedIsRegistered}
                onConfigFormChange={(updates) =>
                  updateConfigForm(selectedManaged ?? catalogToConnector(selectedCatalog), updates)
                }
                onSaveConfig={(e) =>
                  void (selectedIsRegistered && selectedManaged
                    ? handleSave(e, selectedManaged)
                    : handleRegister(e, selectedCatalog))
                }
                onDelete={() => {
                  if (selectedManaged) void handleDelete(selectedManaged);
                }}
                onIndex={() => {
                  if (selectedManaged) void handleIndex(selectedManaged);
                }}
                onToolAccessModeChange={(toolName, nextMode) => {
                  if (selectedManaged) void handleToolAccessModeChange(selectedManaged, toolName, nextMode);
                }}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-base)]">
              Only app administrators listed in <code className="text-white">INTHUB_APP_ADMIN_EMAILS</code> can register providers from this page.
            </p>
          )}
        </ConnectorDetailsModal>
      ) : null}
    </>
  );
}

"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import type {
  ManagedConnectorDefinition,
  ManagedConnectorRecord,
} from "@/src/types/context-layer";

interface ManagedConnectorAdminListProps {
  initialManagedConnectors: ManagedConnectorDefinition[];
}

interface ManagedConnectorFormState {
  provider: "mcp" | "http";
  apiBaseUrl: string;
  serverUrl: string;
  openApiUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string;
  oauthClientId: string;
  oauthClientSecret: string;
  submitting: boolean;
  deleting: boolean;
  status: "idle" | "success" | "error";
  message: string;
}

const inputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]";

const parseScopes = (value: string) =>
  value
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);

const inferProvider = (connector: ManagedConnectorDefinition) =>
  connector.provider ?? (connector.openApiUrl ? "http" : "mcp");

const getCredentialStatusLabel = (connector: ManagedConnectorDefinition) => {
  if (connector.authStrategy === "oauth2") {
    return connector.oauthConfigured ? "OAuth ready" : "OAuth credentials missing";
  }

  return connector.oauthConfigured ? "Credentials configured" : "Credentials missing";
};

const createFormState = (
  connector: ManagedConnectorDefinition,
): ManagedConnectorFormState => ({
  provider: inferProvider(connector),
  apiBaseUrl: connector.apiBaseUrl ?? "",
  serverUrl: connector.serverUrl ?? "",
  openApiUrl: connector.openApiUrl ?? "",
  authorizationUrl: connector.oauthConfig?.authorizationUrl ?? "",
  tokenUrl: connector.oauthConfig?.tokenUrl ?? "",
  scopes: connector.oauthConfig?.scopes.join(", ") ?? "",
  oauthClientId: "",
  oauthClientSecret: "",
  submitting: false,
  deleting: false,
  status: "idle",
  message: "",
});

const buildManagedConnectorPayload = (
  connector: ManagedConnectorDefinition,
  form: ManagedConnectorFormState,
) => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
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
  openApiUrl:
    form.provider === "http" ? form.openApiUrl.trim() || undefined : undefined,
  oauthConfig:
    connector.authStrategy === "oauth2"
      ? {
          authorizationUrl: form.authorizationUrl.trim(),
          tokenUrl: form.tokenUrl.trim(),
          scopes: parseScopes(form.scopes),
        }
      : undefined,
  oauthClientId: form.oauthClientId.trim(),
  oauthClientSecret: form.oauthClientSecret.trim(),
  functions: connector.functions,
  enabled: connector.enabled,
});

const matchesManagedConnectorSearch = (
  connector: ManagedConnectorDefinition,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    connector.name,
    connector.slug,
    connector.description,
    inferProvider(connector),
    connector.authStrategy,
    getCredentialStatusLabel(connector),
    ...connector.categories,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
};

const getConnectorInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
};

const formatUpdatedAt = (value: string) =>
  value ? new Date(value).toLocaleString() : "Unknown";

const ConnectorAvatar = ({ connector }: { connector: ManagedConnectorDefinition }) => {
  if (connector.logoUrl?.trim()) {
    return (
      <img
        src={connector.logoUrl}
        alt={`${connector.name} logo`}
        className="h-10 w-10 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] object-cover"
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${connector.name} logo`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs font-semibold tracking-[0.14em] text-white"
    >
      {getConnectorInitials(connector.name)}
    </span>
  );
};

export function ManagedConnectorAdminList({
  initialManagedConnectors,
}: ManagedConnectorAdminListProps) {
  const [managedConnectors, setManagedConnectors] = useState(initialManagedConnectors);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [formStates, setFormStates] = useState<Record<string, ManagedConnectorFormState>>({});
  const [search, setSearch] = useState("");

  const sortedConnectors = useMemo(
    () =>
      [...managedConnectors].sort((left, right) =>
        left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug),
      ),
    [managedConnectors],
  );

  const filteredConnectors = useMemo(
    () =>
      sortedConnectors.filter((connector) =>
        matchesManagedConnectorSearch(connector, search),
      ),
    [search, sortedConnectors],
  );

  const visibleFunctionCount = useMemo(
    () =>
      filteredConnectors.reduce(
        (total, connector) => total + connector.functions.length,
        0,
      ),
    [filteredConnectors],
  );

  const updateFormState = (
    slug: string,
    connector: ManagedConnectorDefinition,
    updates: Partial<ManagedConnectorFormState>,
  ) => {
    setFormStates((current) => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? createFormState(connector)),
        ...updates,
      },
    }));
  };

  const getFormState = (connector: ManagedConnectorDefinition) =>
    formStates[connector.slug] ?? createFormState(connector);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    connector: ManagedConnectorDefinition,
  ) => {
    event.preventDefault();

    const form = getFormState(connector);

    if (form.provider === "mcp" && !form.serverUrl.trim()) {
      updateFormState(connector.slug, connector, {
        status: "error",
        message: "Enter the MCP server URL before saving this connector.",
      });
      return;
    }

    if (form.provider === "http" && !form.apiBaseUrl.trim()) {
      updateFormState(connector.slug, connector, {
        status: "error",
        message: "Enter the API base URL before saving this connector.",
      });
      return;
    }

    updateFormState(connector.slug, connector, {
      submitting: true,
      status: "idle",
      message: "",
    });

    try {
      const response = await fetch("/api/managed-connectors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildManagedConnectorPayload(connector, form)),
      });

      const body = (await response.json().catch(() => null)) as
        | (ManagedConnectorRecord & { detail?: string })
        | { detail?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to save connector changes.");
      }

      const updatedConnector = body as ManagedConnectorDefinition;
      setManagedConnectors((current) =>
        current.map((candidate) =>
          candidate.slug === connector.slug ? updatedConnector : candidate,
        ),
      );
      setExpandedSlug(updatedConnector.slug);
      setFormStates((current) => ({
        ...current,
        [connector.slug]: {
          ...createFormState(updatedConnector),
          submitting: false,
          status: "success",
          message: "Connector updated.",
        },
      }));
    } catch (error) {
      updateFormState(connector.slug, connector, {
        submitting: false,
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to save connector changes.",
      });
    }
  };

  const handleDelete = async (connector: ManagedConnectorDefinition) => {
    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Delete the managed connector \"${connector.name}\" (${connector.slug})? Existing user integrations will need this connector to be re-registered before they can be used again.`,
      )
    ) {
      return;
    }

    updateFormState(connector.slug, connector, {
      deleting: true,
      status: "idle",
      message: "",
    });

    try {
      const response = await fetch(
        `/api/managed-connectors/${encodeURIComponent(connector.slug)}`,
        {
          method: "DELETE",
        },
      );
      const body = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to delete connector.");
      }

      setManagedConnectors((current) =>
        current.filter((candidate) => candidate.slug !== connector.slug),
      );
      setExpandedSlug((current) => (current === connector.slug ? null : current));
      setFormStates((current) => {
        const next = { ...current };
        delete next[connector.slug];
        return next;
      });
    } catch (error) {
      updateFormState(connector.slug, connector, {
        deleting: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to delete connector.",
      });
    }
  };

  if (sortedConnectors.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
        No managed connectors are registered yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              Search and review registered connectors
            </h3>
            <p className="text-xs leading-6 text-[var(--color-text-base)]">
              Use the same compact card layout here to inspect configured providers,
              update service-level settings, and delete stale connectors without digging
              through hidden actions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
            <Badge>{filteredConnectors.length} connectors</Badge>
            <Badge>{visibleFunctionCount} functions</Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search managed connectors"
            aria-label="Search managed connectors"
            className={cn(inputClassName, "w-full lg:max-w-md")}
          />
        </div>
      </div>

      {filteredConnectors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-6 text-sm text-[var(--color-text-base)]">
          No managed connectors match the current search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConnectors.map((connector) => {
            const form = getFormState(connector);
            const isExpanded = expandedSlug === connector.slug;
            const provider = inferProvider(connector);
            const functionCount = connector.functions.length;

            return (
              <div
                key={connector.slug}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                data-managed-connector={connector.slug}
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <ConnectorAvatar connector={connector} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {connector.name}
                        </h3>
                        <Badge>{provider}</Badge>
                        <Badge>{connector.authStrategy}</Badge>
                        <Badge tone={connector.enabled ? "success" : "danger"}>
                          {connector.enabled ? "enabled" : "disabled"}
                        </Badge>
                        <Badge tone={connector.oauthConfigured ? "success" : "warning"}>
                          {getCredentialStatusLabel(connector)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                        {connector.description}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-base)]">
                        {connector.slug} · {functionCount} function
                        {functionCount === 1 ? "" : "s"} · updated {formatUpdatedAt(connector.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      className="h-8 gap-2 rounded-md px-3 text-xs"
                      disabled={form.submitting || form.deleting}
                      aria-label={`Delete ${connector.name} connector`}
                      onClick={() => void handleDelete(connector)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {form.deleting ? "Deleting…" : "Delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-md px-3 text-xs"
                      aria-expanded={isExpanded}
                      aria-controls={`managed-connector-details-${connector.slug}`}
                      onClick={() =>
                        setExpandedSlug(isExpanded ? null : connector.slug)
                      }
                    >
                      {isExpanded ? "Hide details" : "Show details"}
                      <ChevronRight
                        className={cn(
                          "ml-1 h-4 w-4 transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div
                    id={`managed-connector-details-${connector.slug}`}
                    className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]"
                  >
                    <div className="border-b border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-text-base)]">
                      Edit stale provider URLs or credential settings here. Saving updates the
                      existing service-level managed connector in place; deleting removes it
                      until an admin registers it again.
                    </div>
                    <form
                      className="grid gap-3 p-4 md:grid-cols-2"
                      onSubmit={(event) => void handleSubmit(event, connector)}
                    >
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                        Provider type
                        <select
                          value={form.provider}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              provider: event.target.value as "mcp" | "http",
                            })
                          }
                          className={inputClassName}
                        >
                          <option value="mcp">Remote MCP</option>
                          <option value="http">Managed HTTP / OpenAPI</option>
                        </select>
                      </label>
                      <div className="flex items-end text-[11px] leading-5 text-[var(--color-text-base)]">
                        Updated {formatUpdatedAt(connector.updatedAt)}
                      </div>

                      {form.provider === "mcp" ? (
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                          MCP server URL
                          <input
                            type="url"
                            value={form.serverUrl}
                            onChange={(event) =>
                              updateFormState(connector.slug, connector, {
                                serverUrl: event.target.value,
                              })
                            }
                            className={inputClassName}
                          />
                        </label>
                      ) : (
                        <>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                            API base URL
                            <input
                              type="url"
                              value={form.apiBaseUrl}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  apiBaseUrl: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                            OpenAPI schema URL
                            <input
                              type="url"
                              value={form.openApiUrl}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  openApiUrl: event.target.value,
                                })
                              }
                              placeholder="https://developers.example.com/openapi.json"
                              className={cn(
                                inputClassName,
                                "placeholder:text-[var(--color-text-base)]",
                              )}
                            />
                            <span className="text-[11px] leading-5 text-[var(--color-text-base)]">
                              Leave blank if you want to keep the current stored function
                              templates instead of regenerating them from a schema.
                            </span>
                          </label>
                        </>
                      )}

                      {connector.authStrategy === "oauth2" ? (
                        <>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                            Authorization URL
                            <input
                              type="url"
                              value={form.authorizationUrl}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  authorizationUrl: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                            Token URL
                            <input
                              type="url"
                              value={form.tokenUrl}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  tokenUrl: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)] md:col-span-2">
                            Scopes (comma separated)
                            <input
                              type="text"
                              value={form.scopes}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  scopes: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                            Replace OAuth client ID (optional)
                            <input
                              type="text"
                              value={form.oauthClientId}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  oauthClientId: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                            Replace OAuth client secret (optional)
                            <input
                              type="password"
                              value={form.oauthClientSecret}
                              onChange={(event) =>
                                updateFormState(connector.slug, connector, {
                                  oauthClientSecret: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </label>
                        </>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                        <Button type="submit" disabled={form.submitting || form.deleting}>
                          {form.submitting ? "Saving…" : "Save changes"}
                        </Button>
                        {form.message ? (
                          <p
                            className={
                              form.status === "error"
                                ? "text-sm text-[var(--color-danger)]"
                                : "text-sm text-[var(--color-text-base)]"
                            }
                          >
                            {form.message}
                          </p>
                        ) : null}
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

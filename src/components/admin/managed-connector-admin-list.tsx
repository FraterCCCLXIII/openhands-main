"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
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

const parseScopes = (value: string) =>
  value
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);

const inferProvider = (connector: ManagedConnectorDefinition) =>
  connector.provider ?? (connector.openApiUrl ? "http" : "mcp");

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

export function ManagedConnectorAdminList({
  initialManagedConnectors,
}: ManagedConnectorAdminListProps) {
  const [managedConnectors, setManagedConnectors] = useState(initialManagedConnectors);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [formStates, setFormStates] = useState<Record<string, ManagedConnectorFormState>>({});

  const sortedConnectors = useMemo(
    () =>
      [...managedConnectors].sort((left, right) =>
        left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug),
      ),
    [managedConnectors],
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
      return;
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
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
      {sortedConnectors.map((connector) => {
        const form = getFormState(connector);
        const isExpanded = expandedSlug === connector.slug;
        const provider = inferProvider(connector);
        const functionCount = connector.functions.length;

        return (
          <div key={connector.slug}>
            <button
              type="button"
              onClick={() => setExpandedSlug(isExpanded ? null : connector.slug)}
              aria-expanded={isExpanded}
              className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-left text-sm"
            >
              <span className="shrink-0 font-medium text-white">{connector.name}</span>
              <span className="shrink-0 text-[var(--color-text-muted)]">
                ({connector.slug})
              </span>
              <span className="shrink-0 text-[var(--color-text-base)]">—</span>
              <span className="shrink-0 text-[var(--color-text-base)]">{provider}</span>
              <span className="shrink-0 text-[var(--color-text-base)]">
                — {functionCount} function{functionCount === 1 ? "" : "s"}
              </span>
              {connector.oauthConfigured ? (
                <span className="shrink-0 text-[var(--color-accent)]">— OAuth ready</span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[var(--color-text-base)]">
                {connector.description}
              </span>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {isExpanded ? "Hide details" : "Show details"}
              </span>
            </button>

            {isExpanded ? (
              <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm leading-7 text-[var(--color-text-base)]">
                <div className="flex flex-wrap gap-2">
                  <Badge>{provider}</Badge>
                  <Badge>{connector.authStrategy}</Badge>
                  <Badge tone={connector.enabled ? "success" : "danger"}>
                    {connector.enabled ? "enabled" : "disabled"}
                  </Badge>
                  <Badge tone={connector.oauthConfigured ? "success" : "warning"}>
                    {connector.oauthConfigured ? "OAuth ready" : "OAuth credentials missing"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-base)]">
                  Edit stale provider URLs or OAuth settings here. Saving updates the existing service-level managed connector in place; deleting removes it until an admin registers it again.
                </p>
                <form
                  className="mt-4 grid gap-3 md:grid-cols-2"
                  onSubmit={(event) => void handleSubmit(event, connector)}
                >
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                    Provider type
                    <select
                      value={form.provider}
                      onChange={(event) =>
                        updateFormState(connector.slug, connector, {
                          provider: event.target.value as "mcp" | "http",
                        })
                      }
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="mcp">Remote MCP</option>
                      <option value="http">Managed HTTP / OpenAPI</option>
                    </select>
                  </label>
                  <div className="flex items-end text-[11px] leading-5 text-[var(--color-text-muted)]">
                    Updated {new Date(connector.updatedAt).toLocaleString()}
                  </div>

                  {form.provider === "mcp" ? (
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
                      MCP server URL
                      <input
                        type="url"
                        value={form.serverUrl}
                        onChange={(event) =>
                          updateFormState(connector.slug, connector, {
                            serverUrl: event.target.value,
                          })
                        }
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                      />
                    </label>
                  ) : (
                    <>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
                        API base URL
                        <input
                          type="url"
                          value={form.apiBaseUrl}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              apiBaseUrl: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
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
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
                        />
                        <span className="text-[11px] leading-5 text-[var(--color-text-muted)]">
                          Leave blank if you want to keep the current stored function templates instead of regenerating them from a schema.
                        </span>
                      </label>
                    </>
                  )}

                  {connector.authStrategy === "oauth2" ? (
                    <>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                        Authorization URL
                        <input
                          type="url"
                          value={form.authorizationUrl}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              authorizationUrl: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                        Token URL
                        <input
                          type="url"
                          value={form.tokenUrl}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              tokenUrl: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
                        Scopes (comma separated)
                        <input
                          type="text"
                          value={form.scopes}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              scopes: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                        Replace OAuth client ID (optional)
                        <input
                          type="text"
                          value={form.oauthClientId}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              oauthClientId: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                        Replace OAuth client secret (optional)
                        <input
                          type="password"
                          value={form.oauthClientSecret}
                          onChange={(event) =>
                            updateFormState(connector.slug, connector, {
                              oauthClientSecret: event.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                        />
                      </label>
                    </>
                  ) : null}

                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={form.submitting || form.deleting}>
                      {form.submitting ? "Saving…" : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={form.submitting || form.deleting}
                      onClick={() => void handleDelete(connector)}
                    >
                      {form.deleting ? "Deleting…" : "Delete connector"}
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
  );
}

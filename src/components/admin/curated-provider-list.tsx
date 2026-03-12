"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type {
  BuiltInConnectorOption,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

const availabilityTone = (availability: "oauth_ready" | "manual_token" | "planned") => {
  switch (availability) {
    case "oauth_ready":
      return "success" as const;
    case "planned":
      return "warning" as const;
    default:
      return "default" as const;
  }
};

const availabilityLabel = (availability: "oauth_ready" | "manual_token" | "planned") => {
  switch (availability) {
    case "oauth_ready":
      return "OAuth ready";
    case "manual_token":
      return "Manual token today";
    case "planned":
      return "Planned";
  }
};

interface RegistrationFormState {
  apiBaseUrl: string;
  serverUrl: string;
  openApiUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string;
  oauthClientId: string;
  oauthClientSecret: string;
  submitting: boolean;
  status: "idle" | "success" | "error";
  message: string;
}

const createRegistrationFormState = (
  provider: OAuthProviderCatalogOption,
): RegistrationFormState => {
  const defaults = provider.registrationDefaults;

  return {
    apiBaseUrl: defaults?.apiBaseUrl ?? "",
    serverUrl: defaults?.serverUrl ?? "",
    openApiUrl: defaults?.openApiUrl ?? "",
    authorizationUrl: defaults?.authorizationUrl ?? "",
    tokenUrl: defaults?.tokenUrl ?? "",
    scopes: defaults?.scopes?.join(", ") ?? "",
    oauthClientId: "",
    oauthClientSecret: "",
    submitting: false,
    status: "idle",
    message: "",
  };
};

const getManagedConnectorProvider = (provider: OAuthProviderCatalogOption) =>
  provider.registrationDefaults?.provider ??
  (provider.registrationDefaults?.serverUrl
    ? "mcp"
    : provider.registrationDefaults?.apiBaseUrl || provider.registrationDefaults?.openApiUrl
      ? "http"
      : "mcp");

const isHttpManagedConnector = (provider: OAuthProviderCatalogOption) =>
  getManagedConnectorProvider(provider) === "http";

const parseScopes = (value: string) =>
  value
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);

const buildDefaultHttpFunctions = (provider: OAuthProviderCatalogOption) => {
  const defaults = provider.registrationDefaults;
  if (
    !defaults ||
    defaults.openApiUrl ||
    !defaults.functionName ||
    !defaults.functionDescription ||
    !defaults.requestMethod ||
    !defaults.requestPath
  ) {
    return [];
  }

  return [
    {
      name: defaults.functionName,
      description: defaults.functionDescription,
      defaultScopes: defaults.scopes ?? [],
      request: {
        method: defaults.requestMethod,
        path: defaults.requestPath,
      },
    },
  ];
};

const hasFixedOAuthConfig = (provider: OAuthProviderCatalogOption) =>
  Boolean(
    provider.registrationDefaults?.authorizationUrl &&
      provider.registrationDefaults?.tokenUrl,
  );

const buildCallbackUrl = (callbackBaseUrl: string, slug: string) =>
  `${callbackBaseUrl || "https://<your-deployment>/api/oauth"}/${slug}/callback`;

const buildManagedConnectorPayload = (
  provider: OAuthProviderCatalogOption,
  form: RegistrationFormState,
) => {
  const managedConnectorProvider = getManagedConnectorProvider(provider);

  return {
    slug: provider.slug,
    name: provider.name,
    description: provider.description,
    appUrl: provider.appUrl,
    docsUrl: provider.docsUrl,
    categories: provider.categories,
    authModes: ["oauth2"],
    authStrategy: "oauth2" as const,
    provider: managedConnectorProvider,
    credentialLabel: `Connect ${provider.name}`,
    credentialPlaceholder: `Connect ${provider.name}`,
    credentialHelp: `OAuth connection for ${provider.name}.`,
    apiBaseUrl:
      managedConnectorProvider === "http"
        ? form.apiBaseUrl.trim() || provider.registrationDefaults?.apiBaseUrl || ""
        : undefined,
    serverUrl:
      managedConnectorProvider === "mcp"
        ? form.serverUrl.trim()
        : undefined,
    openApiUrl:
      managedConnectorProvider === "http"
        ? form.openApiUrl.trim() || provider.registrationDefaults?.openApiUrl || ""
        : undefined,
    oauthConfig: {
      authorizationUrl:
        form.authorizationUrl.trim() || provider.registrationDefaults?.authorizationUrl || "",
      tokenUrl: form.tokenUrl.trim() || provider.registrationDefaults?.tokenUrl || "",
      scopes:
        parseScopes(form.scopes).length > 0
          ? parseScopes(form.scopes)
          : provider.registrationDefaults?.scopes ?? [],
      scopeSeparator: provider.registrationDefaults?.scopeSeparator,
      clientAuthentication: provider.registrationDefaults?.clientAuthentication,
      additionalAuthorizationParams:
        provider.registrationDefaults?.additionalAuthorizationParams,
      pkce: provider.registrationDefaults?.pkce,
    },
    oauthClientId: form.oauthClientId.trim(),
    oauthClientSecret: form.oauthClientSecret.trim(),
    functions:
      managedConnectorProvider === "http" ? buildDefaultHttpFunctions(provider) : [],
    enabled: true,
  };
};

interface CuratedProviderListProps {
  providerCatalog: OAuthProviderCatalogOption[];
  readyBuiltInConnectors: BuiltInConnectorOption[];
  canRegisterManagedConnectors?: boolean;
  oauthCallbackBaseUrl?: string;
}

export function CuratedProviderList({
  providerCatalog,
  readyBuiltInConnectors,
  canRegisterManagedConnectors = false,
  oauthCallbackBaseUrl = "",
}: CuratedProviderListProps) {
  const [query, setQuery] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [registrationForms, setRegistrationForms] = useState<
    Record<string, RegistrationFormState>
  >({});
  const [readyConnectorSlugs, setReadyConnectorSlugs] = useState(
    () => new Set(readyBuiltInConnectors.map((connector) => connector.slug)),
  );

  useEffect(() => {
    setReadyConnectorSlugs(new Set(readyBuiltInConnectors.map((connector) => connector.slug)));
  }, [readyBuiltInConnectors]);

  const updateRegistrationForm = (
    provider: OAuthProviderCatalogOption,
    updates: Partial<RegistrationFormState>,
  ) => {
    setRegistrationForms((current) => ({
      ...current,
      [provider.slug]: {
        ...(current[provider.slug] ?? createRegistrationFormState(provider)),
        ...updates,
      },
    }));
  };

  const getRegistrationForm = (provider: OAuthProviderCatalogOption) =>
    registrationForms[provider.slug] ?? createRegistrationFormState(provider);

  const handleRegistrationSubmit = async (
    event: FormEvent<HTMLFormElement>,
    provider: OAuthProviderCatalogOption,
  ) => {
    event.preventDefault();

    const currentForm = getRegistrationForm(provider);
    const managedConnectorProvider = getManagedConnectorProvider(provider);
    const isHttpConnector = managedConnectorProvider === "http";

    if (
      isHttpConnector &&
      !(currentForm.apiBaseUrl.trim() || provider.registrationDefaults?.apiBaseUrl)
    ) {
      updateRegistrationForm(provider, {
        submitting: false,
        status: "error",
        message: "Enter the API base URL before registering this connector.",
      });
      return;
    }

    const oauthClientId = currentForm.oauthClientId.trim();
    const oauthClientSecret = currentForm.oauthClientSecret.trim();
    if (!oauthClientId || !oauthClientSecret) {
      updateRegistrationForm(provider, {
        submitting: false,
        status: "error",
        message:
          "Paste both the OAuth client ID and client secret before registering this connector. Until those are stored, it will not appear in the integrations wizard.",
      });
      return;
    }

    updateRegistrationForm(provider, {
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
        body: JSON.stringify(buildManagedConnectorPayload(provider, currentForm)),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            slug?: string;
            oauthConfigured?: boolean;
          }
        | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to register connector.");
      }

      const connectorSlug = provider.builtInSlug ?? provider.slug;
      if (body?.oauthConfigured !== false) {
        setReadyConnectorSlugs((current) => new Set([...current, connectorSlug]));
      }

      updateRegistrationForm(provider, {
        submitting: false,
        status: body?.oauthConfigured === false ? "error" : "success",
        message:
          body?.oauthConfigured === false
            ? "Connector saved, but it still needs OAuth client credentials before it can appear in the integrations wizard."
            : "Connector registered. It should now appear in the integrations wizard; if that wizard was already open, refresh or reopen it first.",
      });
    } catch (error) {
      updateRegistrationForm(provider, {
        submitting: false,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to register connector.",
      });
    }
  };

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return providerCatalog;
    }

    return providerCatalog.filter((provider) =>
      [
        provider.name,
        provider.slug,
        provider.description,
        provider.notes,
        ...provider.categories,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [providerCatalog, query]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex flex-1 flex-col gap-2 text-sm text-[var(--color-text-base)]">
          <span>Search curated adaptors</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by provider, category, or status"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
        <Badge>{filteredProviders.length} shown</Badge>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
          No curated adaptors matched your search.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] divide-y divide-[var(--color-border)]">
          {filteredProviders.map((provider) => {
            const connectorSlug = provider.builtInSlug ?? provider.slug;
            const isReadyNow = readyConnectorSlugs.has(connectorSlug);
            const isExpanded = expandedSlug === provider.slug;
            const registrationForm = getRegistrationForm(provider);
            const usesFixedOAuthDefaults = hasFixedOAuthConfig(provider);
            const isHttpConnector = isHttpManagedConnector(provider);
            const callbackUrl = buildCallbackUrl(oauthCallbackBaseUrl, provider.slug);

            return (
              <div key={provider.slug}>
                <button
                  type="button"
                  onClick={() => setExpandedSlug(isExpanded ? null : provider.slug)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-left text-sm"
                >
                  <span className="shrink-0 font-medium text-white">{provider.name}</span>
                  <span className="shrink-0 text-[var(--color-text-muted)]">({provider.slug})</span>
                  <span className="shrink-0 text-[var(--color-text-base)]">—</span>
                  <span className="shrink-0 text-[var(--color-text-base)]">
                    {availabilityLabel(provider.availability)}
                  </span>
                  {isReadyNow ? (
                    <span className="shrink-0 text-[var(--color-accent)]">— Ready now</span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-[var(--color-text-base)]">
                    {provider.description}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {isExpanded ? "Hide details" : "Show details"}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm leading-7 text-[var(--color-text-base)]">
                    {provider.notes ? <p>{provider.notes}</p> : null}
                    <div className={`${provider.notes ? "mt-3" : ""} flex flex-wrap gap-2`}>
                      {provider.categories.map((category) => (
                        <Badge key={`${provider.slug}-${category}`}>{category}</Badge>
                      ))}
                      <Badge tone={availabilityTone(provider.availability)}>
                        {availabilityLabel(provider.availability)}
                      </Badge>
                      {isReadyNow ? <Badge tone="success">Ready now</Badge> : null}
                    </div>
                    {isReadyNow ? (
                      <div className="mt-4 flex flex-wrap gap-3 text-xs">
                        <a
                          href={`/admin?section=integrations&showIntegrationWizard=1&builtIn=${connectorSlug}`}
                          className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                        >
                          Use {provider.name}
                        </a>
                      </div>
                    ) : null}

                    {isReadyNow ? (
                      <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-base)]">
                        This provider is already available in the integration wizard, so no additional registration is needed.{canRegisterManagedConnectors ? " Use the registered connector panel above if you need to edit or delete its stored service-level configuration." : ""}
                      </p>
                    ) : canRegisterManagedConnectors ? (
                      <form
                        className="mt-4 grid gap-3 md:grid-cols-2"
                        onSubmit={(event) => void handleRegistrationSubmit(event, provider)}
                      >
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                            Register this provider
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-text-base)]">
                            {isHttpConnector
                              ? `Enter the OAuth-backed REST API details below to register this connector once for the whole service. Individual users will later connect their own account and discover the generated function catalog from the official OpenAPI schema in the integrations wizard.`
                              : `Enter the OAuth-backed MCP details below to register this connector once for the whole service. Individual users will later connect their own account and discover the MCP's full tool list from the integrations wizard.`}
                          </p>
                        </div>
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
                          {isHttpConnector ? "API base URL" : "MCP server URL"}
                          <input
                            type="url"
                            value={isHttpConnector ? registrationForm.apiBaseUrl : registrationForm.serverUrl}
                            onChange={(event) =>
                              updateRegistrationForm(provider, {
                                ...(isHttpConnector
                                  ? { apiBaseUrl: event.target.value }
                                  : { serverUrl: event.target.value }),
                              })
                            }
                            placeholder={
                              isHttpConnector
                                ? provider.registrationDefaults?.apiBaseUrl ?? "https://api.example.com"
                                : provider.registrationDefaults?.serverUrl ?? "https://mcp.example.com"
                            }
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
                          />
                        </label>
                        {isHttpConnector && registrationForm.openApiUrl ? (
                          <div className="md:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-base)]">
                            <p>
                              OpenAPI schema source:
                              <code className="mx-1 text-white">{registrationForm.openApiUrl}</code>
                            </p>
                            <p className="mt-1">
                              This connector will fetch that schema server-side during registration and generate the HTTP function templates automatically.
                            </p>
                          </div>
                        ) : null}
                        {isHttpConnector &&
                        !registrationForm.openApiUrl &&
                        provider.registrationDefaults?.functionName &&
                        provider.registrationDefaults?.requestMethod &&
                        provider.registrationDefaults?.requestPath ? (
                          <div className="md:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-base)]">
                            <p>
                              Starter API function:
                              <code className="mx-1 text-white">
                                {provider.registrationDefaults.functionName}
                              </code>
                              will call
                              <code className="mx-1 text-white">
                                {provider.registrationDefaults.requestMethod} {provider.registrationDefaults.requestPath}
                              </code>
                              until you replace it with a richer generated catalog or additional custom function templates.
                            </p>
                          </div>
                        ) : null}
                        {!usesFixedOAuthDefaults ? (
                          <>
                            <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                              Authorization URL
                              <input
                                type="url"
                                value={registrationForm.authorizationUrl}
                                onChange={(event) =>
                                  updateRegistrationForm(provider, {
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
                                value={registrationForm.tokenUrl}
                                onChange={(event) =>
                                  updateRegistrationForm(provider, {
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
                                value={registrationForm.scopes}
                                onChange={(event) =>
                                  updateRegistrationForm(provider, {
                                    scopes: event.target.value,
                                  })
                                }
                                placeholder="repo, read:user"
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
                              />
                            </label>
                          </>
                        ) : null}
                        <div className="md:col-span-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-base)]">
                          <p>
                            Create a {provider.name} OAuth app before saving this connector so you can paste the client ID and client secret below. {usesFixedOAuthDefaults ? `The standard OAuth URLs and scopes for ${provider.name} are already filled in.` : ""}{isHttpConnector ? ` The API function catalog will be generated from the official OpenAPI schema shown above.` : ""}
                          </p>
                          <p className="mt-1">
                            Set the redirect URI to
                            <code className="mx-1 text-white">{callbackUrl}</code>
                            for this deployment.
                          </p>
                          {provider.docsUrl ? (
                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                            >
                              How to create {provider.name} OAuth credentials
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </div>
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                          OAuth client ID
                          <input
                            type="text"
                            value={registrationForm.oauthClientId}
                            onChange={(event) =>
                              updateRegistrationForm(provider, {
                                oauthClientId: event.target.value,
                              })
                            }
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)] md:col-span-2">
                          OAuth client secret
                          <input
                            type="password"
                            value={registrationForm.oauthClientSecret}
                            onChange={(event) =>
                              updateRegistrationForm(provider, {
                                oauthClientSecret: event.target.value,
                              })
                            }
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-accent)]"
                          />
                          <span className="text-[11px] leading-5 text-[var(--color-text-muted)]">
                            Required when this service is the OAuth client for the managed connector. The credentials are stored server-side so each user can use the Connect flow later without reconfiguring the connector, and the connector will stay hidden from the integrations wizard until they are saved.
                          </span>
                        </label>
                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          <Button type="submit" disabled={registrationForm.submitting}>
                            {registrationForm.submitting ? "Registering…" : "Register connector"}
                          </Button>
                          {registrationForm.message ? (
                            <p
                              className={
                                registrationForm.status === "error"
                                  ? "text-sm text-[var(--color-danger)]"
                                  : "text-sm text-[var(--color-text-base)]"
                              }
                            >
                              {registrationForm.message}
                            </p>
                          ) : null}
                        </div>
                      </form>
                    ) : (
                      <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-base)]">
                        Only app administrators listed in <code className="text-white">APP_ADMIN_EMAILS</code> can register providers from this page.
                      </p>
                    )}
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

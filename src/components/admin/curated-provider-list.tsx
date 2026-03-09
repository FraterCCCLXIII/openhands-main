"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
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

const buildManagedConnectorExample = (provider: OAuthProviderCatalogOption) => {
  const payload = {
    slug: provider.slug,
    name: provider.name,
    description: provider.description,
    appUrl: provider.appUrl ?? "https://app.example.com",
    docsUrl: provider.docsUrl ?? "https://docs.example.com/oauth",
    categories: provider.categories,
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    credentialLabel: `Connect ${provider.name}`,
    credentialPlaceholder: `Connect ${provider.name}`,
    credentialHelp: `OAuth connection for ${provider.name}.`,
    apiBaseUrl: "https://api.example.com",
    oauthConfig: {
      authorizationUrl: "<authorization-url>",
      tokenUrl: "<token-url>",
      scopes: ["<scope>"],
    },
    oauthClientId: "<client-id>",
    oauthClientSecret: "<client-secret>",
    functions: [
      {
        name: `${provider.slug}_action`,
        description: `Example ${provider.name} operation`,
        defaultScopes: ["<scope>"],
        request: {
          method: "GET",
          path: "/v1/example",
        },
      },
    ],
    enabled: true,
  };

  return [
    'curl -X POST "$BASE_URL/api/managed-connectors" \\',
    '  -H "Content-Type: application/json" \\',
    `  -d '${JSON.stringify(payload, null, 2)}'`,
  ].join("\n");
};

interface CuratedProviderListProps {
  providerCatalog: OAuthProviderCatalogOption[];
  readyBuiltInConnectors: BuiltInConnectorOption[];
}

export function CuratedProviderList({
  providerCatalog,
  readyBuiltInConnectors,
}: CuratedProviderListProps) {
  const [query, setQuery] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

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

      <div className="flex flex-col gap-3">
        {filteredProviders.map((provider) => {
          const builtInMatch = provider.builtInSlug
            ? readyBuiltInConnectors.find(
                (connector) => connector.slug === provider.builtInSlug,
              )
            : null;
          const isExpanded = expandedSlug === provider.slug;

          return (
            <div
              key={provider.slug}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]"
            >
              <button
                type="button"
                onClick={() => setExpandedSlug(isExpanded ? null : provider.slug)}
                aria-expanded={isExpanded}
                className="flex w-full flex-col gap-3 p-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{provider.name}</p>
                  <Badge>{provider.slug}</Badge>
                  <Badge tone={availabilityTone(provider.availability)}>
                    {availabilityLabel(provider.availability)}
                  </Badge>
                  {builtInMatch ? <Badge tone="success">Ready now</Badge> : null}
                </div>
                <p className="text-sm leading-6 text-[var(--color-text-base)]">
                  {provider.description}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isExpanded ? "Hide details" : "Show details and example API call"}
                </p>
              </button>

              {isExpanded ? (
                <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm leading-7 text-[var(--color-text-base)]">
                  <p>{provider.notes}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.categories.map((category) => (
                      <Badge key={`${provider.slug}-${category}`}>{category}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {builtInMatch ? (
                      <a
                        href={`/admin?section=integrations&showIntegrationWizard=1&builtIn=${builtInMatch.slug}`}
                        className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Use {builtInMatch.name}
                      </a>
                    ) : null}
                    {provider.docsUrl ? (
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        OAuth docs
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Example API call
                    </p>
                    <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs leading-6 text-white">
                      <code>{buildManagedConnectorExample(provider)}</code>
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredProviders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-base)]">
            No curated adaptors matched your search.
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
import { ManagedConnectorAdminList } from "@/src/components/admin/managed-connector-admin-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type {
  BuiltInConnectorOption,
  ManagedConnectorDefinition,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

interface AdminIntegrationsCatalogProps {
  providerCatalog: OAuthProviderCatalogOption[];
  initialReadyBuiltInConnectors: BuiltInConnectorOption[];
  managedConnectors: ManagedConnectorDefinition[];
  canRegisterManagedConnectors: boolean;
  oauthCallbackBaseUrl: string;
}

const sortReadyBuiltInConnectors = (connectors: BuiltInConnectorOption[]) =>
  [...connectors].sort(
    (left, right) => left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug),
  );

const toReadyBuiltInConnector = (
  connector: ManagedConnectorDefinition,
): BuiltInConnectorOption => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
  appUrl: connector.appUrl,
  toolCount: connector.functions.length,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  oauthConfigured: connector.oauthConfigured,
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
});

const toDefaultReadyBuiltInConnector = (
  provider: OAuthProviderCatalogOption,
): BuiltInConnectorOption | null => {
  const defaults = provider.registrationDefaults;
  const authStrategy = defaults?.authStrategy ?? provider.authStrategy;

  if (!defaults?.authStrategy || defaults.authStrategy === "oauth2") {
    return null;
  }

  const isReadyDefault =
    (defaults.provider === "http" && defaults.apiBaseUrl && defaults.openApiUrl) ||
    (defaults.provider === "mcp" && defaults.serverUrl);
  if (!isReadyDefault) {
    return null;
  }

  return {
    slug: provider.builtInSlug ?? provider.slug,
    name: provider.name,
    description: provider.description,
    appUrl: provider.appUrl,
    toolCount: defaults.provider === "http" ? 0 : 0,
    categories: provider.categories,
    authModes:
      defaults.authModes?.length && defaults.authModes.every(Boolean)
        ? defaults.authModes
        : [authStrategy],
    authStrategy,
    oauthConfigured: true,
    credentialLabel: defaults.credentialLabel ?? `${provider.name} credential`,
    credentialPlaceholder:
      defaults.credentialPlaceholder ?? `Paste your ${provider.name} credential`,
    credentialHelp: defaults.credentialHelp ?? `Credential required by ${provider.name}.`,
    apiKeyHeaderName: defaults.apiKeyHeaderName,
  };
};

const upsertReadyBuiltInConnector = (
  connectors: BuiltInConnectorOption[],
  connector: BuiltInConnectorOption,
) =>
  sortReadyBuiltInConnectors([
    ...connectors.filter((candidate) => candidate.slug !== connector.slug),
    connector,
  ]);

export function AdminIntegrationsCatalog({
  providerCatalog,
  initialReadyBuiltInConnectors,
  managedConnectors,
  canRegisterManagedConnectors,
  oauthCallbackBaseUrl,
}: AdminIntegrationsCatalogProps) {
  const [readyBuiltInConnectors, setReadyBuiltInConnectors] = useState(() =>
    sortReadyBuiltInConnectors(initialReadyBuiltInConnectors),
  );

  const defaultReadyBuiltInConnectors = useMemo(
    () =>
      new Map(
        providerCatalog
          .map((provider) => [provider.builtInSlug ?? provider.slug, toDefaultReadyBuiltInConnector(provider)] as const)
          .filter((entry): entry is [string, BuiltInConnectorOption] => entry[1] != null),
      ),
    [providerCatalog],
  );

  const resetReadyBuiltInConnector = (slug: string) => {
    setReadyBuiltInConnectors((current) => {
      const next = current.filter((connector) => connector.slug !== slug);
      const fallback = defaultReadyBuiltInConnectors.get(slug);
      return fallback ? upsertReadyBuiltInConnector(next, fallback) : next;
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {readyBuiltInConnectors.map((connector) => (
          <Badge key={connector.slug}>{connector.name}</Badge>
        ))}
      </div>

      {canRegisterManagedConnectors ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Registered managed connectors</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
                Edit stale service-level connector settings in place or delete a connector before re-registering it with a new provider type.
              </p>
            </div>
            <Badge>{managedConnectors.length} registered</Badge>
          </div>

          <ManagedConnectorAdminList
            initialManagedConnectors={managedConnectors}
            onConnectorUpdated={(connector) => {
              if (connector.enabled && connector.oauthConfigured !== false) {
                setReadyBuiltInConnectors((current) =>
                  upsertReadyBuiltInConnector(current, toReadyBuiltInConnector(connector)),
                );
                return;
              }

              resetReadyBuiltInConnector(connector.slug);
            }}
            onConnectorDeleted={(connector) => {
              resetReadyBuiltInConnector(connector.slug);
            }}
          />
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Popular official provider options</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
              Researched catalog of 50 popular providers with official API or MCP entry points. Register one of these providers to make it show up in the integrations wizard.
            </p>
          </div>
          <Badge>{providerCatalog.length} options</Badge>
        </div>

        <CuratedProviderList
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors={canRegisterManagedConnectors}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          onConnectorRegistered={(connector) => {
            setReadyBuiltInConnectors((current) =>
              upsertReadyBuiltInConnector(current, connector),
            );
          }}
        />
      </Card>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";

import { ProviderCatalog } from "@/src/components/admin/integrations/provider-catalog";
import { ManagedConnectorList } from "@/src/components/admin/integrations/managed-connector-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type {
  ManagedConnectorOption,
  ManagedConnectorDefinition,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

interface IntegrationsCatalogProps {
  providerCatalog: OAuthProviderCatalogOption[];
  initialReadyManagedConnectors: ManagedConnectorOption[];
  managedConnectors: ManagedConnectorDefinition[];
  canRegisterManagedConnectors: boolean;
  oauthCallbackBaseUrl: string;
}

export const sortReadyManagedConnectors = (connectors: ManagedConnectorOption[]) =>
  [...connectors].sort(
    (left, right) => left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug),
  );

export const toReadyManagedConnector = (
  connector: ManagedConnectorDefinition,
): ManagedConnectorOption => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
  appUrl: connector.appUrl,
  toolCount: connector.tools.length,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  oauthConfigured: connector.oauthConfigured,
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
});

export const toDefaultReadyManagedConnector = (
  provider: OAuthProviderCatalogOption,
): ManagedConnectorOption | null => {
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
    slug: provider.managedConnectorSlug ?? provider.slug,
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

export const upsertReadyManagedConnector = (
  connectors: ManagedConnectorOption[],
  connector: ManagedConnectorOption,
) =>
  sortReadyManagedConnectors([
    ...connectors.filter((candidate) => candidate.slug !== connector.slug),
    connector,
  ]);

export function IntegrationsCatalog({
  providerCatalog,
  initialReadyManagedConnectors,
  managedConnectors,
  canRegisterManagedConnectors,
  oauthCallbackBaseUrl,
}: IntegrationsCatalogProps) {
  const [readyManagedConnectors, setReadyManagedConnectors] = useState(() =>
    sortReadyManagedConnectors(initialReadyManagedConnectors),
  );

  const defaultReadyManagedConnectors = useMemo(
    () =>
      new Map(
        providerCatalog
          .map((provider) => [provider.managedConnectorSlug ?? provider.slug, toDefaultReadyManagedConnector(provider)] as const)
          .filter((entry): entry is [string, ManagedConnectorOption] => entry[1] != null),
      ),
    [providerCatalog],
  );

  const resetReadyManagedConnector = (slug: string) => {
    setReadyManagedConnectors((current) => {
      const next = current.filter((connector) => connector.slug !== slug);
      const fallback = defaultReadyManagedConnectors.get(slug);
      return fallback ? upsertReadyManagedConnector(next, fallback) : next;
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {readyManagedConnectors.map((connector) => (
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

          <ManagedConnectorList
            initialManagedConnectors={managedConnectors}
            onConnectorUpdated={(connector) => {
              if (connector.enabled && connector.oauthConfigured !== false) {
                setReadyManagedConnectors((current) =>
                  upsertReadyManagedConnector(current, toReadyManagedConnector(connector)),
                );
                return;
              }

              resetReadyManagedConnector(connector.slug);
            }}
            onConnectorDeleted={(connector) => {
              resetReadyManagedConnector(connector.slug);
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

        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyManagedConnectors={readyManagedConnectors}
          canRegisterManagedConnectors={canRegisterManagedConnectors}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          onConnectorRegistered={(connector) => {
            setReadyManagedConnectors((current) =>
              upsertReadyManagedConnector(current, connector),
            );
          }}
        />
      </Card>
    </>
  );
}

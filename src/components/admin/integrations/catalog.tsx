"use client";

import { useState } from "react";

import { IntegrationCatalogPanel } from "@/src/components/admin/integrations/integration-catalog-panel";
import { ManagedConnectorList } from "@/src/components/admin/integrations/managed-connector-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type {
  ManagedConnectorOption,
  ManagedConnectorDefinition,
  IntegrationCatalogOption,
} from "@/src/types/integrations-hub";

interface IntegrationsCatalogProps {
  integrationCatalog: IntegrationCatalogOption[];
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
  iconBg: connector.iconBg,
  iconColor: connector.iconColor,
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

export const upsertReadyManagedConnector = (
  connectors: ManagedConnectorOption[],
  connector: ManagedConnectorOption,
) =>
  sortReadyManagedConnectors([
    ...connectors.filter((candidate) => candidate.slug !== connector.slug),
    connector,
  ]);

export function IntegrationsCatalog({
  integrationCatalog,
  initialReadyManagedConnectors,
  managedConnectors,
  canRegisterManagedConnectors,
  oauthCallbackBaseUrl,
}: IntegrationsCatalogProps) {
  const [readyManagedConnectors, setReadyManagedConnectors] = useState(() =>
    sortReadyManagedConnectors(initialReadyManagedConnectors),
  );

  // Single shared search for the unified admin list. Registered connectors
  // and catalog providers both filter against this query so the screen shows
  // one list, not two.
  const [sharedQuery, setSharedQuery] = useState("");

  const resetReadyManagedConnector = (slug: string) => {
    setReadyManagedConnectors((current) =>
      current.filter((connector) => connector.slug !== slug),
    );
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {readyManagedConnectors.map((connector) => (
          <Badge key={connector.slug}>{connector.name}</Badge>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Integrations</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
              Register an official provider to make it available in the integrations wizard, or manage connectors you have already registered.
            </p>
          </div>
          <Badge>{integrationCatalog.length} options</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-1 flex-col gap-2 text-sm text-[var(--color-text-base)]">
            <span>Search integrations</span>
            <input
              type="search"
              value={sharedQuery}
              onChange={(event) => setSharedQuery(event.target.value)}
              placeholder="Search by provider, category, or status"
              aria-label="Search integrations"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        {canRegisterManagedConnectors ? (
          <ManagedConnectorList
            initialManagedConnectors={managedConnectors}
            hideChrome
            search={sharedQuery}
            onSearchChange={setSharedQuery}
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
        ) : null}

        <IntegrationCatalogPanel
          integrationCatalog={integrationCatalog}
          readyManagedConnectors={readyManagedConnectors}
          canRegisterManagedConnectors={canRegisterManagedConnectors}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          hideChrome
          query={sharedQuery}
          onQueryChange={setSharedQuery}
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

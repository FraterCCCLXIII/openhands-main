"use client";

import { useState } from "react";

import { UnifiedConnectorList } from "@/src/components/admin/integrations/unified-connector-list";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type {
  IntegrationConnectionStatus,
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
  connections?: IntegrationConnectionStatus[];
  onConnectionsStale?: () => void;
  initialExpandedSlug?: string | null;
  onManagedConnectorsStale?: () => void;
}

export function IntegrationsCatalog({
  integrationCatalog,
  managedConnectors,
  canRegisterManagedConnectors,
  oauthCallbackBaseUrl,
  connections = [],
  onConnectionsStale,
  initialExpandedSlug = null,
  onManagedConnectorsStale,
}: IntegrationsCatalogProps) {
  const [sharedQuery, setSharedQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin-integrations-search") ?? "";
    }
    return "";
  });

  const handleSearchChange = (value: string) => {
    setSharedQuery(value);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("admin-integrations-search", value);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Integrations</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--color-text-base)]">
            Register a provider to make it available in the integrations wizard, then connect your account and index tools. Manage connectors you have already registered below.
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
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by provider, category, or status"
            aria-label="Search integrations"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="mt-4">
        <UnifiedConnectorList
          integrationCatalog={integrationCatalog}
          managedConnectors={managedConnectors}
          connections={connections}
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
          canRegisterManagedConnectors={canRegisterManagedConnectors}
          initialExpandedSlug={initialExpandedSlug}
          search={sharedQuery}
          onConnectionsStale={onConnectionsStale}
          onManagedConnectorsStale={onManagedConnectorsStale}
        />
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";

import { UnifiedConnectorList } from "@/src/components/admin/integrations/unified-connector-list";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
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
    <div className="min-w-0">
      <div className="flex items-stretch gap-2">
        <IntegrationsSearchInput
          value={sharedQuery}
          onChange={handleSearchChange}
          placeholder={ADMIN_INTEGRATIONS_PAGE_COPY.searchPlaceholder}
          ariaLabel="Search integrations"
          className="min-w-0 flex-1"
        />
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
    </div>
  );
}

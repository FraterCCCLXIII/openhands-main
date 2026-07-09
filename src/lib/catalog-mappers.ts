import type {
  AuthStrategy,
  IntegrationCatalogOption,
  ManagedConnectorOption,
} from "@/src/types/integrations-hub";

/** Loose input type that accepts both IntegrationCatalogOption (with
 *  connectionDefaults) and flat ManagedConnectorOption-shaped objects. This
 *  lets the mapper work with real API responses and test mocks alike. */
type CatalogOrConnectorEntry = IntegrationCatalogOption & {
  // Flat fallbacks present on ManagedConnectorOption but not on
  // IntegrationCatalogOption. All optional so either shape satisfies the type.
  toolCount?: number;
  authStrategy?: AuthStrategy;
  authModes?: AuthStrategy[];
  oauthConfigured?: boolean;
  credentialLabel?: string;
  credentialPlaceholder?: string;
  credentialHelp?: string;
  apiKeyHeaderName?: string;
};

/** Convert an IntegrationCatalogOption (the unified /api/integrations response
 *  shape) into a ManagedConnectorOption (the lightweight shape used by the
 *  dashboard and wizard). The catalog's connectionDefaults field carries all
 *  the managed-connector data when the connector is registered or a default;
 *  for catalog-only entries it carries the raw catalog defaults.
 *
 *  Also tolerates entries that are already in ManagedConnectorOption shape
 *  (flat fields, no connectionDefaults) so test mocks and legacy callers can
 *  pass either format. */
export const catalogOptionToConnectorOption = (
  entry: CatalogOrConnectorEntry,
): ManagedConnectorOption => {
  const cd = entry.connectionDefaults;
  const authStrategy = (cd?.authStrategy ?? entry.authStrategy ?? "oauth2") as AuthStrategy;
  return {
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    logoUrl: entry.logoUrl,
    iconBg: entry.iconBg,
    iconColor: entry.iconColor,
    appUrl: entry.appUrl,
    toolCount: Array.isArray((cd as Record<string, unknown> | undefined)?.tools)
      ? ((cd as Record<string, unknown>).tools as unknown[]).length
      : (entry.toolCount ?? 0),
    categories: entry.categories,
    authModes: cd?.authModes?.length ? cd.authModes : (entry.authModes ?? [authStrategy]),
    authStrategy,
    oauthConfigured: cd?.oauthConfigured ?? entry.oauthConfigured,
    credentialLabel: cd?.credentialLabel ?? entry.credentialLabel ?? `Connect ${entry.name}`,
    credentialPlaceholder:
      cd?.credentialPlaceholder ?? entry.credentialPlaceholder ?? `Connect ${entry.name}`,
    credentialHelp: cd?.credentialHelp ?? entry.credentialHelp ?? `OAuth connection for ${entry.name}.`,
    apiKeyHeaderName: cd?.apiKeyHeaderName ?? entry.apiKeyHeaderName,
  };
};

export const catalogOptionsToConnectorOptions = (
  entries: CatalogOrConnectorEntry[],
): ManagedConnectorOption[] => entries.map(catalogOptionToConnectorOption);

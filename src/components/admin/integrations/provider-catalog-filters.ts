import {
  ADMIN_INTEGRATIONS_PAGE_COPY,
  CATALOG_AUTH_STATUS_LABELS,
} from "@/src/constants/admin-integrations-page";
import type { AdminCatalogFilter } from "@/src/types/admin-catalog";
import type { OAuthProviderCatalogOption } from "@/src/types/integrations-hub";

import { availabilityLabel } from "@/src/components/admin/integrations/provider-catalog";

function filterCatalogByStatus(
  providers: OAuthProviderCatalogOption[],
  filter: AdminCatalogFilter,
  readyConnectorSlugs: ReadonlySet<string>,
): OAuthProviderCatalogOption[] {
  switch (filter) {
    case "ready_now":
      return providers.filter((provider) =>
        readyConnectorSlugs.has(provider.managedConnectorSlug ?? provider.slug),
      );
    case "oauth_ready":
      return providers.filter((provider) => provider.availability === "oauth_ready");
    case "manual_token":
      return providers.filter((provider) => provider.availability === "manual_token");
    case "planned":
      return providers.filter((provider) => provider.availability === "planned");
    default:
      return providers;
  }
}

export function filterProviderCatalog(
  providers: OAuthProviderCatalogOption[],
  query: string,
  filter: AdminCatalogFilter,
  readyConnectorSlugs: ReadonlySet<string>,
): OAuthProviderCatalogOption[] {
  const byStatus = filterCatalogByStatus(providers, filter, readyConnectorSlugs);
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return byStatus;
  }

  return byStatus.filter((provider) => {
    const authLabel = availabilityLabel(provider.availability).toLowerCase();
    const isReadyNow = readyConnectorSlugs.has(
      provider.managedConnectorSlug ?? provider.slug,
    );

    return (
      provider.name.toLowerCase().includes(normalized) ||
      provider.slug.toLowerCase().includes(normalized) ||
      provider.description.toLowerCase().includes(normalized) ||
      provider.categories.some((category) => category.toLowerCase().includes(normalized)) ||
      authLabel.includes(normalized) ||
      (isReadyNow &&
        ADMIN_INTEGRATIONS_PAGE_COPY.readyNowLabel.toLowerCase().includes(normalized)) ||
      Object.values(CATALOG_AUTH_STATUS_LABELS).some((label) =>
        label.toLowerCase().includes(normalized),
      )
    );
  });
}

import type { OAuthProviderCatalogOption } from "@/src/types/integrations-hub";

export function resolveProviderCatalogLogoSlug(
  provider: OAuthProviderCatalogOption,
): string {
  return provider.managedConnectorSlug ?? provider.slug;
}

import { getConnectorLogoUrl } from "@/src/components/dashboard/shared";
import {
  hasBundledIntegrationLogo,
  INTEGRATION_FALLBACK_LOGO,
  getIntegrationLogo,
} from "@/src/components/integrations/integration-logos";
import { OAUTH_PROVIDER_FAVICON_SLUGS } from "@/src/components/integrations/oauth-provider-logos";
import type { OAuthProviderCatalogOption } from "@/src/types/integrations-hub";

export function resolveProviderCatalogLogoSlug(
  provider: OAuthProviderCatalogOption,
): string {
  return provider.managedConnectorSlug ?? provider.slug;
}

export function resolveProviderCatalogLogoUrl(
  provider: OAuthProviderCatalogOption,
): string | undefined {
  const slug = resolveProviderCatalogLogoSlug(provider);

  if (hasBundledIntegrationLogo(slug)) {
    return undefined;
  }

  if (!OAUTH_PROVIDER_FAVICON_SLUGS.has(slug)) {
    return undefined;
  }

  return getConnectorLogoUrl({ appUrl: provider.appUrl }) ?? undefined;
}

export function hasProviderCatalogLogo(provider: OAuthProviderCatalogOption): boolean {
  const slug = resolveProviderCatalogLogoSlug(provider);

  if (hasBundledIntegrationLogo(slug)) {
    return true;
  }

  if (OAUTH_PROVIDER_FAVICON_SLUGS.has(slug)) {
    return Boolean(getConnectorLogoUrl({ appUrl: provider.appUrl }));
  }

  return false;
}

export function getProviderCatalogLogo(provider: OAuthProviderCatalogOption) {
  const slug = resolveProviderCatalogLogoSlug(provider);
  const logo = getIntegrationLogo(slug);
  return logo === INTEGRATION_FALLBACK_LOGO ? null : logo;
}

// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  getIntegrationLogo,
  hasBundledIntegrationLogo,
  INTEGRATION_FALLBACK_LOGO,
} from "@/src/components/integrations/integration-logos";
import { OAUTH_PROVIDER_FAVICON_SLUGS } from "@/src/components/integrations/oauth-provider-logos";
import {
  hasProviderCatalogLogo,
  resolveProviderCatalogLogoSlug,
} from "@/src/components/integrations/resolve-provider-catalog-logo";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

describe("oauth provider catalog logos", () => {
  it("maps every catalog slug to a bundled SVG or favicon fallback", () => {
    const providers = listOAuthProviderCatalog();

    expect(providers).toHaveLength(52);

    for (const provider of providers) {
      const slug = resolveProviderCatalogLogoSlug(provider);

      if (OAUTH_PROVIDER_FAVICON_SLUGS.has(slug)) {
        expect(hasProviderCatalogLogo(provider)).toBe(true);
        continue;
      }

      expect(hasBundledIntegrationLogo(slug)).toBe(true);
      expect(getIntegrationLogo(slug)).not.toBe(INTEGRATION_FALLBACK_LOGO);
    }
  });

  it("includes brand SVGs for common admin catalog providers", () => {
    expect(hasBundledIntegrationLogo("github")).toBe(true);
    expect(hasBundledIntegrationLogo("google-docs")).toBe(true);
    expect(hasBundledIntegrationLogo("microsoft-teams")).toBe(true);
    expect(hasBundledIntegrationLogo("hubspot")).toBe(true);
    expect(hasBundledIntegrationLogo("gitlab")).toBe(true);
  });
});

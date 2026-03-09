import { describe, expect, it } from "vitest";

import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

describe("listOAuthProviderCatalog", () => {
  it("returns at least 50 OAuth-capable provider options", () => {
    const providers = listOAuthProviderCatalog();

    expect(providers).toHaveLength(50);
    expect(new Set(providers.map((provider) => provider.slug)).size).toBe(50);
    expect(providers.every((provider) => provider.authStrategy === "oauth2")).toBe(true);
    expect(providers.every((provider) => provider.popularityRank >= 1)).toBe(true);
  });

  it("keeps currently supported curated built-ins marked as available or manual-token", () => {
    const providers = listOAuthProviderCatalog();
    const notion = providers.find((provider) => provider.slug === "notion");
    const figma = providers.find((provider) => provider.slug === "figma");
    const github = providers.find((provider) => provider.slug === "github");

    expect(notion).toMatchObject({ availability: "oauth_ready", builtInSlug: "notion" });
    expect(figma).toMatchObject({ availability: "oauth_ready", builtInSlug: "figma" });
    expect(github).toMatchObject({ availability: "manual_token", builtInSlug: "github" });
  });
});

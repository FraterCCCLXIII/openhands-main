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

  it("includes registration defaults for researched providers", () => {
    const providers = listOAuthProviderCatalog();
    const notion = providers.find((provider) => provider.slug === "notion");
    const googleCalendar = providers.find((provider) => provider.slug === "google-calendar");

    expect(notion?.registrationDefaults).toMatchObject({
      apiBaseUrl: "https://api.notion.com",
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      functionName: "search_workspace",
      requestMethod: "POST",
      requestPath: "/v1/search",
    });
    expect(googleCalendar?.registrationDefaults).toMatchObject({
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
  });
});

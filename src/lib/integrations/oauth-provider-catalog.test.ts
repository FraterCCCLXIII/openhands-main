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

  it("keeps common provider slugs mapped to the expected managed-connector defaults", () => {
    const providers = listOAuthProviderCatalog();
    const notion = providers.find((provider) => provider.slug === "notion");
    const figma = providers.find((provider) => provider.slug === "figma");
    const slack = providers.find((provider) => provider.slug === "slack");
    const github = providers.find((provider) => provider.slug === "github");

    expect(notion).toMatchObject({ availability: "oauth_ready", builtInSlug: "notion" });
    expect(figma).toMatchObject({ availability: "oauth_ready", builtInSlug: "figma" });
    expect(slack).toMatchObject({ availability: "oauth_ready", builtInSlug: "slack" });
    expect(github).toMatchObject({ availability: "manual_token", builtInSlug: "github" });
  });

  it("provides concrete managed-connector defaults for every catalog provider", () => {
    const providers = listOAuthProviderCatalog();

    expect(
      providers.every(
        (provider) =>
          Boolean(
            provider.registrationDefaults?.serverUrl ||
              provider.registrationDefaults?.apiBaseUrl,
          ),
      ),
    ).toBe(true);
    expect(
      providers.every(
        (provider) =>
          !provider.registrationDefaults?.serverUrl?.includes("example.com") &&
          !provider.registrationDefaults?.serverUrl?.includes("mcp.composio.dev") &&
          !provider.registrationDefaults?.apiBaseUrl?.includes("example.com"),
      ),
    ).toBe(true);
  });

  it("includes registration defaults for researched providers", () => {
    const providers = listOAuthProviderCatalog();
    const notion = providers.find((provider) => provider.slug === "notion");
    const googleCalendar = providers.find((provider) => provider.slug === "google-calendar");
    const slack = providers.find((provider) => provider.slug === "slack");
    const github = providers.find((provider) => provider.slug === "github");

    expect(github?.registrationDefaults).toMatchObject({
      serverUrl: "https://api.githubcopilot.com/mcp/",
    });
    expect(slack?.registrationDefaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.slack.com/mcp",
      authorizationUrl: "https://slack.com/oauth/v2_user/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.user.access",
      clientAuthentication: "body",
      pkce: true,
    });
    expect(notion?.registrationDefaults).toMatchObject({
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      functionName: "post_search",
      requestMethod: "POST",
      requestPath: "/v1/search",
    });
    expect(googleCalendar?.registrationDefaults).toMatchObject({
      provider: "http",
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      functionName: "list_events",
      requestMethod: "GET",
      requestPath: "/calendars/primary/events",
    });
    expect(googleCalendar?.registrationDefaults?.serverUrl).toBeUndefined();
  });
});

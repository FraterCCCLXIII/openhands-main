import { describe, expect, it } from "vitest";

import { listIntegrationCatalogOptions } from "@/src/lib/integrations/integration-catalog";

describe("listIntegrationCatalogOptions", () => {
  it("returns the curated provider catalog with unique slugs and auth strategies", () => {
    const providers = listIntegrationCatalogOptions();

    expect(providers.length).toBeGreaterThan(0);
    expect(new Set(providers.map((provider) => provider.slug)).size).toBe(
      providers.length,
    );
    expect(
      providers.some(
        (provider) => provider.connectionDefaults.authStrategy === "api_key",
      ),
    ).toBe(true);
    expect(
      providers.some(
        (provider) => provider.connectionDefaults.authStrategy === "oauth2",
      ),
    ).toBe(true);
  });

  it("provides concrete managed-connector defaults for every catalog provider", () => {
    const providers = listIntegrationCatalogOptions();

    expect(
      providers.every(
        (provider) =>
          provider.connectionDefaults?.provider === "mcp" ||
          provider.connectionDefaults?.provider === "http",
      ),
    ).toBe(true);
    expect(
      providers.every(
        (provider) =>
          !provider.connectionDefaults?.serverUrl?.includes("example.com") &&
          !provider.connectionDefaults?.serverUrl?.includes(
            "mcp.composio.dev",
          ) &&
          !provider.connectionDefaults?.apiBaseUrl?.includes("example.com"),
      ),
    ).toBe(true);
  });

  it("includes registration defaults for researched providers", () => {
    const providers = listIntegrationCatalogOptions();
    const notion = providers.find((provider) => provider.slug === "notion");
    const googleCalendar = providers.find(
      (provider) => provider.slug === "google-calendar",
    );
    const slack = providers.find((provider) => provider.slug === "slack");
    const webflow = providers.find((provider) => provider.slug === "webflow");
    const hubspot = providers.find((provider) => provider.slug === "hubspot");
    const github = providers.find((provider) => provider.slug === "github");
    const datadog = providers.find((provider) => provider.slug === "datadog");
    const elevenlabs = providers.find(
      (provider) => provider.slug === "elevenlabs",
    );

    expect(github?.connectionDefaults).toMatchObject({
      serverUrl: "https://api.githubcopilot.com/mcp/",
    });
    expect(slack?.connectionDefaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.slack.com/mcp",
      authorizationUrl: "https://slack.com/oauth/v2_user/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.user.access",
      clientAuthentication: "body",
      pkce: true,
    });
    expect(webflow).toMatchObject({
      docsUrl: "https://developers.webflow.com/mcp/reference/getting-started",
    });
    expect(webflow?.connectionDefaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.webflow.com/mcp",
      authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
      tokenUrl: "https://mcp.webflow.com/oauth/token",
      registrationUrl: "https://mcp.webflow.com/oauth/register",
      clientAuthentication: "none",
      pkce: true,
      scopes: [],
    });
    expect(datadog).toMatchObject({
      docsUrl: "https://docs.datadoghq.com/bits_ai/mcp_server/setup/",
    });
    expect(datadog?.connectionDefaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.datadoghq.com/api/unstable/mcp-server/mcp",
      authorizationUrl: "https://app.datadoghq.com/oauth2/v1/authorize",
      tokenUrl: "https://api.datadoghq.com/oauth2/v1/token",
      scopes: ["dashboards_read", "monitors_read"],
    });
    expect(hubspot).toMatchObject({
      docsUrl:
        "https://developers.hubspot.com/docs/apps/developer-platform/build-apps/integrate-with-the-remote-hubspot-mcp-server",
    });
    expect(hubspot?.connectionDefaults).toMatchObject({
      provider: "mcp",
      serverUrl: "https://mcp.hubspot.com",
      authorizationUrl: "https://mcp.hubspot.com/oauth/authorize/user",
      tokenUrl: "https://mcp.hubspot.com/oauth/v3/token",
      clientAuthentication: "body",
      pkce: true,
      scopes: [],
      credentialHelp: expect.stringContaining("HubSpot MCP auth app"),
    });
    // In 0.7.0 the catalog is MCP-first: notion's first option is a stdio MCP
    // server, so its connectionDefaults reflect the MCP option (no HTTP/openApi
    // defaults). The notion HTTP/oauth option is still present as the second
    // connection option.
    expect(notion?.connectionDefaults).toMatchObject({
      provider: "mcp",
    });
    expect(googleCalendar?.connectionDefaults).toMatchObject({
      provider: "http",
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    // The catalog's defaultTool field is no longer mapped into connectionDefaults;
    // tools are generated from the OpenAPI URL server-side, never hardcoded.
    expect("toolName" in (googleCalendar?.connectionDefaults ?? {})).toBe(false);
    expect("requestMethod" in (googleCalendar?.connectionDefaults ?? {})).toBe(false);
    expect(elevenlabs).toMatchObject({});
    expect(elevenlabs?.connectionDefaults).toMatchObject({
      provider: "http",
      authModes: ["api_key"],
      authStrategy: "api_key",
      apiKeyHeaderName: "xi-api-key",
      apiBaseUrl: "https://api.elevenlabs.io",
      openApiUrl: "https://api.elevenlabs.io/openapi.json",
      credentialLabel: "ElevenLabs API key",
    });
    expect(googleCalendar?.connectionDefaults?.serverUrl).toBeUndefined();

    const ordinal = providers.find((provider) => provider.slug === "ordinal");
    expect(ordinal).toMatchObject({});
    expect(ordinal?.connectionDefaults).toMatchObject({
      provider: "mcp",
      authModes: ["bearer"],
      authStrategy: "bearer",
      serverUrl: "https://app.tryordinal.com/api/mcp",
      credentialLabel: "Ordinal API key",
    });
  });
});

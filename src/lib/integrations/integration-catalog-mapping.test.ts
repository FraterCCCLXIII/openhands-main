/**
 * Unit tests for integration-catalog.ts connection-defaults derivation logic.
 *
 * These tests mock @openhands/extensions/integrations to verify:
 * - Entries with no connectionOptions are filtered out (null is returned).
 * - Only the FIRST connectionOptions item is used when multiple exist.
 * - All fields from IntegrationConnectionOption map correctly to
 *   IntegrationConnectionDefaults.
 */
import { describe, expect, it, vi } from "vitest";

import type { IntegrationCatalogEntry } from "@openhands/extensions/integrations";

vi.mock("@openhands/extensions/integrations", () => ({
  listIntegrationCatalog: vi.fn(),
}));

import { listIntegrationCatalog } from "@openhands/extensions/integrations";
import { listIntegrationCatalogOptions } from "@/src/lib/integrations/integration-catalog";

const mockListIntegrationCatalog = vi.mocked(listIntegrationCatalog);

const baseEntry = ({
  docsUrl = "https://docs.example.com/test",
  ...overrides
}: Partial<IntegrationCatalogEntry> = {}): IntegrationCatalogEntry => ({
  id: "test-integration",
  name: "Test Integration",
  description: "A test integration",
  docsUrl,
  connectionOptions: [],
  ...overrides,
});

describe("listIntegrationCatalogOptions — connection-defaults derivation", () => {
  it("filters out entries with no connectionOptions", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({ id: "no-options", connectionOptions: [] }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result).toHaveLength(0);
  });

  it("includes entries that have at least one connectionOption", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({
        id: "has-option",
        connectionOptions: [
          {
            id: "api",
            provider: "http",
            auth: { strategy: "api_key", authModes: ["api_key"] },
            http: { apiBaseUrl: "https://api.example.com" },
          },
        ],
      }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("has-option");
  });

  it("uses only the first connectionOption when multiple exist", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({
        id: "multi-option",
        connectionOptions: [
          {
            id: "first",
            provider: "http",
            auth: { strategy: "api_key" },
            http: { apiBaseUrl: "https://first.example.com" },
          },
          {
            id: "second",
            provider: "mcp",
            auth: { strategy: "oauth2" },
            transport: { kind: "shttp", url: "https://mcp.example.com/mcp" },
          },
        ],
      }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result).toHaveLength(1);
    const defaults = result[0]?.connectionDefaults;
    // Must come from the first option (http / api_key), not the second (mcp / oauth2)
    expect(defaults?.provider).toBe("http");
    expect(defaults?.authStrategy).toBe("api_key");
    expect(defaults?.apiBaseUrl).toBe("https://first.example.com");
    expect(defaults?.serverUrl).toBeUndefined();
  });

  it("maps all http connectionOption fields into connectionDefaults", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({
        id: "full-http",
        connectionOptions: [
          {
            id: "api",
            provider: "http",
            auth: {
              strategy: "api_key",
              authModes: ["api_key"],
              credentialLabel: "My API Key",
              credentialPlaceholder: "sk-...",
              credentialHelp: "Find it in settings",
              apiKeyHeaderName: "X-Api-Key",
              apiKeyOptional: false,
            },
            http: {
              apiBaseUrl: "https://api.example.com",
              openApiUrl: "https://api.example.com/openapi.json",
            },
          },
        ],
      }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result[0]?.connectionDefaults).toMatchObject({
      provider: "http",
      authStrategy: "api_key",
      authModes: ["api_key"],
      credentialLabel: "My API Key",
      credentialPlaceholder: "sk-...",
      credentialHelp: "Find it in settings",
      apiKeyHeaderName: "X-Api-Key",
      apiKeyOptional: false,
      apiBaseUrl: "https://api.example.com",
      openApiUrl: "https://api.example.com/openapi.json",
    });
    // The catalog's defaultTool field is intentionally not mapped — tools are
    // generated from the OpenAPI URL server-side, never hardcoded.
    expect("toolName" in (result[0]?.connectionDefaults ?? {})).toBe(false);
    expect("requestMethod" in (result[0]?.connectionDefaults ?? {})).toBe(
      false,
    );
  });

  it("maps all mcp/oauth2 connectionOption fields into connectionDefaults", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({
        id: "full-mcp-oauth",
        connectionOptions: [
          {
            id: "oauth",
            provider: "mcp",
            transport: { kind: "shttp", url: "https://mcp.example.com/mcp" },
            auth: {
              strategy: "oauth2",
              oauth: {
                authorizationUrl: "https://example.com/oauth/authorize",
                tokenUrl: "https://example.com/oauth/token",
                scopes: ["read", "write"],
                optionalScopes: ["admin"],
                scopeSeparator: "space",
                pkce: true,
                clientAuthentication: "body",
                registrationUrl: "https://example.com/oauth/register",
                additionalAuthorizationParams: { prompt: "consent" },
                additionalTokenParams: { grant_type: "authorization_code" },
              },
            },
          },
        ],
      }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result[0]?.connectionDefaults).toMatchObject({
      provider: "mcp",
      authStrategy: "oauth2",
      serverUrl: "https://mcp.example.com/mcp",
      oauthConfig: {
        authorizationUrl: "https://example.com/oauth/authorize",
        tokenUrl: "https://example.com/oauth/token",
        scopes: ["read", "write"],
        optionalScopes: ["admin"],
        scopeSeparator: "space",
        pkce: true,
        clientAuthentication: "body",
        registrationUrl: "https://example.com/oauth/register",
        additionalAuthorizationParams: { prompt: "consent" },
        additionalTokenParams: { grant_type: "authorization_code" },
      },
    });
    // OAuth fields should be nested inside oauthConfig, not at the top level
    expect("authorizationUrl" in (result[0]?.connectionDefaults ?? {})).toBe(
      false,
    );
    expect("tokenUrl" in (result[0]?.connectionDefaults ?? {})).toBe(false);
    expect(
      "clientAuthentication" in (result[0]?.connectionDefaults ?? {}),
    ).toBe(false);
  });

  it("maps top-level catalog entry metadata to catalog option fields", () => {
    mockListIntegrationCatalog.mockReturnValue([
      {
        id: "meta-test",
        name: "Meta Test",
        description: "Verifies top-level metadata mapping",
        categories: ["productivity"],
        appUrl: "https://app.example.com",
        docsUrl: "https://docs.example.com",
        logoUrl: "https://cdn.example.com/logo.png",
        iconBg: "#ffffff",
        iconColor: "#000000",
        notes: "Some notes",
        popularityRank: 5,
        connectionOptions: [
          {
            id: "api",
            provider: "http",
            auth: { strategy: "api_key" },
          },
        ],
      },
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result[0]).toMatchObject({
      slug: "meta-test",
      name: "Meta Test",
      description: "Verifies top-level metadata mapping",
      categories: ["productivity"],
      appUrl: "https://app.example.com",
      docsUrl: "https://docs.example.com",
      logoUrl: "https://cdn.example.com/logo.png",
      iconBg: "#ffffff",
      iconColor: "#000000",
      notes: "Some notes",
      popularityRank: 5,
    });
  });

  it("omits undefined optional fields from connectionDefaults", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({
        id: "minimal",
        connectionOptions: [
          {
            id: "api",
            provider: "http",
            auth: { strategy: "api_key" },
          },
        ],
      }),
    ]);

    const result = listIntegrationCatalogOptions();

    const defaults = result[0]?.connectionDefaults;
    expect(defaults?.provider).toBe("http");
    // Optional fields should not be present (not just undefined — not in the object)
    expect("serverUrl" in (defaults ?? {})).toBe(false);
    expect("authorizationUrl" in (defaults ?? {})).toBe(false);
    expect("openApiUrl" in (defaults ?? {})).toBe(false);
    expect("toolName" in (defaults ?? {})).toBe(false);
  });

  it("handles a mix of entries with and without connectionOptions", () => {
    mockListIntegrationCatalog.mockReturnValue([
      baseEntry({ id: "no-options", connectionOptions: [] }),
      baseEntry({
        id: "has-options",
        connectionOptions: [
          {
            id: "api",
            provider: "http",
            auth: { strategy: "api_key" },
          },
        ],
      }),
      baseEntry({ id: "also-no-options", connectionOptions: [] }),
    ]);

    const result = listIntegrationCatalogOptions();

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("has-options");
  });
});

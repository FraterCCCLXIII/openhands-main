import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  providers: [] as Array<any>,
  registrationDefaults: {} as Record<string, any>,
}));

vi.mock("@/src/lib/integrations/oauth-provider-catalog", () => ({
  listOAuthProviderCatalog: () => mockState.providers,
}));

vi.mock("@/src/lib/integrations/oauth-provider-registration-defaults", () => ({
  getOAuthProviderRegistrationDefaults: (slug: string) => mockState.registrationDefaults[slug],
}));

import type { ContextRepository } from "@/src/lib/core/repository";
import {
  buildManagedConnectorFunctionSpecs,
  buildManagedConnectorFunctions,
  buildManagedConnectorToolSpecs,
  getDefaultBuiltInConnector,
  getManagedConnectorApiBaseUrl,
  getManagedConnectorProvider,
  getManagedConnectorRecord,
  getManagedConnectorServerUrl,
  listAllManagedConnectorDefinitions,
  listAvailableBuiltInConnectors,
  listDefaultBuiltInConnectors,
  managedConnectorToBuiltInOption,
  resolveManagedConnectorCredentials,
  sanitizeManagedConnector,
} from "@/src/lib/integrations/managed-connectors";
import type {
  ManagedConnectorRecord,
  ManagedConnectorToolDefinition,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

const makeProvider = (
  overrides: Partial<OAuthProviderCatalogOption> &
    Pick<OAuthProviderCatalogOption, "slug" | "name">,
): OAuthProviderCatalogOption => ({
  slug: overrides.slug,
  name: overrides.name,
  description: overrides.description ?? `${overrides.name} description`,
  categories: overrides.categories ?? ["Operations"],
  authStrategy: overrides.authStrategy ?? "oauth2",
  availability: overrides.availability ?? "planned",
  builtInSlug: overrides.builtInSlug,
  appUrl: overrides.appUrl,
  docsUrl: overrides.docsUrl,
  notes: overrides.notes ?? "",
  popularityRank: overrides.popularityRank ?? 1,
  registrationDefaults: overrides.registrationDefaults,
});

const makeTool = (
  overrides: Partial<ManagedConnectorToolDefinition> &
    Pick<ManagedConnectorToolDefinition, "name" | "description">,
): ManagedConnectorToolDefinition => ({
  name: overrides.name,
  description: overrides.description,
  defaultScopes: overrides.defaultScopes ?? [],
  accessMode: overrides.accessMode,
  request: overrides.request,
  config: overrides.config,
});

const makeConnector = (
  overrides: Partial<ManagedConnectorRecord> &
    Pick<ManagedConnectorRecord, "slug" | "name">,
): ManagedConnectorRecord => ({
  slug: overrides.slug,
  name: overrides.name,
  description: overrides.description ?? `${overrides.name} connector`,
  logoUrl: overrides.logoUrl,
  appUrl: overrides.appUrl,
  docsUrl: overrides.docsUrl,
  categories: overrides.categories ?? ["Operations"],
  authModes: overrides.authModes ?? [overrides.authStrategy ?? "bearer"],
  authStrategy: overrides.authStrategy ?? "bearer",
  provider: overrides.provider,
  oauthConfigured: overrides.oauthConfigured,
  credentialLabel: overrides.credentialLabel ?? `${overrides.name} credential`,
  credentialPlaceholder:
    overrides.credentialPlaceholder ?? `Paste your ${overrides.name} credential`,
  credentialHelp:
    overrides.credentialHelp ?? `Credential required by ${overrides.name}.`,
  apiBaseUrl: overrides.apiBaseUrl,
  serverUrl: overrides.serverUrl,
  openApiUrl: overrides.openApiUrl,
  oauthConfig: overrides.oauthConfig,
  tools: overrides.tools ?? [],
  enabled: overrides.enabled ?? true,
  createdAt: overrides.createdAt ?? "2026-04-01T00:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2026-04-01T00:00:00.000Z",
  encryptedOAuthClient: overrides.encryptedOAuthClient,
});

const createRepository = (
  connectors: ManagedConnectorRecord[],
): ContextRepository =>
  ({
    listManagedConnectors: vi.fn(async () => connectors),
    getManagedConnector: vi.fn(async (slug: string) => {
      return connectors.find((connector) => connector.slug === slug) ?? null;
    }),
  }) as unknown as ContextRepository;

beforeEach(() => {
  mockState.providers = [
    makeProvider({
      slug: "api-service",
      builtInSlug: "api-service-builtin",
      name: "API Service",
      authStrategy: "api_key",
      availability: "manual_token",
      registrationDefaults: {
        provider: "http",
        authStrategy: "api_key",
        authModes: ["api_key"],
        apiBaseUrl: "https://api.example.test",
        openApiUrl: "https://api.example.test/openapi.json",
        apiKeyHeaderName: " X-Service-Key ",
      },
    }),
    makeProvider({
      slug: "mcp-service",
      name: "MCP Service",
      authStrategy: "bearer",
      availability: "manual_token",
      registrationDefaults: {
        provider: "mcp",
        authStrategy: "bearer",
        serverUrl: "https://mcp.example.test",
      },
    }),
    makeProvider({
      slug: "oauth-only",
      name: "OAuth Only",
      availability: "oauth_ready",
      registrationDefaults: {
        provider: "http",
        authStrategy: "oauth2",
        apiBaseUrl: "https://oauth.example.test",
        openApiUrl: "https://oauth.example.test/openapi.json",
      },
    }),
    makeProvider({
      slug: "broken-http",
      name: "Broken HTTP",
      authStrategy: "api_key",
      availability: "manual_token",
      registrationDefaults: {
        provider: "http",
        authStrategy: "api_key",
        apiBaseUrl: "https://broken-http.example.test",
      },
    }),
    makeProvider({
      slug: "broken-mcp",
      name: "Broken MCP",
      authStrategy: "bearer",
      availability: "manual_token",
      registrationDefaults: {
        provider: "mcp",
        authStrategy: "bearer",
      },
    }),
    makeProvider({
      slug: "missing-defaults",
      name: "Missing Defaults",
      availability: "planned",
    }),
  ];
  mockState.registrationDefaults = {
    "configured-key": { apiKeyHeaderName: " X-From-Defaults " },
    "fallback-key": { apiKeyHeaderName: " X-Catalog-Key " },
  };
});

describe("managed connector registry helpers", () => {
  it("lists only supported default built-in connectors with normalized defaults", () => {
    expect(listDefaultBuiltInConnectors()).toEqual([
      {
        slug: "api-service-builtin",
        name: "API Service",
        description: "API Service description",
        appUrl: undefined,
        logoUrl: undefined,
        toolCount: 0,
        categories: ["Operations"],
        authModes: ["api_key"],
        authStrategy: "api_key",
        oauthConfigured: true,
        credentialLabel: "API Service credential",
        credentialPlaceholder: "Paste your API Service credential",
        credentialHelp: "Credential required by API Service.",
        apiKeyHeaderName: "X-Service-Key",
      },
      {
        slug: "mcp-service",
        name: "MCP Service",
        description: "MCP Service description",
        appUrl: undefined,
        logoUrl: undefined,
        toolCount: 0,
        categories: ["Operations"],
        authModes: ["bearer"],
        authStrategy: "bearer",
        oauthConfigured: true,
        credentialLabel: "MCP Service credential",
        credentialPlaceholder: "Paste your MCP Service credential",
        credentialHelp: "Credential required by MCP Service.",
        apiKeyHeaderName: undefined,
      },
    ]);
  });

  it("resolves individual default connectors by built-in slug and ignores unsupported entries", () => {
    expect(getDefaultBuiltInConnector("api-service-builtin")).toMatchObject({
      slug: "api-service-builtin",
      authStrategy: "api_key",
      provider: "http",
      apiBaseUrl: "https://api.example.test",
      openApiUrl: "https://api.example.test/openapi.json",
      apiKeyHeaderName: "X-Service-Key",
    });
    expect(getDefaultBuiltInConnector("oauth-only")).toBeNull();
    expect(getDefaultBuiltInConnector("missing")).toBeNull();
  });

  it("infers provider URLs and sanitizes connector records", () => {
    const explicitMcp = makeConnector({
      slug: "explicit-mcp",
      name: "Explicit MCP",
      provider: "mcp",
      serverUrl: "   ",
      apiBaseUrl: " https://mcp.fallback.test ",
      tools: [makeTool({ name: "fetch_remote", description: "Fetch remote" })],
    });
    const inferredMcp = makeConnector({
      slug: "inferred-mcp",
      name: "Inferred MCP",
      provider: undefined,
      serverUrl: undefined,
      apiBaseUrl: " https://mcp.inferred.test ",
      tools: [],
    });
    const inferredHttp = makeConnector({
      slug: "inferred-http",
      name: "Inferred HTTP",
      provider: undefined,
      authStrategy: "oauth2",
      authModes: ["oauth2"],
      serverUrl: undefined,
      apiBaseUrl: " https://api.http.test ",
      oauthConfig: {
        authorizationUrl: "https://auth.http.test/authorize",
        tokenUrl: "https://auth.http.test/token",
        scopes: ["records.read"],
      },
      encryptedOAuthClient: "encrypted-client",
      tools: [makeTool({ name: "list_records", description: "List records" })],
    });

    expect(getManagedConnectorProvider(explicitMcp)).toBe("mcp");
    expect(getManagedConnectorServerUrl(explicitMcp)).toBe("https://mcp.fallback.test");
    expect(getManagedConnectorApiBaseUrl(explicitMcp)).toBeUndefined();

    expect(getManagedConnectorProvider(inferredMcp)).toBe("mcp");
    expect(getManagedConnectorServerUrl(inferredMcp)).toBe("https://mcp.inferred.test");

    expect(getManagedConnectorProvider(inferredHttp)).toBe("http");
    expect(getManagedConnectorServerUrl(inferredHttp)).toBeUndefined();
    expect(getManagedConnectorApiBaseUrl(inferredHttp)).toBe("https://api.http.test");

    expect(sanitizeManagedConnector(inferredHttp)).toMatchObject({
      provider: "http",
      apiBaseUrl: "https://api.http.test",
      serverUrl: undefined,
      oauthConfigured: true,
      encryptedOAuthClient: undefined,
    });
    expect(
      sanitizeManagedConnector({
        ...inferredHttp,
        encryptedOAuthClient: undefined,
      }).oauthConfigured,
    ).toBe(false);
  });

  it("translates managed connectors to built-in options using configured header defaults", () => {
    const apiKeyConnector = makeConnector({
      slug: "configured-key",
      name: "Configured Key",
      authStrategy: "api_key",
      authModes: ["api_key"],
      provider: "http",
      apiBaseUrl: "https://api.configured.test",
      tools: [makeTool({ name: "list_keys", description: "List keys" })],
    });
    const oauthConnector = makeConnector({
      slug: "oauth-connector",
      name: "OAuth Connector",
      authStrategy: "oauth2",
      authModes: ["oauth2"],
      provider: "mcp",
      serverUrl: "https://oauth.connector.test/mcp",
      oauthConfig: {
        authorizationUrl: "https://oauth.connector.test/authorize",
        tokenUrl: "https://oauth.connector.test/token",
        scopes: ["openid"],
      },
    });

    expect(managedConnectorToBuiltInOption(apiKeyConnector)).toMatchObject({
      slug: "configured-key",
      toolCount: 1,
      apiKeyHeaderName: "X-From-Defaults",
      oauthConfigured: true,
    });
    expect(managedConnectorToBuiltInOption(oauthConnector)).toMatchObject({
      slug: "oauth-connector",
      oauthConfigured: false,
    });
  });

  it("builds tool specs with merged config, request templates, and access-mode defaults", () => {
    const tools = [
      makeTool({
        name: "sync_contacts",
        description: "Sync contacts",
        defaultScopes: ["contacts.read"],
        accessMode: "approval_required",
        config: { syncMode: "full" },
        request: { method: "POST", path: "/contacts/sync" },
      }),
      makeTool({
        name: "ping",
        description: "Ping service",
      }),
      makeTool({
        name: "disable_remote",
        description: "Disable remote",
        accessMode: "disabled",
      }),
    ];

    const specs = buildManagedConnectorToolSpecs(tools);

    expect(specs.sync_contacts).toMatchObject({
      enabled: true,
      accessMode: "approval_required",
      maxAccessMode: "approval_required",
      fineGrainedPermissions: true,
      executionMode: "provider",
      defaultScopes: ["contacts.read"],
      config: {
        syncMode: "full",
        request: { method: "POST", path: "/contacts/sync" },
      },
    });
    expect(specs.ping).toMatchObject({
      enabled: true,
      accessMode: "enabled",
      maxAccessMode: "enabled",
      config: {},
    });
    expect(specs.disable_remote).toMatchObject({
      enabled: false,
      accessMode: "disabled",
      maxAccessMode: "disabled",
    });
    expect(buildManagedConnectorFunctionSpecs(tools)).toEqual(specs);
    expect(buildManagedConnectorFunctions({ tools })).toEqual(specs);
  });

  it("resolves oauth2 and none connectors without static credentials", () => {
    expect(
      resolveManagedConnectorCredentials(
        { slug: "oauth", name: "OAuth", authStrategy: "oauth2", credentialLabel: "OAuth" },
        { credentials: { accessToken: "ignored" } },
      ),
    ).toEqual({});
    expect(
      resolveManagedConnectorCredentials(
        { slug: "none", name: "None", authStrategy: "none", credentialLabel: "None" },
        { credentials: { anything: "ignored" } },
      ),
    ).toEqual({});
  });

  it("validates bearer and basic credentials", () => {
    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "bearer-service",
          name: "Bearer Service",
          authStrategy: "bearer",
          credentialLabel: "Bearer token",
        },
        { credentials: { accessToken: "  bearer-token  " } },
      ),
    ).toEqual({ accessToken: "bearer-token" });
    expect(() =>
      resolveManagedConnectorCredentials(
        {
          slug: "bearer-service",
          name: "Bearer Service",
          authStrategy: "bearer",
          credentialLabel: "Bearer token",
        },
        { credentials: { accessToken: "   " } },
      ),
    ).toThrow("Bearer token is required to use the Bearer Service connector.");

    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "basic-service",
          name: "Basic Service",
          authStrategy: "basic",
          credentialLabel: "Basic auth",
        },
        { credentials: { username: "  alice ", password: "  wonderland " } },
      ),
    ).toEqual({ username: "alice", password: "wonderland" });
    expect(() =>
      resolveManagedConnectorCredentials(
        {
          slug: "basic-service",
          name: "Basic Service",
          authStrategy: "basic",
          credentialLabel: "Basic auth",
        },
        { credentials: { username: "alice", password: "   " } },
      ),
    ).toThrow("Basic auth is required to use the Basic Service connector.");
  });

  it("resolves API-key credentials using input, connector, catalog, and fallback headers", () => {
    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "configured-key",
          name: "Configured Key",
          authStrategy: "api_key",
          credentialLabel: "Configured key",
          apiKeyHeaderName: " X-Connector-Key ",
        },
        {
          credentials: {
            secret: "  top-secret  ",
            headerName: " X-Input-Key ",
          },
        },
      ),
    ).toEqual({ headerName: "X-Input-Key", secret: "top-secret" });

    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "configured-key",
          name: "Configured Key",
          authStrategy: "api_key",
          credentialLabel: "Configured key",
          apiKeyHeaderName: " X-Connector-Key ",
        },
        { credentials: { secret: "secret" } },
      ),
    ).toEqual({ headerName: "X-Connector-Key", secret: "secret" });

    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "fallback-key",
          name: "Fallback Key",
          authStrategy: "api_key",
          credentialLabel: "Fallback key",
        },
        { credentials: { secret: "secret" } },
      ),
    ).toEqual({ headerName: "X-Catalog-Key", secret: "secret" });

    expect(
      resolveManagedConnectorCredentials(
        {
          slug: "plain-key",
          name: "Plain Key",
          authStrategy: "api_key",
          credentialLabel: "Plain key",
        },
        { credentials: { secret: "secret" } },
      ),
    ).toEqual({ headerName: "X-API-Key", secret: "secret" });

    expect(() =>
      resolveManagedConnectorCredentials(
        {
          slug: "plain-key",
          name: "Plain Key",
          authStrategy: "api_key",
          credentialLabel: "Plain key",
        },
        { credentials: { secret: "   " } },
      ),
    ).toThrow("Plain key is required to use the Plain Key connector.");
  });

  it("rejects unsupported auth strategies", () => {
    expect(() =>
      resolveManagedConnectorCredentials(
        {
          slug: "session-only",
          name: "Session Only",
          authStrategy: "mcp_session" as never,
          credentialLabel: "Session token",
        },
        { credentials: {} },
      ),
    ).toThrow("Managed connector 'session-only' uses unsupported auth strategy 'mcp_session'.");
  });

  it("merges enabled managed connectors with unsuppressed catalog defaults", async () => {
    const repository = createRepository([
      makeConnector({
        slug: "gamma-desk",
        name: "Gamma Desk",
        provider: "mcp",
        serverUrl: "https://gamma.example.test/mcp",
      }),
      makeConnector({
        slug: "api-service-builtin",
        name: "Shadow API Service",
        authStrategy: "api_key",
        authModes: ["api_key"],
        provider: "http",
        apiBaseUrl: "https://shadow.example.test",
        openApiUrl: "https://shadow.example.test/openapi.json",
        enabled: false,
      }),
    ]);

    await expect(listAvailableBuiltInConnectors(repository)).resolves.toEqual([
      expect.objectContaining({ slug: "gamma-desk", name: "Gamma Desk" }),
      expect.objectContaining({ slug: "mcp-service", name: "MCP Service" }),
    ]);
  });

  it("lists sanitized managed connector definitions alongside unsuppressed catalog defaults", async () => {
    const repository = createRepository([
      makeConnector({
        slug: "custom-http",
        name: "Custom HTTP",
        provider: undefined,
        authStrategy: "oauth2",
        authModes: ["oauth2"],
        apiBaseUrl: " https://api.custom-http.test ",
        oauthConfig: {
          authorizationUrl: "https://auth.custom-http.test/authorize",
          tokenUrl: "https://auth.custom-http.test/token",
          scopes: ["contacts.read"],
        },
        tools: [makeTool({ name: "list_contacts", description: "List contacts" })],
      }),
      makeConnector({
        slug: "api-service-builtin",
        name: "Shadow API Service",
        authStrategy: "api_key",
        authModes: ["api_key"],
        provider: "http",
        apiBaseUrl: "https://shadow.example.test",
        openApiUrl: "https://shadow.example.test/openapi.json",
        enabled: false,
      }),
    ]);

    const definitions = await listAllManagedConnectorDefinitions(repository);

    expect(definitions.map((connector) => connector.name)).toEqual([
      "Custom HTTP",
      "MCP Service",
      "Shadow API Service",
    ]);
    expect(definitions).toContainEqual(
      expect.objectContaining({
        slug: "custom-http",
        provider: "http",
        apiBaseUrl: "https://api.custom-http.test",
        oauthConfigured: false,
      }),
    );
    expect(definitions).toContainEqual(
      expect.objectContaining({
        slug: "mcp-service",
        provider: "mcp",
        enabled: true,
        createdAt: "",
        updatedAt: "",
      }),
    );
    expect(definitions).not.toContainEqual(
      expect.objectContaining({ slug: "api-service-builtin", name: "API Service" }),
    );
  });

  it("returns only enabled managed connector records", async () => {
    const repository = createRepository([
      makeConnector({ slug: "enabled", name: "Enabled", enabled: true }),
      makeConnector({ slug: "disabled", name: "Disabled", enabled: false }),
    ]);

    await expect(getManagedConnectorRecord(repository, "enabled")).resolves.toMatchObject({
      slug: "enabled",
    });
    await expect(getManagedConnectorRecord(repository, "disabled")).resolves.toBeNull();
    await expect(getManagedConnectorRecord(repository, "missing")).resolves.toBeNull();
  });
});

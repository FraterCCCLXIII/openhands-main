/**
 * End-to-end integration tests exercising the full service stack with a real
 * (PGlite-backed) database.
 *
 * These tests cover the built-in connector → discovery → integration creation
 * path that is otherwise only exercised in production with a real Postgres
 * instance and Neon serverless driver.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestContext, type PgliteTestContext } from "./db/pglite-test-utils";

let ctx: PgliteTestContext;

// Mock neon to use PGlite.
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ctx.sql,
}));

// Mock auth to always return a dev user.
vi.mock("@/src/lib/auth", () => ({
  auth: async () => ({
    user: { name: "E2E Test User", email: "e2e@test.local" },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  }),
  isAuthDisabled: () => true,
}));

// Prevent Composio adapter from loading real credentials.
vi.mock("@/src/lib/adapters/composio-adapter", () => ({
  ComposioAdapter: class {
    async invoke() {
      return { data: {} };
    }
  },
}));

const { PostgresRepository } = await import("./db/postgres-repository");
const { ContextLayerService } = await import("./core/service");
const { AdapterRegistry } = await import("./core/adapter-registry");
const { MockAdapter } = await import("./adapters/mock-adapter");
const { HttpAdapter } = await import("./adapters/http-adapter");
const { McpAdapter } = await import("./adapters/mcp-adapter");
const { NotificationPublisher } = await import("./notifications/publisher");
const { listAvailableBuiltInConnectors, listDefaultBuiltInConnectors, buildManagedConnectorTools, resolveManagedConnectorCredentials } =
  await import("./integrations/managed-connectors");

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://e2e-integration-test");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

let repo: InstanceType<typeof PostgresRepository>;
let service: InstanceType<typeof ContextLayerService>;

beforeEach(async () => {
  ctx = await createPgliteTestContext();
  repo = new PostgresRepository();
  await repo.ensureSchema();

  const registry = new AdapterRegistry({
    composio: { invoke: async () => ({ data: {} }) } as never,
    http: new HttpAdapter(),
    mcp: new McpAdapter(),
    mock: new MockAdapter(),
  });

  service = new ContextLayerService(
    repo,
    registry,
    new NotificationPublisher(repo),
  );
});

afterEach(async () => {
  await ctx.close();
});

const TEST_OWNER = "e2e@test.local";

// ---------------------------------------------------------------------------
// Built-in connector listing
// ---------------------------------------------------------------------------
describe("built-in connector listing", () => {
  it("returns catalog-backed default connectors when no DB records exist", async () => {
    const connectors = await listAvailableBuiltInConnectors(repo);

    // Default built-ins are derived from the OAuth provider catalog where
    // registrationDefaults specifies provider=http + apiBaseUrl + openApiUrl.
    // ElevenLabs is the canonical example.
    const elevenlabs = connectors.find((c) => c.slug === "elevenlabs");
    expect(elevenlabs).toBeDefined();
    expect(elevenlabs!.authStrategy).toBe("api_key");
  });

  it("returns static default built-in connectors from catalog", () => {
    const defaults = listDefaultBuiltInConnectors();
    expect(defaults.length).toBeGreaterThan(0);

    // Every default should have key fields populated
    for (const connector of defaults) {
      expect(connector.slug).toBeTruthy();
      expect(connector.name).toBeTruthy();
      expect(connector.authStrategy).toBeTruthy();
      expect(connector.credentialLabel).toBeTruthy();
    }
  });

  it("DB-registered connectors override catalog defaults with the same slug", async () => {
    const now = new Date().toISOString();

    // Register a DB connector with the same slug as a catalog default
    await repo.upsertManagedConnector({
      slug: "elevenlabs",
      name: "ElevenLabs (Custom)",
      description: "Custom ElevenLabs connector",
      categories: ["ai"],
      authModes: ["api_key"],
      authStrategy: "api_key",
      credentialLabel: "Custom API Key",
      credentialPlaceholder: "sk-...",
      credentialHelp: "Custom help",
      apiBaseUrl: "https://api.elevenlabs.io",
      tools: [],
      enabled: true,
      oauthConfigured: false,
      createdAt: now,
      updatedAt: now,
    });

    const connectors = await listAvailableBuiltInConnectors(repo);
    const elevenlabs = connectors.find((c) => c.slug === "elevenlabs");

    expect(elevenlabs).toBeDefined();
    expect(elevenlabs!.name).toBe("ElevenLabs (Custom)");
    expect(elevenlabs!.credentialLabel).toBe("Custom API Key");

    // Should not have duplicates
    const elevenlabsCount = connectors.filter((c) => c.slug === "elevenlabs").length;
    expect(elevenlabsCount).toBe(1);
  });

  it("disabled DB connectors suppress the catalog default", async () => {
    const now = new Date().toISOString();

    await repo.upsertManagedConnector({
      slug: "elevenlabs",
      name: "ElevenLabs",
      description: "Disabled",
      categories: [],
      authModes: ["api_key"],
      authStrategy: "api_key",
      credentialLabel: "Key",
      credentialPlaceholder: "...",
      credentialHelp: "...",
      apiBaseUrl: "https://api.elevenlabs.io",
      tools: [],
      enabled: false,
      oauthConfigured: false,
      createdAt: now,
      updatedAt: now,
    });

    const connectors = await listAvailableBuiltInConnectors(repo);
    const elevenlabs = connectors.find((c) => c.slug === "elevenlabs");

    // Disabled DB record hides the catalog default
    expect(elevenlabs).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Full flow: built-in connector → integration creation → list
// ---------------------------------------------------------------------------
describe("built-in connector → integration creation → listing flow", () => {
  it("creates an integration from a managed connector and retrieves it", async () => {
    const now = new Date().toISOString();

    // Step 1: Register a managed connector (simulating what an admin would do)
    await repo.upsertManagedConnector({
      slug: "test-api",
      name: "Test API",
      description: "A test HTTP API connector",
      categories: ["testing"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      credentialLabel: "Access Token",
      credentialPlaceholder: "Paste your token",
      credentialHelp: "Get your token from the settings page.",
      apiBaseUrl: "https://api.test.example.com",
      tools: [
        {
          name: "list_items",
          description: "List all items",
          defaultScopes: ["read"],
          request: { method: "GET", path: "/items" },
        },
        {
          name: "create_item",
          description: "Create a new item",
          defaultScopes: ["write"],
          request: { method: "POST", path: "/items" },
        },
      ],
      enabled: true,
      oauthConfigured: false,
      createdAt: now,
      updatedAt: now,
    });

    // Step 2: Verify it appears in the built-in connector list
    const builtIns = await listAvailableBuiltInConnectors(repo);
    const testApi = builtIns.find((c) => c.slug === "test-api");
    expect(testApi).toBeDefined();
    expect(testApi!.toolCount).toBe(2);
    expect(testApi!.authStrategy).toBe("bearer");

    // Step 3: Build tool specs from the managed connector
    const connector = await repo.getManagedConnector("test-api");
    expect(connector).not.toBeNull();
    const toolSpecs = buildManagedConnectorTools(connector!);
    expect(Object.keys(toolSpecs)).toEqual(["list_items", "create_item"]);
    expect(toolSpecs["list_items"]!.description).toBe("List all items");

    // Step 4: Create an owner integration via the service
    const integration = await service.registerOwnerIntegration(TEST_OWNER, {
      key: "test-api",
      name: "Test API",
      kind: "api",
      provider: "http",
      authStrategy: "bearer",
      enabled: true,
      fineGrainedPermissions: true,
      config: { baseUrl: "https://api.test.example.com" },
      credentials: { accessToken: "test-token-123" },
      tools: toolSpecs,
    });

    expect(integration.key).toBe("test-api");
    expect(integration.enabled).toBe(true);
    expect(Object.keys(integration.tools)).toHaveLength(2);

    // Step 5: List the owner's integrations via the service
    const ownerIntegrations = await service.listOwnerIntegrations(TEST_OWNER);
    expect(ownerIntegrations).toHaveLength(1);
    expect(ownerIntegrations[0]!.key).toBe("test-api");
    expect(ownerIntegrations[0]!.tools["list_items"]).toBeDefined();
  });

  it("resolves bearer credentials from a managed connector definition", () => {
    const connector = {
      slug: "test-bearer",
      name: "Test Bearer",
      authStrategy: "bearer" as const,
      credentialLabel: "Token",
    };

    const credentials = resolveManagedConnectorCredentials(connector, {
      credentials: { accessToken: "my-secret-token" },
    });

    expect(credentials).toEqual({ accessToken: "my-secret-token" });
  });

  it("resolves api_key credentials from a managed connector definition", () => {
    const connector = {
      slug: "test-apikey",
      name: "Test API Key",
      authStrategy: "api_key" as const,
      credentialLabel: "API Key",
    };

    const credentials = resolveManagedConnectorCredentials(connector, {
      credentials: { secret: "sk-12345", headerName: "X-Custom-Key" },
    });

    expect(credentials).toEqual({
      headerName: "X-Custom-Key",
      secret: "sk-12345",
    });
  });

  it("rejects empty bearer credentials", () => {
    const connector = {
      slug: "test-bearer",
      name: "Test Bearer",
      authStrategy: "bearer" as const,
      credentialLabel: "Token",
    };

    expect(() =>
      resolveManagedConnectorCredentials(connector, {
        credentials: { accessToken: "" },
      }),
    ).toThrow(/Token is required/);
  });
});

// ---------------------------------------------------------------------------
// Agent API key provisioning and integration lifecycle
// ---------------------------------------------------------------------------
describe("agent API key + integration lifecycle", () => {
  it("provisions an API key and uses it to manage integrations", async () => {
    // Step 1: Ensure API key for the owner
    const apiKeyRecord = await service.getOrCreateAgentApiKey(TEST_OWNER);
    expect(apiKeyRecord.apiKey).toBeTruthy();
    expect(apiKeyRecord.apiKey.startsWith("cla_")).toBe(true);

    // Step 2: Verify the key can be found
    const found = await repo.findAgentApiKey(apiKeyRecord.apiKey);
    expect(found).not.toBeNull();
    expect(found!.ownerId).toBe(TEST_OWNER);

    // Step 3: Create an integration
    await service.registerOwnerIntegration(TEST_OWNER, {
      key: "my-mcp",
      name: "My MCP Server",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "none",
      enabled: true,
      fineGrainedPermissions: false,
      config: { serverUrl: "https://mcp.example.com" },
      credentials: {},
      tools: {},
    });

    // Step 4: Toggle integration enabled/disabled
    const disabled = await service.setOwnerIntegrationEnabled(TEST_OWNER, "my-mcp", false);
    expect(disabled.enabled).toBe(false);

    const enabled = await service.setOwnerIntegrationEnabled(TEST_OWNER, "my-mcp", true);
    expect(enabled.enabled).toBe(true);

    // Step 5: List should show the integration
    const integrations = await service.listOwnerIntegrations(TEST_OWNER);
    expect(integrations).toHaveLength(1);
    expect(integrations[0]!.key).toBe("my-mcp");
  });
});

// ---------------------------------------------------------------------------
// OAuth state management round-trip
// ---------------------------------------------------------------------------
describe("OAuth state management", () => {
  it("stores and retrieves OAuth state records through the repository", async () => {
    const state = "oauth-state-" + Date.now();

    await repo.saveOAuthState({
      state,
      ownerId: TEST_OWNER,
      integrationKey: "notion",
      provider: "notion",
      codeVerifier: "pkce-verifier-abc",
      redirectTo: "/integrations",
      redirectUri: "https://example.com/api/oauth/notion/callback",
      callbackUrl: "https://example.com/api/oauth/notion/callback",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });

    const retrieved = await repo.getOAuthState(state);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.ownerId).toBe(TEST_OWNER);
    expect(retrieved!.provider).toBe("notion");
    expect(retrieved!.codeVerifier).toBe("pkce-verifier-abc");
    expect(retrieved!.callbackUrl).toBe("https://example.com/api/oauth/notion/callback");

    // Cleanup (simulating callback completion)
    await repo.deleteOAuthState(state);
    expect(await repo.getOAuthState(state)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Temporary grant lifecycle with real DB
// ---------------------------------------------------------------------------
describe("temporary grant lifecycle", () => {
  it("saves, lists, and purges grants through the full service stack", async () => {
    // Create an integration first (grants reference integrations)
    await service.registerOwnerIntegration(TEST_OWNER, {
      key: "github",
      name: "GitHub",
      kind: "api",
      provider: "http",
      authStrategy: "bearer",
      enabled: true,
      fineGrainedPermissions: true,
      config: {},
      credentials: { accessToken: "ghp_test" },
      tools: {
        create_issue: {
          name: "create_issue",
          description: "Create a GitHub issue",
          enabled: false,
          accessMode: "approval_required",
          fineGrainedPermissions: true,
          defaultScopes: ["repo"],
          executionMode: "provider",
          config: {},
        },
      },
    });

    // Save a temporary grant
    const grant = {
      id: "grant-e2e-1",
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "github",
      toolName: "create_issue",
      scopes: ["repo"],
      grantedBy: "admin@test.com",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };

    await repo.saveTemporaryGrant(grant);

    const grants = await repo.listTemporaryGrants();
    expect(grants).toHaveLength(1);
    expect(grants[0]!.toolName).toBe("create_issue");

    // Purge should not remove active grants
    const purged = await repo.purgeExpiredGrants(new Date().toISOString());
    expect(purged).toBe(0);
    expect(await repo.listTemporaryGrants()).toHaveLength(1);
  });
});

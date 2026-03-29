/**
 * End-to-end tests for PostgresRepository using PGlite (in-process WASM Postgres).
 *
 * These tests exercise the real SQL schema, query logic, and JSONB round-trips
 * instead of the in-memory mock, catching issues that only surface with a real
 * Postgres-compatible backend.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestContext, type PgliteTestContext } from "./pglite-test-utils";

let ctx: PgliteTestContext;

// We mock `@neondatabase/serverless` so that PostgresRepository's `getSql()`
// returns our PGlite-backed sql function instead of hitting the network.
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ctx.sql,
}));

// Must import *after* vi.mock so the mock is active.
const { PostgresRepository } = await import("./postgres-repository");

beforeAll(async () => {
  vi.stubEnv("POSTGRES_URL", "pglite://e2e-test");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

let repo: InstanceType<typeof PostgresRepository>;

beforeEach(async () => {
  ctx = await createPgliteTestContext();
  repo = new PostgresRepository();
  await repo.ensureSchema();
});

afterEach(async () => {
  await ctx.close();
});

// ---------------------------------------------------------------------------
// Owner integrations
// ---------------------------------------------------------------------------
describe("owner integrations", () => {
  const ownerId = "user-1";

  it("upserts and retrieves an integration", async () => {
    const spec = {
      key: "slack",
      name: "Slack",
      kind: "api" as const,
      provider: "http" as const,
      authStrategy: "bearer" as const,
      enabled: true,
      fineGrainedPermissions: false,
      config: { baseUrl: "https://slack.com/api" },
      credentials: { accessToken: "xoxb-test" },
      functions: {},
    };

    await repo.upsertOwnerIntegration(ownerId, spec);

    const retrieved = await repo.getOwnerIntegration(ownerId, "slack");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.key).toBe("slack");
    expect(retrieved!.name).toBe("Slack");
    expect(retrieved!.config).toEqual({ baseUrl: "https://slack.com/api" });
    expect(retrieved!.credentials).toEqual({ accessToken: "xoxb-test" });
  });

  it("lists integrations sorted by key", async () => {
    const base = {
      kind: "api" as const,
      provider: "http" as const,
      authStrategy: "bearer" as const,
      enabled: true,
      fineGrainedPermissions: false,
      config: {},
      credentials: {},
      functions: {},
    };

    await repo.upsertOwnerIntegration(ownerId, { ...base, key: "notion", name: "Notion" });
    await repo.upsertOwnerIntegration(ownerId, { ...base, key: "github", name: "GitHub" });
    await repo.upsertOwnerIntegration(ownerId, { ...base, key: "slack", name: "Slack" });

    const list = await repo.listOwnerIntegrations(ownerId);
    expect(list.map((i) => i.key)).toEqual(["github", "notion", "slack"]);
  });

  it("isolates integrations per owner", async () => {
    const spec = {
      key: "shared-key",
      name: "Test",
      kind: "api" as const,
      provider: "http" as const,
      authStrategy: "none" as const,
      enabled: true,
      fineGrainedPermissions: false,
      config: {},
      credentials: {},
      functions: {},
    };

    await repo.upsertOwnerIntegration("alice", spec);
    await repo.upsertOwnerIntegration("bob", { ...spec, name: "Bob Test" });

    expect(await repo.getOwnerIntegration("alice", "shared-key")).toMatchObject({ name: "Test" });
    expect(await repo.getOwnerIntegration("bob", "shared-key")).toMatchObject({ name: "Bob Test" });
    expect(await repo.listOwnerIntegrations("charlie")).toEqual([]);
  });

  it("upserts (updates) existing integrations", async () => {
    const spec = {
      key: "notion",
      name: "Notion",
      kind: "api" as const,
      provider: "http" as const,
      authStrategy: "bearer" as const,
      enabled: true,
      fineGrainedPermissions: false,
      config: {},
      credentials: { accessToken: "v1" },
      functions: {},
    };

    await repo.upsertOwnerIntegration(ownerId, spec);
    await repo.upsertOwnerIntegration(ownerId, { ...spec, credentials: { accessToken: "v2" } });

    const retrieved = await repo.getOwnerIntegration(ownerId, "notion");
    expect(retrieved!.credentials).toEqual({ accessToken: "v2" });

    // Should still be a single record
    const list = await repo.listOwnerIntegrations(ownerId);
    expect(list).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Managed connectors
// ---------------------------------------------------------------------------
describe("managed connectors", () => {
  const now = new Date().toISOString();

  const makeConnector = (slug: string, overrides?: Partial<import("@/src/types/context-layer").ManagedConnectorRecord>) => ({
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `${slug} connector`,
    categories: ["test"],
    authModes: ["bearer" as const],
    authStrategy: "bearer" as const,
    credentialLabel: "Token",
    credentialPlaceholder: "Paste token",
    credentialHelp: "Help text",
    apiBaseUrl: `https://api.${slug}.com`,
    functions: [],
    enabled: true,
    createdAt: now,
    updatedAt: now,
    oauthConfigured: false,
    ...overrides,
  });

  it("upserts and retrieves a managed connector", async () => {
    const connector = makeConnector("elevenlabs", {
      authStrategy: "api_key",
      authModes: ["api_key"],
    });
    await repo.upsertManagedConnector(connector);

    const retrieved = await repo.getManagedConnector("elevenlabs");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.slug).toBe("elevenlabs");
    expect(retrieved!.authStrategy).toBe("api_key");
    expect(retrieved!.enabled).toBe(true);
  });

  it("lists all managed connectors sorted by slug", async () => {
    await repo.upsertManagedConnector(makeConnector("notion"));
    await repo.upsertManagedConnector(makeConnector("github"));
    await repo.upsertManagedConnector(makeConnector("slack"));

    const list = await repo.listManagedConnectors();
    expect(list.map((c) => c.slug)).toEqual(["github", "notion", "slack"]);
  });

  it("deletes a managed connector", async () => {
    await repo.upsertManagedConnector(makeConnector("temp"));
    expect(await repo.getManagedConnector("temp")).not.toBeNull();

    await repo.deleteManagedConnector("temp");
    expect(await repo.getManagedConnector("temp")).toBeNull();
  });

  it("round-trips JSONB fields (functions, categories, oauthConfig)", async () => {
    const connector = makeConnector("full", {
      categories: ["productivity", "ai"],
      functions: [
        {
          name: "search",
          description: "Search items",
          defaultScopes: ["read"],
          request: { method: "GET", path: "/search" },
        },
      ],
      oauthConfig: {
        authorizationUrl: "https://auth.example.com/authorize",
        tokenUrl: "https://auth.example.com/token",
        scopes: ["read", "write"],
      },
    });
    await repo.upsertManagedConnector(connector);

    const retrieved = await repo.getManagedConnector("full");
    expect(retrieved!.categories).toEqual(["productivity", "ai"]);
    expect(retrieved!.functions).toHaveLength(1);
    expect(retrieved!.functions[0]!.name).toBe("search");
    expect(retrieved!.oauthConfig?.authorizationUrl).toBe("https://auth.example.com/authorize");
  });
});

// ---------------------------------------------------------------------------
// Agent API keys
// ---------------------------------------------------------------------------
describe("agent API keys", () => {
  it("saves and finds an API key by owner and by value", async () => {
    const record = {
      ownerId: "user-1",
      apiKey: "ctx_test_key_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveAgentApiKey(record);

    const byOwner = await repo.getAgentApiKeyByOwner("user-1");
    expect(byOwner).not.toBeNull();
    expect(byOwner!.apiKey).toBe("ctx_test_key_123");

    const byKey = await repo.findAgentApiKey("ctx_test_key_123");
    expect(byKey).not.toBeNull();
    expect(byKey!.ownerId).toBe("user-1");
  });

  it("reports hasAgentApiKeys correctly", async () => {
    expect(await repo.hasAgentApiKeys()).toBe(false);

    await repo.saveAgentApiKey({
      ownerId: "user-1",
      apiKey: "ctx_key",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(await repo.hasAgentApiKeys()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// User API keys
// ---------------------------------------------------------------------------
describe("user API keys", () => {
  it("saves, finds, and deletes a hashed API key by owner and hash", async () => {
    const record = {
      ownerId: "user-1",
      apiKeyHash: "hash_123",
      keyPrefix: "clu_abc123",
      keySuffix: "z9yx",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveUserApiKey(record);

    const byOwner = await repo.getUserApiKeyByOwner("user-1");
    expect(byOwner).not.toBeNull();
    expect(byOwner!.apiKeyHash).toBe("hash_123");
    expect(byOwner!.keyPrefix).toBe("clu_abc123");
    expect(byOwner!.keySuffix).toBe("z9yx");

    const byHash = await repo.findUserApiKeyByHash("hash_123");
    expect(byHash).not.toBeNull();
    expect(byHash!.ownerId).toBe("user-1");

    await repo.deleteUserApiKey("user-1");
    expect(await repo.getUserApiKeyByOwner("user-1")).toBeNull();
    expect(await repo.findUserApiKeyByHash("hash_123")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Agent class policies
// ---------------------------------------------------------------------------
describe("agent class policies", () => {
  it("upserts and retrieves a policy", async () => {
    const policy = {
      agentClass: "researcher",
      rules: [
        {
          integrationKey: "github",
          functionNames: ["list_repos"],
          scopes: ["repo"],
          enabled: true,
        },
      ],
    };

    await repo.upsertPolicy(policy);
    const retrieved = await repo.getPolicy("researcher");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.rules).toHaveLength(1);
    expect(retrieved!.rules[0]!.integrationKey).toBe("github");
  });

  it("returns null for unknown agent class", async () => {
    expect(await repo.getPolicy("unknown")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Access requests
// ---------------------------------------------------------------------------
describe("access requests", () => {
  const makeRequest = (id: string) => ({
    id,
    agentId: "bot-1",
    agentClass: "researcher",
    integrationKey: "slack",
    functionName: "send_message",
    scopes: ["chat:write"],
    requestedMinutes: 60,
    channels: ["in_app" as const],
    notificationTargets: { email: "admin@test.com" },
    justification: "Need to post updates",
    createdAt: new Date().toISOString(),
    status: "pending" as const,
  });

  it("creates and lists access requests", async () => {
    await repo.createAccessRequest(makeRequest("req-1"));
    await repo.createAccessRequest(makeRequest("req-2"));

    const list = await repo.listAccessRequests();
    expect(list).toHaveLength(2);
  });

  it("retrieves a single access request", async () => {
    await repo.createAccessRequest(makeRequest("req-1"));
    const retrieved = await repo.getAccessRequest("req-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.functionName).toBe("send_message");
  });

  it("updates an access request", async () => {
    const req = makeRequest("req-1");
    await repo.createAccessRequest(req);
    await repo.updateAccessRequest({ ...req, status: "approved", decidedBy: "admin" });

    const updated = await repo.getAccessRequest("req-1");
    expect(updated!.status).toBe("approved");
    expect(updated!.decidedBy).toBe("admin");
  });
});

// ---------------------------------------------------------------------------
// Temporary grants
// ---------------------------------------------------------------------------
describe("temporary grants", () => {
  it("saves and lists temporary grants", async () => {
    const grant = {
      id: "grant-1",
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "github",
      functionName: "create_issue",
      scopes: ["repo"],
      grantedBy: "admin@test.com",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };

    await repo.saveTemporaryGrant(grant);
    const list = await repo.listTemporaryGrants();
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe("grant-1");
  });

  it("purges expired grants", async () => {
    const past = new Date(Date.now() - 3600_000).toISOString();
    const future = new Date(Date.now() + 3600_000).toISOString();

    await repo.saveTemporaryGrant({
      id: "expired",
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "github",
      functionName: "fn",
      scopes: [],
      grantedBy: "admin",
      createdAt: past,
      expiresAt: past,
    });

    await repo.saveTemporaryGrant({
      id: "active",
      agentId: "bot-1",
      agentClass: "researcher",
      integrationKey: "github",
      functionName: "fn",
      scopes: [],
      grantedBy: "admin",
      createdAt: new Date().toISOString(),
      expiresAt: future,
    });

    const purged = await repo.purgeExpiredGrants(new Date().toISOString());
    expect(purged).toBe(1);

    const remaining = await repo.listTemporaryGrants();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.id).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Integration connections
// ---------------------------------------------------------------------------
describe("integration connections", () => {
  const ownerId = "user-1";

  it("upserts and retrieves an integration connection", async () => {
    const record = {
      ownerId,
      integrationKey: "notion",
      provider: "notion",
      authStrategy: "oauth2" as const,
      encryptedCredentials: "encrypted_token_data",
      tokenType: "bearer",
      scopes: ["read", "write"],
      displayName: "My Notion",
      metadata: { workspaceName: "Test Workspace" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.upsertIntegrationConnection(record);

    const retrieved = await repo.getIntegrationConnection(ownerId, "notion");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.provider).toBe("notion");
    expect(retrieved!.scopes).toEqual(["read", "write"]);
    expect(retrieved!.metadata).toEqual({ workspaceName: "Test Workspace" });
  });

  it("lists connections for an owner", async () => {
    const base = {
      ownerId,
      provider: "test",
      authStrategy: "bearer" as const,
      encryptedCredentials: "enc",
      scopes: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.upsertIntegrationConnection({ ...base, integrationKey: "slack" });
    await repo.upsertIntegrationConnection({ ...base, integrationKey: "github" });

    const list = await repo.listIntegrationConnections(ownerId);
    expect(list).toHaveLength(2);
    expect(list.map((c) => c.integrationKey)).toEqual(["github", "slack"]);
  });
});

// ---------------------------------------------------------------------------
// OAuth state
// ---------------------------------------------------------------------------
describe("OAuth state", () => {
  it("saves, retrieves, and deletes OAuth state", async () => {
    const record = {
      state: "state-abc123",
      ownerId: "user-1",
      integrationKey: "notion",
      provider: "notion",
      codeVerifier: "verifier-xyz",
      redirectTo: "/integrations",
      redirectUri: "https://example.com/api/oauth/notion/callback",
      callbackUrl: "https://example.com/api/oauth/notion/callback",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    };

    await repo.saveOAuthState(record);

    const retrieved = await repo.getOAuthState("state-abc123");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.ownerId).toBe("user-1");
    expect(retrieved!.codeVerifier).toBe("verifier-xyz");
    expect(retrieved!.redirectUri).toBe("https://example.com/api/oauth/notion/callback");

    await repo.deleteOAuthState("state-abc123");
    expect(await repo.getOAuthState("state-abc123")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
describe("notifications", () => {
  it("creates and lists notifications", async () => {
    await repo.createNotification({
      id: "notif-1",
      channel: "in_app",
      recipient: "admin@test.com",
      subject: "New access request",
      body: "Bot-1 requested access to slack.send_message",
      metadata: { requestId: "req-1" },
      createdAt: new Date().toISOString(),
    });

    const list = await repo.listNotifications();
    expect(list).toHaveLength(1);
    expect(list[0]!.subject).toBe("New access request");
    expect(list[0]!.metadata).toEqual({ requestId: "req-1" });
  });
});

// ---------------------------------------------------------------------------
// Schema idempotency
// ---------------------------------------------------------------------------
describe("schema initialization", () => {
  it("is idempotent – calling ensureSchema twice does not error", async () => {
    // Schema was already initialized in beforeEach; calling again should be fine.
    await expect(repo.ensureSchema()).resolves.toBeUndefined();
  });
});

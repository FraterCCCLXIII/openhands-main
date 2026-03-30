import { createHash } from "node:crypto";

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import {
  AdapterRegistry,
  type IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import type { ContextRepository } from "@/src/lib/core/repository";
import { decryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { ContextLayerService } from "@/src/lib/core/service";
import type { IntegrationSpec } from "@/src/types/context-layer";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let testRepo: ContextRepository;
let testCleanup: () => Promise<void>;

beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://service-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testRepo = ctx.repository;
  testCleanup = ctx.cleanup;
});
afterEach(async () => {
  await testCleanup();
  vi.unstubAllGlobals();
});


const createService = (repository?: ContextRepository) => {
  const repo = repository ?? testRepo;
  const mockAdapter: IntegrationAdapter = {
    invoke: async ({ payload }) => ({ ok: true, payload }),
  };

  const service = new ContextLayerService(
    repo,
    new AdapterRegistry({
      composio: mockAdapter,
      mcp: mockAdapter,
      mock: mockAdapter,
    }),
    new NotificationPublisher(repo),
  );

  return service;
};

const OWNER_ID = "owner@example.com";

const baseIntegration: IntegrationSpec = {
  key: "salesforce",
  name: "Salesforce",
  kind: "api",
  provider: "composio",
  authStrategy: "bearer",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {
    accounts: {
      name: "accounts",
      description: "List accounts",
      enabled: true,
      fineGrainedPermissions: true,
      defaultScopes: ["accounts.read"],
      executionMode: "provider",
      config: {},
    },
  },
};

const installIntegration = async (
  service: ContextLayerService,
  integration: IntegrationSpec = baseIntegration,
  ownerId = OWNER_ID,
) => service.registerOwnerIntegration(ownerId, integration);

describe("ContextLayerService", () => {
  it("allows enabled functions when no agent-class policy exists", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    const response = await service.invokeContext(
      "agent-1",
      "assistant",
      "salesforce",
      "accounts",
      { limit: 5 },
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    expect(response.integration).toBe("salesforce");
    expect(response.decision.allowed).toBe(true);
    expect(response.decision.reason).toBe("Allowed by enabled function default");
    expect(response.data).toEqual({ ok: true, payload: { limit: 5 } });
  });

  it("allows context invocation through agent-class policies", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        functionNames: ["accounts"],
        scopes: ["accounts.read"],
        enabled: true,
      },
    ]);

    const response = await service.invokeContext(
      "agent-1",
      "assistant",
      "salesforce",
      "accounts",
      { limit: 5 },
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    expect(response.integration).toBe("salesforce");
    expect(response.decision.allowed).toBe(true);
    expect(response.data).toEqual({ ok: true, payload: { limit: 5 } });
  });

  it("records successful invocation metadata and exposes usage summaries", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    await service.invokeContext(
      "agent-usage",
      "assistant",
      "salesforce",
      "accounts",
      { limit: 5, q: "acme" },
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    const sql = getActiveSql();
    const rows = await sql`SELECT * FROM tool_invocations ORDER BY invoked_at ASC`;
    const row = rows[0] as Record<string, unknown>;
    const parseField = <T,>(value: unknown) =>
      typeof value === "string" ? (JSON.parse(value) as T) : (value as T);

    expect(rows).toHaveLength(1);
    expect(row.owner_id).toBe(OWNER_ID);
    expect(row.agent_id).toBe("agent-usage");
    expect(row.agent_class).toBe("assistant");
    expect(row.integration_key).toBe("salesforce");
    expect(row.function_name).toBe("accounts");
    expect(row.provider).toBe("composio");
    expect(row.kind).toBe("api");
    expect(row.auth_strategy).toBe("bearer");
    expect(row.outcome).toBe("success");
    expect(parseField<string[]>(row.scopes)).toEqual(["accounts.read"]);
    expect(parseField<string[]>(row.payload_keys)).toEqual(["limit", "q"]);
    expect(row.error_message).toBeNull();

    const integrations = await service.listOwnerIntegrationsWithUsage(OWNER_ID);
    expect(integrations[0]?.functions.accounts).toMatchObject({
      invocationCount: 1,
      lastInvocationOutcome: "success",
    });
    expect(integrations[0]?.functions.accounts.lastInvokedAt).toBeTruthy();
  });

  it("records denied invocation metadata for approval-required functions", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      ...baseIntegration,
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          accessMode: "approval_required",
        },
      },
    });

    await expect(
      service.invokeContext(
        "agent-denied",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Permission required");

    const sql = getActiveSql();
    const rows = await sql`SELECT * FROM tool_invocations ORDER BY invoked_at ASC`;
    const row = rows[0] as Record<string, unknown>;

    expect(rows).toHaveLength(1);
    expect(row.outcome).toBe("denied");
    expect(row.error_message).toBe("Permission required");

    const integrations = await service.listOwnerIntegrationsWithUsage(OWNER_ID);
    expect(integrations[0]?.functions.accounts).toMatchObject({
      invocationCount: 1,
      lastInvocationOutcome: "denied",
    });
  });

  it("returns successful results even when invocation tracking fails", async () => {
    const repository = Object.create(testRepo) as ContextRepository;
    const trackingError = new Error("telemetry unavailable");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    repository.createToolInvocation = vi.fn(async () => {
      throw trackingError;
    });

    const service = createService(repository);
    await installIntegration(service, baseIntegration);

    const response = await service.invokeContext(
      "agent-success-logging-failure",
      "assistant",
      "salesforce",
      "accounts",
      { limit: 5 },
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    expect(response.data).toEqual({ ok: true, payload: { limit: 5 } });
    expect(repository.createToolInvocation).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("record a successful tool invocation"),
    );
  });

  it("preserves permission-denied behavior when access-request side effects fail", async () => {
    const repository = Object.create(testRepo) as ContextRepository;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    repository.createAccessRequest = vi.fn(async () => {
      throw new Error("access request unavailable");
    });
    repository.createToolInvocation = vi.fn(async () => {
      throw new Error("telemetry unavailable");
    });

    const service = createService(repository);
    await installIntegration(service, {
      ...baseIntegration,
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          accessMode: "approval_required",
        },
      },
    });

    await expect(
      service.invokeContext(
        "agent-denied-side-effect-failure",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Permission required");

    const warningMessages = warnSpy.mock.calls.map(([message]) => String(message)).join("\n");
    expect(warningMessages).toContain("create a pending access request");
    expect(warningMessages).toContain("record a denied tool invocation");
  });

  it("preserves adapter errors when failed-invocation tracking also fails", async () => {
    const repository = Object.create(testRepo) as ContextRepository;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    repository.createToolInvocation = vi.fn(async () => {
      throw new Error("telemetry unavailable");
    });

    const failingAdapter: IntegrationAdapter = {
      invoke: async () => {
        throw new Error("adapter boom");
      },
    };
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: failingAdapter,
        mcp: failingAdapter,
        mock: failingAdapter,
      }),
      new NotificationPublisher(repository),
    );
    await installIntegration(service, baseIntegration);

    await expect(
      service.invokeContext(
        "agent-error-logging-failure",
        "assistant",
        "salesforce",
        "accounts",
        { limit: 1 },
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("adapter boom");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("record a failed tool invocation"),
    );
  });


  it("blocks disabled functions", async () => {
    const service = createService();
    await installIntegration(service, {
      ...baseIntegration,
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          enabled: false,
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        functionNames: ["accounts"],
        scopes: ["accounts.read"],
        enabled: true,
      },
    ]);

    await expect(
      service.invokeContext(
        "agent-1",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Function disabled");
  });

  it("updates owner-scoped function access modes and syncs enabled state", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    const approvalRequired = await service.setOwnerFunctionAccessMode(
      OWNER_ID,
      "salesforce",
      "accounts",
      "approval_required",
    );
    expect(approvalRequired.accessMode).toBe("approval_required");
    expect(approvalRequired.enabled).toBe(true);

    const disabled = await service.setOwnerFunctionAccessMode(
      OWNER_ID,
      "salesforce",
      "accounts",
      "disabled",
    );
    expect(disabled.accessMode).toBe("disabled");
    expect(disabled.enabled).toBe(false);

    const restored = await service.setOwnerFunctionAccessMode(
      OWNER_ID,
      "salesforce",
      "accounts",
      "enabled",
    );
    expect(restored.accessMode).toBe("enabled");
    expect(restored.enabled).toBe(true);
  });

  it("applies managed connector ceilings and injects indexed tools into user integrations", async () => {
    const service = createService();
    const timestamp = new Date().toISOString();

    await testRepo.upsertManagedConnector({
      slug: "salesforce",
      name: "Salesforce",
      description: "Managed Salesforce connector",
      categories: ["CRM"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      credentialLabel: "Salesforce token",
      credentialPlaceholder: "Paste your Salesforce token",
      credentialHelp: "Token used for Salesforce access.",
      serverUrl: "https://salesforce.example.com/mcp",
      functions: [
        {
          name: "accounts",
          description: "List accounts",
          defaultScopes: ["accounts.read"],
          accessMode: "approval_required",
          config: {
            toolName: "accounts",
          },
        },
        {
          name: "reports",
          description: "List reports",
          defaultScopes: ["reports.read"],
          accessMode: "disabled",
          config: {
            toolName: "reports",
          },
        },
      ],
      enabled: true,
      oauthConfigured: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await service.registerOwnerIntegration(OWNER_ID, {
      ...baseIntegration,
      config: {
        builtInSlug: "salesforce",
        managedConnectorSlug: "salesforce",
      },
    });

    const integrations = await service.listOwnerIntegrations(OWNER_ID);
    expect(integrations[0]?.functions.accounts).toMatchObject({
      accessMode: "approval_required",
      maxAccessMode: "approval_required",
      enabled: true,
    });
    expect(integrations[0]?.functions.reports).toMatchObject({
      accessMode: "disabled",
      maxAccessMode: "disabled",
      enabled: false,
    });

    await expect(
      service.setOwnerFunctionAccessMode(OWNER_ID, "salesforce", "accounts", "enabled"),
    ).rejects.toThrow(
      "Function 'accounts' cannot exceed the organization-managed 'approval_required' access level.",
    );
  });


  it("requires temporary approval for case-by-case functions", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      ...baseIntegration,
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          accessMode: "approval_required",
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        functionNames: ["accounts"],
        scopes: ["accounts.read"],
        enabled: true,
      },
    ]);

    await expect(
      service.invokeContext(
        "agent-4",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Permission required");

    const pendingRequests = await repository.listAccessRequests();
    expect(pendingRequests).toHaveLength(1);
    expect(pendingRequests[0]).toMatchObject({
      agentId: "agent-4",
      agentClass: "assistant",
      integrationKey: "salesforce",
      functionName: "accounts",
      scopes: ["accounts.read"],
      requestedMinutes: 240,
      status: "pending",
    });
    expect(pendingRequests[0]?.channels).toEqual(["in_app"]);

    await service.approveAccessRequest(pendingRequests[0]!.id, "human-1", 30);

    const response = await service.invokeContext(
      "agent-4",
      "assistant",
      "salesforce",
      "accounts",
      {},
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    expect(response.decision.reason).toBe("Allowed by temporary approval");
  });

  it("creates notifications for multiple channels when access is requested", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );
    await installIntegration(service, baseIntegration);

    await service.createAccessRequest({
      agentId: "agent-2",
      agentClass: "reviewer",
      integrationKey: "salesforce",
      functionName: "accounts",
      scopes: ["accounts.read"],
      requestedMinutes: 45,
      channels: ["email", "sms", "in_app"],
      notificationTargets: {
        email: "owner@example.com",
        sms: "+15551234567",
        in_app: "ops-inbox",
      },
      justification: "Need temporary access",
    });

    const notifications = await repository.listNotifications();
    expect(notifications.map((item) => item.channel).sort()).toEqual([
      "email",
      "in_app",
      "sms",
    ]);
    expect(new Set(notifications.map((item) => item.recipient))).toEqual(
      new Set(["owner@example.com", "+15551234567", "ops-inbox"]),
    );
  });

  it("grants temporary access until expiry for case-by-case functions", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );
    await installIntegration(service, {
      ...baseIntegration,
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          accessMode: "approval_required",
        },
      },
    });

    const request = await service.createAccessRequest({
      agentId: "agent-3",
      agentClass: "writer",
      integrationKey: "salesforce",
      functionName: "accounts",
      scopes: ["accounts.read"],
      requestedMinutes: 15,
      channels: [],
      notificationTargets: {},
      justification: "Need access",
    });

    await service.approveAccessRequest(request.id, "human-1", 15);

    const allowed = await service.invokeContext(
      "agent-3",
      "writer",
      "salesforce",
      "accounts",
      {},
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );
    expect(allowed.decision.allowed).toBe(true);
    expect(allowed.decision.reason).toBe("Allowed by temporary approval");

    const grant = (await repository.listTemporaryGrants())[0];
    grant.expiresAt = new Date(Date.now() - 60_000).toISOString();
    await repository.saveTemporaryGrant(grant);

    await expect(
      service.invokeContext(
        "agent-3",
        "writer",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Permission required");
  });

  it("routes mock execution through the adapter registry", async () => {
    const service = createService();
    await installIntegration(service, {
      ...baseIntegration,
      provider: "mock",
      functions: {
        accounts: {
          ...baseIntegration.functions.accounts,
          executionMode: "mock",
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        functionNames: ["accounts"],
        scopes: ["accounts.read"],
        enabled: true,
      },
    ]);

    const response = await service.invokeContext(
      "agent-9",
      "assistant",
      "salesforce",
      "accounts",
      { q: "hello" },
      ["accounts.read"],
      { ownerId: OWNER_ID },
    );

    expect(response.provider).toBe("mock");
    expect(response.data).toEqual({ ok: true, payload: { q: "hello" } });
  });

  it("provisions stable per-user context API keys", async () => {
    const service = createService();

    const first = await service.getOrCreateAgentApiKey("Owner@Example.com");
    const second = await service.getOrCreateAgentApiKey("owner@example.com");

    expect(first.ownerId).toBe("owner@example.com");
    expect(second.apiKey).toBe(first.apiKey);
    expect(await service.hasStoredAgentApiKeys()).toBe(true);
    expect(await service.isStoredAgentApiKeyAuthorized(first.apiKey)).toBe(true);
    expect(await service.isStoredAgentApiKeyAuthorized("not-a-real-key")).toBe(false);
  });

  it("rotates and revokes user API keys with hashed auth and encrypted recovery", async () => {
    const service = createService();

    const first = await service.rotateUserApiKey("Owner@Example.com");
    const storedFirst = await testRepo.getUserApiKeyByOwner("owner@example.com");

    expect(first.apiKey.startsWith("clu_")).toBe(true);
    expect(storedFirst).not.toBeNull();
    expect(storedFirst?.apiKeyHash).not.toBe(first.apiKey);
    expect(storedFirst?.encryptedApiKey).toBeTruthy();
    expect(storedFirst?.encryptedApiKey).not.toBe(first.apiKey);
    expect(storedFirst?.keyPrefix).toBe(first.key.keyPrefix);
    expect(storedFirst?.keySuffix).toBe(first.key.keySuffix);
    expect(await service.getStoredUserApiKey(first.apiKey)).toMatchObject({
      ownerId: "owner@example.com",
    });
    expect(await service.getUserApiKeyStatus("owner@example.com")).toEqual(first.key);
    expect(await service.getUserApiKeyValue("owner@example.com")).toBe(first.apiKey);

    const second = await service.rotateUserApiKey("owner@example.com");
    const storedSecond = await testRepo.getUserApiKeyByOwner("owner@example.com");

    expect(second.apiKey).not.toBe(first.apiKey);
    expect(second.key.createdAt).toBe(first.key.createdAt);
    expect(second.key.updatedAt).not.toBe(first.key.updatedAt);
    expect(storedSecond?.apiKeyHash).not.toBe(storedFirst?.apiKeyHash);
    expect(storedSecond?.encryptedApiKey).not.toBe(storedFirst?.encryptedApiKey);
    expect(await service.getStoredUserApiKey(first.apiKey)).toBeNull();
    expect(await service.getStoredUserApiKey(second.apiKey)).toMatchObject({
      ownerId: "owner@example.com",
    });
    expect(await service.getUserApiKeyValue("owner@example.com")).toBe(second.apiKey);

    expect(await service.revokeUserApiKey("owner@example.com")).toEqual({
      revoked: true,
    });
    expect(await service.getStoredUserApiKey(second.apiKey)).toBeNull();
    expect(await service.getUserApiKeyStatus("owner@example.com")).toBeNull();
    expect(await service.getUserApiKeyValue("owner@example.com")).toBeNull();
    expect(await service.revokeUserApiKey("owner@example.com")).toEqual({
      revoked: false,
    });
  });

  it("returns null for unknown user API keys", async () => {
    const service = createService();

    expect(await service.getStoredUserApiKey("not-a-real-user-key")).toBeNull();
  });


  it("rotates and revokes admin API keys with hashed auth and encrypted recovery", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = createService();

    const first = await service.rotateAdminApiKey("Admin@Example.com");
    const storedFirst = await testRepo.getAdminApiKeyByOwner("admin@example.com");

    expect(first.apiKey.startsWith("clad_")).toBe(true);
    expect(storedFirst).not.toBeNull();
    expect(storedFirst?.apiKeyHash).not.toBe(first.apiKey);
    expect(storedFirst?.encryptedApiKey).toBeTruthy();
    expect(storedFirst?.encryptedApiKey).not.toBe(first.apiKey);
    expect(storedFirst?.keyPrefix).toBe(first.key.keyPrefix);
    expect(storedFirst?.keySuffix).toBe(first.key.keySuffix);
    expect(await service.getStoredAdminApiKey(first.apiKey)).toMatchObject({
      ownerId: "admin@example.com",
    });
    expect(await service.getAdminApiKeyStatus("admin@example.com")).toEqual(first.key);
    expect(await service.getAdminApiKeyValue("admin@example.com")).toBe(first.apiKey);

    const second = await service.rotateAdminApiKey("admin@example.com");
    const storedSecond = await testRepo.getAdminApiKeyByOwner("admin@example.com");

    expect(second.apiKey).not.toBe(first.apiKey);
    expect(second.key.createdAt).toBe(first.key.createdAt);
    expect(second.key.updatedAt).not.toBe(first.key.updatedAt);
    expect(storedSecond?.apiKeyHash).not.toBe(storedFirst?.apiKeyHash);
    expect(storedSecond?.encryptedApiKey).not.toBe(storedFirst?.encryptedApiKey);
    expect(await service.getStoredAdminApiKey(first.apiKey)).toBeNull();
    expect(await service.getStoredAdminApiKey(second.apiKey)).toMatchObject({
      ownerId: "admin@example.com",
    });
    expect(await service.getAdminApiKeyValue("admin@example.com")).toBe(second.apiKey);

    expect(await service.revokeAdminApiKey("admin@example.com")).toEqual({
      revoked: true,
    });
    expect(await service.getStoredAdminApiKey(second.apiKey)).toBeNull();
    expect(await service.getAdminApiKeyStatus("admin@example.com")).toBeNull();
    expect(await service.getAdminApiKeyValue("admin@example.com")).toBeNull();
    expect(await service.revokeAdminApiKey("admin@example.com")).toEqual({
      revoked: false,
    });
  });

  it("returns null for unknown admin API keys", async () => {
    const service = createService();

    expect(await service.getStoredAdminApiKey("not-a-real-admin-key")).toBeNull();
  });

  it("rejects admin API key issuance and recovery for non-admin owners", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = createService();
    const seededApiKey = "clad_seeded_non_admin_key_value";
    const timestamp = new Date().toISOString();

    await testRepo.saveAdminApiKey({
      ownerId: OWNER_ID,
      apiKeyHash: createHash("sha256").update(seededApiKey).digest("hex"),
      keyPrefix: seededApiKey.slice(0, 12),
      keySuffix: seededApiKey.slice(-4),
      encryptedApiKey: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await expect(service.rotateAdminApiKey(OWNER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(service.getAdminApiKeyStatus(OWNER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(service.getAdminApiKeyValue(OWNER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(service.revokeAdminApiKey(OWNER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(await service.getStoredAdminApiKey(seededApiKey)).toBeNull();
  });

  it("requires OAuth client credentials when first registering an OAuth managed connector", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );

    await expect(
      service.upsertManagedConnector({
        slug: "notion",
        name: "Notion",
        description: "Managed Notion MCP",
        categories: ["Knowledge base"],
        authStrategy: "oauth2",
        authModes: ["oauth2"],
        provider: "mcp",
        credentialLabel: "Connect Notion",
        credentialPlaceholder: "Connect Notion",
        credentialHelp: "Connect Notion with OAuth.",
        serverUrl: "https://mcp.notion.com/mcp",
        oauthConfig: {
          authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
          tokenUrl: "https://api.notion.com/v1/oauth/token",
          scopes: [],
        },
        functions: [],
        enabled: true,
      }),
    ).rejects.toThrow(
      "New OAuth-managed connectors require both oauthClientId and oauthClientSecret.",
    );
  });

  it("auto-registers public MCP OAuth clients for Webflow-style connectors", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          client_id: "webflow-mcp-client-id",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const connector = await service.upsertManagedConnector({
      slug: "webflow",
      name: "Webflow",
      description: "Managed Webflow MCP connector",
      categories: ["CMS", "Marketing"],
      authStrategy: "oauth2",
      authModes: ["oauth2"],
      provider: "mcp",
      credentialLabel: "Connect Webflow",
      credentialPlaceholder: "Connect Webflow",
      credentialHelp: "Connect Webflow with OAuth.",
      serverUrl: "https://mcp.webflow.com/mcp",
      oauthConfig: {
        authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
        tokenUrl: "https://mcp.webflow.com/oauth/token",
        registrationUrl: "https://mcp.webflow.com/oauth/register",
        clientAuthentication: "none",
        pkce: true,
        scopes: [],
      },
      functions: [],
      enabled: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://mcp.webflow.com/oauth/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(connector.oauthConfigured).toBe(true);

    const stored = await repository.getManagedConnector("webflow");
    expect(stored?.encryptedOAuthClient).toBeTruthy();
    expect(
      decryptCredentials<{ clientId?: string; clientSecret?: string }>(
        stored!.encryptedOAuthClient!,
      ),
    ).toEqual({ clientId: "webflow-mcp-client-id" });
  });

  it("generates managed HTTP connector functions from an OpenAPI schema during registration", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            openapi: "3.1.0",
            security: [{ bearerAuth: [] }],
            components: {
              parameters: {
                notionVersion: {
                  name: "Notion-Version",
                  in: "header",
                  required: true,
                  schema: { enum: ["2026-03-11"] },
                },
              },
            },
            paths: {
              "/v1/search": {
                post: {
                  operationId: "post-search",
                  summary: "Search workspace",
                  parameters: [{ $ref: "#/components/parameters/notionVersion" }],
                  requestBody: {
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            query: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const connector = await service.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Managed Notion REST connector",
      categories: ["Knowledge base"],
      authStrategy: "oauth2",
      authModes: ["oauth2"],
      provider: "http",
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Connect Notion with OAuth.",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfig: {
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: [],
      },
      oauthClientId: "notion-client-id",
      oauthClientSecret: "notion-client-secret",
      functions: [],
      enabled: true,
    });

    expect(connector).toMatchObject({
      slug: "notion",
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfigured: true,
      functions: [
        {
          name: "post_search",
          request: {
            method: "POST",
            path: "/v1/search",
            headers: {
              "Notion-Version": "2026-03-11",
            },
            body: "{{body}}",
            contentType: "json",
          },
        },
      ],
    });
  });

  it("deletes an existing managed connector", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );

    await service.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Managed Notion REST connector",
      categories: ["Knowledge base"],
      authStrategy: "oauth2",
      authModes: ["oauth2"],
      provider: "http",
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Connect Notion with OAuth.",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfig: {
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: [],
      },
      oauthClientId: "notion-client-id",
      oauthClientSecret: "notion-client-secret",
      functions: [],
      enabled: true,
    });

    await expect(service.deleteManagedConnector("notion")).resolves.toEqual({
      deleted: true,
      slug: "notion",
    });
    await expect(repository.getManagedConnector("notion")).resolves.toBeNull();
  });



  it("injects saved per-user OAuth credentials during invocation", async () => {
    const repository = testRepo;
    const mcpInvoke = vi.fn(async ({ integration }) => integration.credentials);
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        mcp: { invoke: mcpInvoke },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      key: "notion",
      name: "Notion",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: { builtInSlug: "notion" },
      credentials: {},
      functions: {
        search: {
          name: "search",
          description: "Search Notion",
          enabled: true,
          fineGrainedPermissions: true,
          defaultScopes: ["read"],
          executionMode: "provider",
          config: {},
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "notion",
        functionNames: ["search"],
        scopes: ["read"],
        enabled: true,
      },
    ]);
    await service.saveOAuthConnection(
      "owner@example.com",
      "notion",
      "notion",
      {
        accessToken: "user-access-token",
        refreshToken: "user-refresh-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        externalAccountId: "bot_123",
        externalWorkspaceId: "workspace_123",
        displayName: "Team Wiki",
        metadata: {},
      },
    );

    const response = await service.invokeContext(
      "agent-11",
      "assistant",
      "notion",
      "search",
      { query: "docs" },
      ["read"],
      { ownerId: "owner@example.com" },
    );

    expect(mcpInvoke).toHaveBeenCalledTimes(1);
    expect(response.data).toEqual({
      accessToken: "user-access-token",
      refreshToken: "user-refresh-token",
    });
  });

  it("invokes managed HTTP connectors with stored OAuth credentials", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        http: new HttpAdapter(),
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      key: "acme-crm",
      name: "Acme CRM",
      kind: "api",
      provider: "http",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: {
        builtInSlug: "acme-crm",
        apiBaseUrl: "https://api.acme.test/v1",
        managedConnectorSlug: "acme-crm",
      },
      credentials: {},
      functions: {
        get_contact: {
          name: "get_contact",
          description: "Get a contact",
          enabled: true,
          fineGrainedPermissions: true,
          defaultScopes: ["contacts.read"],
          executionMode: "provider",
          config: {
            request: {
              method: "GET",
              path: "/contacts/{{contactId}}",
              query: {
                include: "{{include}}",
              },
            },
          },
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "acme-crm",
        functionNames: ["get_contact"],
        scopes: ["contacts.read"],
        enabled: true,
      },
    ]);
    await service.saveOAuthConnection(
      "owner@example.com",
      "acme-crm",
      "acme-crm",
      {
        accessToken: "managed-access-token",
        refreshToken: "managed-refresh-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["contacts.read"],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        metadata: {},
      },
    );

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "contact_123", name: "Ada" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await service.invokeContext(
      "agent-12",
      "assistant",
      "acme-crm",
      "get_contact",
      {
        contactId: "contact_123",
        include: "notes",
      },
      ["contacts.read"],
      { ownerId: "owner@example.com" },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://api.acme.test/v1/contacts/contact_123?include=notes",
    );
    expect(init.headers).toMatchObject({
      Authorization: "Bearer managed-access-token",
    });
    expect(response.data).toEqual({ id: "contact_123", name: "Ada" });
  });

  it("rejects owner integrations with embedded OAuth credentials", async () => {
    const service = createService();

    await expect(
      service.registerOwnerIntegration(OWNER_ID, {
        ...baseIntegration,
        authStrategy: "oauth2",
        credentials: { accessToken: "owner-token" },
      }),
    ).rejects.toThrow(
      "OAuth integrations cannot store credentials directly. Save per-user OAuth connections instead.",
    );
  });

  it("requires an explicit owner install before owner mutations", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );

    await expect(
      service.setOwnerIntegrationEnabled(OWNER_ID, "slack", true),
    ).rejects.toThrow(
      "Integration 'slack' is not installed for this user. Install it from the integrations wizard first.",
    );
    await expect(repository.getOwnerIntegration(OWNER_ID, "slack")).resolves.toBeNull();
  });

  it("requires a personal OAuth connection before invoking an installed OAuth integration", async () => {
    const repository = testRepo;
    const mcpInvoke = vi.fn(async ({ integration }) => integration.credentials);
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        mcp: { invoke: mcpInvoke },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      key: "notion",
      name: "Notion",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: { serverUrl: "https://mcp.notion.com/mcp" },
      credentials: {},
      functions: {
        search: {
          name: "search",
          description: "Search Notion",
          enabled: true,
          fineGrainedPermissions: true,
          defaultScopes: ["read"],
          executionMode: "provider",
          config: {},
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "notion",
        functionNames: ["search"],
        scopes: ["read"],
        enabled: true,
      },
    ]);

    await expect(
      service.invokeContext(
        "agent-13",
        "assistant",
        "notion",
        "search",
        { query: "docs" },
        ["read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow(
      "Connect Notion for this user before invoking 'notion'.",
    );
    expect(mcpInvoke).not.toHaveBeenCalled();
  });

});

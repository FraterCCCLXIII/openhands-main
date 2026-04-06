import { createHash } from "node:crypto";

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import {
  AdapterRegistry,
  type IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import type { ContextRepository } from "@/src/lib/core/repository";
import { ContextLayerService } from "@/src/lib/core/service";
import {
  createToolInvocationRecord,
} from "@/src/lib/core/invocation-side-effects";
import {
  encryptScopedApiKey,
  getScopedApiKeyPrefix,
  hashScopedApiKey,
} from "@/src/lib/core/scoped-api-keys";
import { decryptCredentials } from "@/src/lib/credential-crypto";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import * as discoveryModule from "@/src/lib/integrations/discovery";
import * as providerResolverModule from "@/src/lib/oauth/provider-resolver";
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
  vi.restoreAllMocks();
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
      http: mockAdapter,
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
  provider: "http",
  authStrategy: "bearer",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  tools: {
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

const baseAccountsTool = baseIntegration.tools["accounts"];
if (!baseAccountsTool) {
  throw new Error("Missing accounts tool test fixture");
}

const getOnlyIntegration = (integrations: IntegrationSpec[]) => {
  expect(integrations).toHaveLength(1);
  const [integration] = integrations;
  if (!integration) {
    throw new Error("Expected a single integration result");
  }

  return integration;
};

const installIntegration = async (
  service: ContextLayerService,
  integration: IntegrationSpec = baseIntegration,
  ownerId = OWNER_ID,
) => service.registerOwnerIntegration(ownerId, integration);

describe("ContextLayerService", () => {
  it("allows enabled tools when no agent-class policy exists", async () => {
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
    expect(response.decision.reason).toBe("Allowed by enabled tool default");
    expect(response.data).toEqual({ ok: true, payload: { limit: 5 } });
  });

  it("allows context invocation through agent-class policies", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        toolNames: ["accounts"],
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

  it("supports object-form access evaluation and invocation requests", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    const decision = await service.evaluateAccess({
      agentId: "agent-object",
      agentClass: "assistant",
      integrationKey: "salesforce",
      toolName: "accounts",
      requestedScopes: ["accounts.read"],
      ownerId: OWNER_ID,
    });

    expect(decision).toMatchObject({
      allowed: true,
      reason: "Allowed by enabled tool default",
      effectiveScopes: ["accounts.read"],
    });

    const response = await service.invokeContext({
      agentId: "agent-object",
      agentClass: "assistant",
      integrationKey: "salesforce",
      toolName: "accounts",
      payload: { limit: 2 },
      requestedScopes: ["accounts.read"],
      ownerId: OWNER_ID,
    });

    expect(response.integration).toBe("salesforce");
    expect(response.decision.allowed).toBe(true);
    expect(response.data).toEqual({ ok: true, payload: { limit: 2 } });
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
    expect(row.provider).toBe("http");
    expect(row.kind).toBe("api");
    expect(row.auth_strategy).toBe("bearer");
    expect(row.outcome).toBe("success");
    expect(parseField<string[]>(row.scopes)).toEqual(["accounts.read"]);
    expect(parseField<string[]>(row.payload_keys)).toEqual(["limit", "q"]);
    expect(row.error_message).toBeNull();

    const integrations = await service.listOwnerIntegrationsWithUsage(OWNER_ID);
    const savedIntegration = getOnlyIntegration(integrations);
    expect(savedIntegration.tools["accounts"]).toMatchObject({
      invocationCount: 1,
      lastInvocationOutcome: "success",
    });
    expect(savedIntegration.tools["accounts"]?.lastInvokedAt).toBeTruthy();
  });

  it("records denied invocation metadata for approval-required functions", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        http: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      ...baseIntegration,
      tools: {
        accounts: {
          ...baseAccountsTool,
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
    const savedIntegration = getOnlyIntegration(integrations);
    expect(savedIntegration.tools["accounts"]).toMatchObject({
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
      tools: {
        accounts: {
          ...baseAccountsTool,
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
        http: failingAdapter,
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
      tools: {
        accounts: {
          ...baseAccountsTool,
          enabled: false,
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        toolNames: ["accounts"],
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
    ).rejects.toThrow("Tool disabled");
  });

  it("updates owner-scoped function access modes and syncs enabled state", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    const approvalRequired = await service.setOwnerToolAccessMode(
      OWNER_ID,
      "salesforce",
      "accounts",
      "approval_required",
    );
    expect(approvalRequired.accessMode).toBe("approval_required");
    expect(approvalRequired.enabled).toBe(true);

    const disabled = await service.setOwnerToolAccessMode(
      OWNER_ID,
      "salesforce",
      "accounts",
      "disabled",
    );
    expect(disabled.accessMode).toBe("disabled");
    expect(disabled.enabled).toBe(false);

    const restored = await service.setOwnerToolAccessMode(
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
      tools: [
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
    const savedIntegration = getOnlyIntegration(integrations);
    expect(savedIntegration.tools["accounts"]).toMatchObject({
      accessMode: "approval_required",
      maxAccessMode: "approval_required",
      enabled: true,
    });
    expect(savedIntegration.tools["reports"]).toMatchObject({
      accessMode: "disabled",
      maxAccessMode: "disabled",
      enabled: false,
    });

    await expect(
      service.setOwnerToolAccessMode(OWNER_ID, "salesforce", "accounts", "enabled"),
    ).rejects.toThrow(
      "Tool 'accounts' cannot exceed the organization-managed 'approval_required' access level.",
    );
  });


  it("requires temporary approval for case-by-case tools", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        http: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      ...baseIntegration,
      tools: {
        accounts: {
          ...baseAccountsTool,
          accessMode: "approval_required",
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        toolNames: ["accounts"],
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
        {
          ownerId: OWNER_ID,
          agentData: {
            conversationLink:
              "https://app.all-hands.dev/conversations/f3e731620cf147a1976b53050bbe039e",
          },
        },
      ),
    ).rejects.toThrow("Permission required");

    const pendingRequests = await repository.listAccessRequests();
    expect(pendingRequests).toHaveLength(1);
    expect(pendingRequests[0]).toMatchObject({
      agentId: "agent-4",
      agentClass: "assistant",
      integrationKey: "salesforce",
      toolName: "accounts",
      scopes: ["accounts.read"],
      requestedMinutes: 240,
      status: "pending",
      justification: "",
      agentData: {
        conversationLink:
          "https://app.all-hands.dev/conversations/f3e731620cf147a1976b53050bbe039e",
      },
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


  it("updates an existing pending access request when richer agent data arrives later", async () => {
    const repository = testRepo;
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ http: { invoke: async () => ({ ok: true }) } }),
      new NotificationPublisher(repository),
    );
    await installIntegration(service, {
      ...baseIntegration,
      tools: {
        accounts: {
          ...baseAccountsTool,
          accessMode: "approval_required",
        },
      },
    });

    await expect(
      service.invokeContext(
        "agent-5",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Permission required");

    await expect(
      service.invokeContext(
        "agent-5",
        "assistant",
        "salesforce",
        "accounts",
        {},
        ["accounts.read"],
        {
          ownerId: OWNER_ID,
          agentData: {
            conversationLink:
              "https://app.all-hands.dev/conversations/updated-session-context",
          },
        },
      ),
    ).rejects.toThrow("Permission required");

    await expect(repository.listAccessRequests()).resolves.toMatchObject([
      {
        agentId: "agent-5",
        toolName: "accounts",
        agentData: {
          conversationLink:
            "https://app.all-hands.dev/conversations/updated-session-context",
        },
      },
    ]);
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
      toolName: "accounts",
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
        http: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );
    await installIntegration(service, {
      ...baseIntegration,
      tools: {
        accounts: {
          ...baseAccountsTool,
          accessMode: "approval_required",
        },
      },
    });

    const request = await service.createAccessRequest({
      agentId: "agent-3",
      agentClass: "writer",
      integrationKey: "salesforce",
      toolName: "accounts",
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
    expect(grant).toBeDefined();
    if (!grant) {
      throw new Error("Expected a temporary grant");
    }
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
      tools: {
        accounts: {
          ...baseAccountsTool,
          executionMode: "mock",
        },
      },
    });
    await service.upsertAgentPolicy("assistant", [
      {
        integrationKey: "salesforce",
        toolNames: ["accounts"],
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
        tools: [],
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
      tools: [],
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

  it("generates managed HTTP connector tools from an OpenAPI schema during registration", async () => {
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
      tools: [],
      enabled: true,
    });

    expect(connector).toMatchObject({
      slug: "notion",
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfigured: true,
      tools: [
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

  it("reduces but does not increase user-visible access when HTTP managed connector ceilings change", async () => {
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

    const managedConnectorInput = {
      slug: "notion",
      name: "Notion",
      description: "Managed Notion REST connector",
      categories: ["Knowledge base"],
      authStrategy: "oauth2" as const,
      authModes: ["oauth2" as const],
      provider: "http" as const,
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
      tools: [],
      enabled: true,
    };

    const connector = await service.upsertManagedConnector(managedConnectorInput);

    await service.registerOwnerIntegration(OWNER_ID, {
      key: "notion",
      name: "Notion",
      kind: "api",
      provider: "http",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: {
        builtInSlug: "notion",
        managedConnectorSlug: "notion",
      },
      credentials: {},
      tools: {},
    });

    await service.upsertManagedConnector({
      ...managedConnectorInput,
      tools: connector.tools.map((functionSpec) =>
        functionSpec.name === "post_search"
          ? { ...functionSpec, accessMode: "approval_required" }
          : functionSpec,
      ),
    });

    let integrations = await service.listOwnerIntegrations(OWNER_ID);
    let savedIntegration = getOnlyIntegration(integrations);
    expect(savedIntegration.tools["post_search"]).toMatchObject({
      accessMode: "approval_required",
      maxAccessMode: "approval_required",
      enabled: true,
    });

    await service.setOwnerToolAccessMode(
      OWNER_ID,
      "notion",
      "post_search",
      "disabled",
    );

    await service.upsertManagedConnector({
      ...managedConnectorInput,
      tools: connector.tools,
    });

    integrations = await service.listOwnerIntegrations(OWNER_ID);
    savedIntegration = getOnlyIntegration(integrations);
    expect(savedIntegration.tools["post_search"]).toMatchObject({
      accessMode: "disabled",
      maxAccessMode: "enabled",
      enabled: false,
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
      tools: [],
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
      tools: {
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
        toolNames: ["search"],
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
      tools: {
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
        toolNames: ["get_contact"],
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

  it("disables only stale tools with tracked usage", async () => {
    const service = createService();
    const staleInvokedAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const recentInvokedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    await installIntegration(service, {
      ...baseIntegration,
      tools: {
        accounts: {
          ...baseAccountsTool,
        },
        reports: {
          ...baseAccountsTool,
          name: "reports",
          description: "List reports",
          defaultScopes: ["reports.read"],
        },
        archived: {
          ...baseAccountsTool,
          name: "archived",
          description: "Archived tool",
          defaultScopes: ["archived.read"],
          accessMode: "disabled",
          enabled: false,
        },
      },
    });

    await testRepo.createToolInvocation(
      createToolInvocationRecord({
        ownerId: OWNER_ID,
        agentId: "agent-stale",
        agentClass: "assistant",
        integration: {
          key: "salesforce",
          provider: "http",
          kind: "api",
          authStrategy: "bearer",
        },
        toolName: "accounts",
        scopes: ["accounts.read"],
        payloadKeys: [],
        invokedAt: staleInvokedAt,
        outcome: "success",
      }),
    );
    await testRepo.createToolInvocation(
      createToolInvocationRecord({
        ownerId: OWNER_ID,
        agentId: "agent-recent",
        agentClass: "assistant",
        integration: {
          key: "salesforce",
          provider: "http",
          kind: "api",
          authStrategy: "bearer",
        },
        toolName: "reports",
        scopes: ["reports.read"],
        payloadKeys: [],
        invokedAt: recentInvokedAt,
        outcome: "success",
      }),
    );

    const result = await service.disableUnusedOwnerTools(OWNER_ID, 30, "days");

    expect(result.disabledCount).toBe(1);
    expect(result.disabledTools).toEqual([
      {
        integrationKey: "salesforce",
        toolName: "accounts",
        lastInvokedAt: staleInvokedAt,
      },
    ]);

    const savedIntegration = getOnlyIntegration(await service.listOwnerIntegrations(OWNER_ID));
    expect(savedIntegration.tools["accounts"]).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
    expect(savedIntegration.tools["reports"]).toMatchObject({
      enabled: true,
    });
    expect(savedIntegration.tools["archived"]).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
  });

  it("validates and deletes owner integrations", async () => {
    const service = createService();

    await expect(service.deleteOwnerIntegration(OWNER_ID, "   ")).rejects.toThrow(
      "Integration key is required.",
    );
    await expect(service.deleteOwnerIntegration(OWNER_ID, "slack")).rejects.toThrow(
      "Integration not found.",
    );

    await installIntegration(service, baseIntegration);

    await expect(
      service.deleteOwnerIntegration(" Owner@Example.com ", "salesforce"),
    ).resolves.toEqual({
      deleted: true,
      key: "salesforce",
    });
    await expect(testRepo.getOwnerIntegration(OWNER_ID, "salesforce")).resolves.toBeNull();
  });

  it("backfills legacy user and admin API key suffixes from encrypted recovery values", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = createService();
    const timestamp = new Date().toISOString();
    const legacyUserApiKey = "clu_legacy_user_key_value";
    const legacyAdminApiKey = "clad_legacy_admin_key_value";

    await testRepo.saveUserApiKey({
      ownerId: OWNER_ID,
      apiKeyHash: hashScopedApiKey(legacyUserApiKey),
      keyPrefix: getScopedApiKeyPrefix(legacyUserApiKey),
      keySuffix: "",
      encryptedApiKey: encryptScopedApiKey(legacyUserApiKey),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await testRepo.saveAdminApiKey({
      ownerId: "admin@example.com",
      apiKeyHash: hashScopedApiKey(legacyAdminApiKey),
      keyPrefix: getScopedApiKeyPrefix(legacyAdminApiKey),
      keySuffix: "",
      encryptedApiKey: encryptScopedApiKey(legacyAdminApiKey),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(await service.getUserApiKeyStatus(OWNER_ID)).toMatchObject({
      keyPrefix: getScopedApiKeyPrefix(legacyUserApiKey),
      keySuffix: legacyUserApiKey.slice(-4),
    });
    expect(await service.getAdminApiKeyStatus("admin@example.com")).toMatchObject({
      keyPrefix: getScopedApiKeyPrefix(legacyAdminApiKey),
      keySuffix: legacyAdminApiKey.slice(-4),
    });

    expect((await testRepo.getUserApiKeyByOwner(OWNER_ID))?.keySuffix).toBe(
      legacyUserApiKey.slice(-4),
    );
    expect((await testRepo.getAdminApiKeyByOwner("admin@example.com"))?.keySuffix).toBe(
      legacyAdminApiKey.slice(-4),
    );
  });

  it("rejects blank owners and blank scoped API keys", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = createService();

    await expect(service.getOrCreateAgentApiKey("   ")).rejects.toThrow(
      "A signed-in user email or name is required before issuing a context-layer API key.",
    );
    await expect(service.rotateUserApiKey("   ")).rejects.toThrow(
      "A signed-in user email or name is required before issuing a user API key.",
    );
    expect(await service.getStoredAgentApiKey("   ")).toBeNull();
    expect(await service.getStoredUserApiKey("   ")).toBeNull();
    expect(await service.getStoredAdminApiKey("   ")).toBeNull();
    expect(await service.isStoredAgentApiKeyAuthorized("   ")).toBe(false);
  });

  it("lists sanitized connection statuses and validates OAuth state lifecycle", async () => {
    const service = createService();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 60 * 1000).toISOString();

    await service.saveOAuthConnection(
      "Owner@Example.com",
      "notion",
      "notion",
      {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        expiresAt: future,
        externalAccountId: "bot_123",
        externalWorkspaceId: "workspace_123",
        displayName: "Team Wiki",
        metadata: { workspaceSlug: "team-wiki" },
      },
    );

    await expect(service.listIntegrationConnections(OWNER_ID)).resolves.toEqual([
      expect.objectContaining({
        integrationKey: "notion",
        provider: "notion",
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        expiresAt: future,
        externalAccountId: "bot_123",
        externalWorkspaceId: "workspace_123",
        displayName: "Team Wiki",
        metadata: { workspaceSlug: "team-wiki" },
      }),
    ]);
    expect(await service.getIntegrationConnectionStatus(OWNER_ID, "notion")).toMatchObject({
      integrationKey: "notion",
      provider: "notion",
      authStrategy: "oauth2",
      metadata: { workspaceSlug: "team-wiki" },
    });

    await expect(service.getOAuthState("missing", "notion")).rejects.toThrow(
      "OAuth state not found or already used.",
    );

    await service.saveOAuthState({
      state: "state-provider-mismatch",
      ownerId: "Owner@Example.com",
      integrationKey: "notion",
      provider: "notion",
      redirectTo: "/integrations",
      expiresAt: future,
    });
    await expect(
      service.getOAuthState("state-provider-mismatch", "slack"),
    ).rejects.toThrow("OAuth state provider mismatch.");

    await service.saveOAuthState({
      state: "state-expired",
      ownerId: OWNER_ID,
      integrationKey: "notion",
      provider: "notion",
      redirectTo: "/integrations",
      expiresAt: past,
    });
    await expect(service.getOAuthState("state-expired", "notion")).rejects.toThrow(
      "OAuth state has expired. Try connecting again.",
    );

    await service.saveOAuthState({
      state: "state-active",
      ownerId: OWNER_ID,
      integrationKey: "notion",
      provider: "notion",
      redirectTo: "/integrations",
      codeVerifier: "code-verifier",
      redirectUri: "https://context-layer.example.com/api/oauth/notion/callback",
      callbackUrl: "https://preview.example.com/api/oauth/notion/callback",
      expiresAt: future,
    });

    expect(await service.getOAuthState("state-active", "notion")).toMatchObject({
      ownerId: OWNER_ID,
      integrationKey: "notion",
      provider: "notion",
      codeVerifier: "code-verifier",
      redirectUri: "https://context-layer.example.com/api/oauth/notion/callback",
      callbackUrl: "https://preview.example.com/api/oauth/notion/callback",
    });
    expect(await service.consumeOAuthState("state-active", "notion")).toMatchObject({
      state: "state-active",
      provider: "notion",
    });
    await expect(service.getOAuthState("state-active", "notion")).rejects.toThrow(
      "OAuth state not found or already used.",
    );
  });

  it("validates managed connector registration inputs", async () => {
    const service = createService();

    await expect(
      service.upsertManagedConnector({
        slug: "   ",
        name: "Broken connector",
        description: "Broken connector",
        categories: ["Docs"],
        authStrategy: "bearer",
        authModes: ["bearer"],
        provider: "http",
        credentialLabel: "Token",
        credentialPlaceholder: "Token",
        credentialHelp: "Token",
        apiBaseUrl: "https://api.example.com",
        tools: [],
        enabled: true,
      }),
    ).rejects.toThrow("Managed connectors require a slug.");

    await expect(
      service.upsertManagedConnector({
        slug: "missing-mcp-url",
        name: "Broken MCP",
        description: "Broken MCP",
        categories: ["Docs"],
        authStrategy: "bearer",
        authModes: ["bearer"],
        provider: "mcp",
        credentialLabel: "Token",
        credentialPlaceholder: "Token",
        credentialHelp: "Token",
        serverUrl: "   ",
        apiBaseUrl: "   ",
        tools: [],
        enabled: true,
      }),
    ).rejects.toThrow("Managed MCP connectors require a serverUrl.");

    await expect(
      service.upsertManagedConnector({
        slug: "missing-http-url",
        name: "Broken HTTP",
        description: "Broken HTTP",
        categories: ["Docs"],
        authStrategy: "bearer",
        authModes: ["bearer"],
        provider: "http",
        credentialLabel: "Token",
        credentialPlaceholder: "Token",
        credentialHelp: "Token",
        apiBaseUrl: "   ",
        tools: [],
        enabled: true,
      }),
    ).rejects.toThrow("Managed HTTP connectors require an apiBaseUrl.");

    await expect(
      service.upsertManagedConnector({
        slug: "missing-oauth-config",
        name: "Broken OAuth",
        description: "Broken OAuth",
        categories: ["Docs"],
        authStrategy: "oauth2",
        authModes: ["oauth2"],
        provider: "http",
        credentialLabel: "Connect",
        credentialPlaceholder: "Connect",
        credentialHelp: "Connect",
        apiBaseUrl: "https://api.example.com",
        oauthClientId: "client-id",
        oauthClientSecret: "client-secret",
        tools: [],
        enabled: true,
      }),
    ).rejects.toThrow("OAuth-managed connectors require an oauthConfig.");
  });

  it("stores public OAuth clients without a secret and clears them on non-OAuth updates", async () => {
    const service = createService();

    const connector = await service.upsertManagedConnector({
      slug: "public-oauth",
      name: "Public OAuth",
      description: "Public OAuth connector",
      categories: ["Docs", " Docs "],
      authStrategy: "oauth2",
      authModes: ["oauth2", "oauth2"],
      provider: "http",
      credentialLabel: "Connect",
      credentialPlaceholder: "Connect",
      credentialHelp: "Connect",
      apiBaseUrl: " https://api.example.com ",
      oauthConfig: {
        authorizationUrl: "https://auth.example.com/authorize",
        tokenUrl: "https://auth.example.com/token",
        clientAuthentication: "none",
        scopes: [" read ", "", "write", "read"],
      },
      oauthClientId: " public-client ",
      tools: [],
      enabled: true,
    });

    expect(connector.oauthConfig?.scopes).toEqual(["read", "write"]);
    const stored = await testRepo.getManagedConnector("public-oauth");
    expect(stored?.oauthConfigured).toBe(true);
    expect(
      decryptCredentials<{ clientId?: string; clientSecret?: string }>(
        stored!.encryptedOAuthClient!,
      ),
    ).toEqual({ clientId: "public-client" });

    await service.upsertManagedConnector({
      slug: "public-oauth",
      name: "Public OAuth",
      description: "Now bearer",
      categories: ["Docs"],
      authStrategy: "bearer",
      authModes: ["bearer"],
      provider: "http",
      credentialLabel: "Token",
      credentialPlaceholder: "Token",
      credentialHelp: "Token",
      apiBaseUrl: "https://api.example.com",
      tools: [],
      enabled: false,
    });

    expect((await testRepo.getManagedConnector("public-oauth"))?.encryptedOAuthClient).toBeFalsy();
  });

  it("indexes HTTP managed connector tools and preserves saved access modes", async () => {
    const service = createService();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            openapi: "3.1.0",
            paths: {
              "/v1/search": {
                post: {
                  operationId: "post-search",
                  summary: "Search workspace",
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

    await service.upsertManagedConnector({
      slug: "notion-http",
      name: "Notion HTTP",
      description: "Managed Notion REST connector",
      categories: ["Knowledge base"],
      authStrategy: "bearer",
      authModes: ["bearer"],
      provider: "http",
      credentialLabel: "Token",
      credentialPlaceholder: "Token",
      credentialHelp: "Token",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      tools: [
        {
          name: "post_search",
          description: "Search workspace",
          defaultScopes: [],
          accessMode: "approval_required",
        },
      ],
      enabled: true,
    });

    expect(await service.indexManagedConnectorFunctions("notion-http")).toMatchObject({
      slug: "notion-http",
      tools: [
        expect.objectContaining({
          name: "post_search",
          accessMode: "approval_required",
        }),
      ],
    });

    const timestamp = new Date().toISOString();
    await testRepo.upsertManagedConnector({
      slug: "http-no-openapi",
      name: "HTTP without OpenAPI",
      description: "Missing schema",
      categories: ["Docs"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "http",
      credentialLabel: "Token",
      credentialPlaceholder: "Token",
      credentialHelp: "Token",
      apiBaseUrl: "https://api.example.com",
      tools: [],
      enabled: true,
      oauthConfigured: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await expect(service.indexManagedConnectorFunctions("http-no-openapi")).rejects.toThrow(
      "Managed HTTP connectors need an OpenAPI URL before their tools can be indexed.",
    );
  });

  it("indexes MCP managed connector tools using saved owner discovery credentials", async () => {
    const service = createService();
    const discoverySpy = vi.spyOn(discoveryModule, "discoverIntegration").mockResolvedValue({
      provider: "mcp",
      authStrategy: "oauth2",
      config: { serverUrl: "https://mcp.notion.com/mcp" },
      credentials: {},
      tools: {
        search: {
          name: "search",
          description: "Search documents",
          enabled: true,
          fineGrainedPermissions: true,
          defaultScopes: ["read"],
          executionMode: "provider",
          config: {},
        },
      },
    } as unknown as Awaited<ReturnType<typeof discoveryModule.discoverIntegration>>);
    const timestamp = new Date().toISOString();

    await testRepo.upsertManagedConnector({
      slug: "notion-mcp",
      name: "Notion MCP",
      description: "Managed Notion MCP connector",
      categories: ["Knowledge base"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Connect Notion with OAuth.",
      apiBaseUrl: "https://mcp.notion.com/mcp",
      serverUrl: "https://mcp.notion.com/mcp",
      oauthConfig: {
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: ["read"],
      },
      tools: [
        {
          name: "search",
          description: "Search documents",
          defaultScopes: ["read"],
          accessMode: "approval_required",
        },
      ],
      enabled: true,
      oauthConfigured: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await service.saveOAuthConnection(
      OWNER_ID,
      "notion-mcp",
      "notion",
      {
        accessToken: "owner-access-token",
        refreshToken: "owner-refresh-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        metadata: {},
      },
    );

    const indexed = await service.indexManagedConnectorFunctions("notion-mcp", OWNER_ID);

    expect(discoverySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "notion-mcp",
        credentials: {
          accessToken: "owner-access-token",
          refreshToken: "owner-refresh-token",
        },
      }),
      expect.objectContaining({
        ownerId: OWNER_ID,
        repository: testRepo,
      }),
    );
    expect(indexed.tools).toEqual([
      expect.objectContaining({
        name: "search",
        accessMode: "approval_required",
      }),
    ]);
  });

  it("supports owner integration and tool mutations while clamping managed ceilings", async () => {
    const service = createService();
    const timestamp = new Date().toISOString();

    await installIntegration(service, baseIntegration);
    expect(
      await service.addOwnerTool(OWNER_ID, "salesforce", {
        name: "contacts",
        description: "List contacts",
        enabled: true,
        fineGrainedPermissions: true,
        defaultScopes: ["contacts.read"],
        executionMode: "provider",
        config: {},
      }),
    ).toMatchObject({
      name: "contacts",
      enabled: true,
      defaultScopes: ["contacts.read"],
    });
    expect(
      await service.setOwnerIntegrationEnabled(OWNER_ID, "salesforce", false),
    ).toMatchObject({ enabled: false });
    await expect(
      service.setOwnerToolEnabled(OWNER_ID, "salesforce", "missing", true),
    ).rejects.toThrow("Unknown tool 'missing' for integration 'salesforce'.");

    await testRepo.upsertManagedConnector({
      slug: "managed-salesforce",
      name: "Managed Salesforce",
      description: "Managed Salesforce connector",
      categories: ["CRM"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      credentialLabel: "Token",
      credentialPlaceholder: "Token",
      credentialHelp: "Token",
      apiBaseUrl: "https://salesforce.example.com/mcp",
      serverUrl: "https://salesforce.example.com/mcp",
      tools: [
        {
          name: "accounts",
          description: "List accounts",
          defaultScopes: ["accounts.read"],
          accessMode: "approval_required",
        },
      ],
      enabled: true,
      oauthConfigured: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await service.registerOwnerIntegration(OWNER_ID, {
      ...baseIntegration,
      key: "managed-salesforce",
      name: "Managed Salesforce",
      config: {
        builtInSlug: "managed-salesforce",
        managedConnectorSlug: "managed-salesforce",
      },
      tools: {
        accounts: {
          ...baseAccountsTool,
          accessMode: "disabled",
          enabled: false,
        },
      },
    });

    expect(
      await service.setOwnerToolEnabled(OWNER_ID, "managed-salesforce", "accounts", true),
    ).toMatchObject({
      accessMode: "approval_required",
      enabled: true,
      maxAccessMode: "approval_required",
    });
  });

  it("rejects ownerless and unknown-tool invocations and missing access requests", async () => {
    const service = createService();
    await installIntegration(service, baseIntegration);

    await expect(
      service.invokeContext({
        agentId: "agent-ownerless",
        agentClass: "assistant",
        integrationKey: "salesforce",
        toolName: "accounts",
      }),
    ).rejects.toThrow(
      "Integration 'salesforce' must be installed for a specific user before invocation.",
    );
    await expect(
      service.invokeContext(
        "agent-missing-tool",
        "assistant",
        "salesforce",
        "missing",
        {},
        ["accounts.read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Unknown tool 'missing' for integration 'salesforce'.");
    await expect(service.rejectAccessRequest("missing-request", "approver")).rejects.toThrow(
      "Unknown access request 'missing-request'.",
    );
  });

  it("refreshes expired OAuth connections before invocation", async () => {
    const repository = testRepo;
    const mcpInvoke = vi.fn(async ({ integration }) => integration.credentials);
    const refreshToken = vi.fn(async () => ({
      accessToken: "refreshed-access-token",
      refreshToken: "rotated-refresh-token",
      tokenType: "bearer",
      scopes: ["read", "write"],
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      externalAccountId: "bot_refreshed",
      externalWorkspaceId: "workspace_refreshed",
      displayName: "Knowledge Base",
      metadata: { workspaceSlug: "team-wiki" },
    }));
    vi.spyOn(providerResolverModule, "resolveOAuthProvider").mockResolvedValue({
      refreshToken,
    } as unknown as Awaited<ReturnType<typeof providerResolverModule.resolveOAuthProvider>>);
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        mcp: { invoke: mcpInvoke },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      key: "notion-refresh",
      name: "Notion",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: { serverUrl: "https://mcp.notion.com/mcp" },
      credentials: {},
      tools: {
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
        integrationKey: "notion-refresh",
        toolNames: ["search"],
        scopes: ["read"],
        enabled: true,
      },
    ]);
    await service.saveOAuthConnection(
      OWNER_ID,
      "notion-refresh",
      "notion",
      {
        accessToken: "expired-access-token",
        refreshToken: "refresh-me",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        externalAccountId: "bot_old",
        externalWorkspaceId: "workspace_old",
        displayName: "Old Name",
        metadata: { region: "eu" },
      },
    );

    expect(
      await service.invokeContext(
        "agent-refresh",
        "assistant",
        "notion-refresh",
        "search",
        { query: "docs" },
        ["read"],
        { ownerId: OWNER_ID },
      ),
    ).toMatchObject({
      data: {
        accessToken: "refreshed-access-token",
        refreshToken: "rotated-refresh-token",
      },
    });
    expect(refreshToken).toHaveBeenCalledWith({ refreshToken: "refresh-me" });
    expect(mcpInvoke).toHaveBeenCalledTimes(1);

    const refreshedConnection = await testRepo.getIntegrationConnection(OWNER_ID, "notion-refresh");
    expect(
      decryptCredentials<{ accessToken?: string; refreshToken?: string }>(
        refreshedConnection!.encryptedCredentials,
      ),
    ).toEqual({
      accessToken: "refreshed-access-token",
      refreshToken: "rotated-refresh-token",
    });
    expect(refreshedConnection).toMatchObject({
      scopes: ["read", "write"],
      externalAccountId: "bot_refreshed",
      externalWorkspaceId: "workspace_refreshed",
      displayName: "Knowledge Base",
      metadata: {
        region: "eu",
        workspaceSlug: "team-wiki",
      },
    });
  });

  it("requires a refresh token before renewing expired OAuth connections", async () => {
    const repository = testRepo;
    const mcpInvoke = vi.fn(async ({ integration }) => integration.credentials);
    vi.spyOn(providerResolverModule, "resolveOAuthProvider").mockResolvedValue({
      refreshToken: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof providerResolverModule.resolveOAuthProvider>>);
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        mcp: { invoke: mcpInvoke },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await installIntegration(service, {
      key: "notion-expired",
      name: "Notion",
      kind: "mcp",
      provider: "mcp",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: { serverUrl: "https://mcp.notion.com/mcp" },
      credentials: {},
      tools: {
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
        integrationKey: "notion-expired",
        toolNames: ["search"],
        scopes: ["read"],
        enabled: true,
      },
    ]);
    await service.saveOAuthConnection(
      OWNER_ID,
      "notion-expired",
      "notion",
      {
        accessToken: "expired-access-token",
      },
      {
        authStrategy: "oauth2",
        tokenType: "bearer",
        scopes: ["read"],
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        metadata: {},
      },
    );

    await expect(
      service.invokeContext(
        "agent-expired",
        "assistant",
        "notion-expired",
        "search",
        { query: "docs" },
        ["read"],
        { ownerId: OWNER_ID },
      ),
    ).rejects.toThrow("Reconnect notion to refresh the expired access token.");
    expect(mcpInvoke).not.toHaveBeenCalled();
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
      tools: {
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
        toolNames: ["search"],
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

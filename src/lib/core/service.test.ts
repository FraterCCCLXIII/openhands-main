import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import {
  AdapterRegistry,
  type IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { ContextLayerService } from "@/src/lib/core/service";
import type { IntegrationSpec } from "@/src/types/context-layer";

afterEach(() => {
  vi.unstubAllGlobals();
});


const createService = () => {
  const mockAdapter: IntegrationAdapter = {
    invoke: async ({ payload }) => ({ ok: true, payload }),
  };

  const service = new ContextLayerService(
    new MemoryRepository(),
    new AdapterRegistry({
      composio: mockAdapter,
      mcp: mockAdapter,
      mock: mockAdapter,
    }),
    new NotificationPublisher(new MemoryRepository()),
  );

  return service;
};

const baseIntegration: IntegrationSpec = {
  key: "salesforce",
  name: "Salesforce",
  kind: "api",
  provider: "composio",
  authStrategy: "oauth2",
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

describe("ContextLayerService", () => {
  it("allows context invocation through agent-class policies", async () => {
    const service = createService();
    await service.registerIntegration(baseIntegration);
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
    );

    expect(response.integration).toBe("salesforce");
    expect(response.decision.allowed).toBe(true);
    expect(response.data).toEqual({ ok: true, payload: { limit: 5 } });
  });

  it("blocks disabled functions", async () => {
    const service = createService();
    await service.registerIntegration({
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
      ),
    ).rejects.toThrow("Function disabled");
  });

  it("requires temporary approval for case-by-case functions", async () => {
    const repository = new MemoryRepository();
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await service.registerIntegration({
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
      ),
    ).rejects.toThrow("Permission required");

    const request = await service.createAccessRequest({
      agentId: "agent-4",
      agentClass: "assistant",
      integrationKey: "salesforce",
      functionName: "accounts",
      scopes: ["accounts.read"],
      requestedMinutes: 30,
      channels: [],
      notificationTargets: {},
      justification: "Need approval",
    });
    await service.approveAccessRequest(request.id, "human-1", 30);

    const response = await service.invokeContext(
      "agent-4",
      "assistant",
      "salesforce",
      "accounts",
      {},
      ["accounts.read"],
    );

    expect(response.decision.reason).toBe("Allowed by temporary approval");
  });

  it("creates notifications for multiple channels when access is requested", async () => {
    const repository = new MemoryRepository();
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({ mock: { invoke: async () => ({}) } }),
      new NotificationPublisher(repository),
    );
    await service.registerIntegration(baseIntegration);

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

  it("grants temporary access until expiry", async () => {
    const repository = new MemoryRepository();
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        composio: { invoke: async () => ({ ok: true }) },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );
    await service.registerIntegration(baseIntegration);

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
    );
    expect(allowed.decision.allowed).toBe(true);

    const grant = (await repository.listTemporaryGrants())[0];
    grant.expiresAt = new Date(Date.now() - 60_000).toISOString();
    await repository.saveTemporaryGrant(grant);

    await expect(
      service.invokeContext("agent-3", "writer", "salesforce", "accounts", {}, [
        "accounts.read",
      ]),
    ).rejects.toThrow("Permission required");
  });

  it("routes mock execution through the adapter registry", async () => {
    const service = createService();
    await service.registerIntegration({
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


  it("requires OAuth client credentials when first registering an OAuth managed connector", async () => {
    const repository = new MemoryRepository();
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

  it("generates managed HTTP connector functions from an OpenAPI schema during registration", async () => {
    const repository = new MemoryRepository();
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


  it("injects saved per-user OAuth credentials during invocation", async () => {
    const repository = new MemoryRepository();
    const mcpInvoke = vi.fn(async ({ integration }) => integration.credentials);
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        mcp: { invoke: mcpInvoke },
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await service.registerIntegration({
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
    const repository = new MemoryRepository();
    const service = new ContextLayerService(
      repository,
      new AdapterRegistry({
        http: new HttpAdapter(),
        mock: { invoke: async () => ({}) },
      }),
      new NotificationPublisher(repository),
    );

    await service.registerIntegration({
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
});

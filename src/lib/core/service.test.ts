import { describe, expect, it } from "vitest";

import {
  AdapterRegistry,
  type IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { ContextLayerService } from "@/src/lib/core/service";
import type { IntegrationSpec } from "@/src/types/context-layer";

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

});

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET } from "./route";

import {
  ADMIN_API_BEARER_CHALLENGE,
  ADMIN_API_UNAUTHORIZED_DETAIL,
} from "@/src/lib/admin-api-auth";
import { nowIso } from "@/src/lib/core/date";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

let testCleanup: () => Promise<void>;

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    integrationsHubRepository?: unknown;
    integrationsHubService?: unknown;
  };
  delete runtime.integrationsHubRepository;
  delete runtime.integrationsHubService;
};

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-overview-route-test");
  vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

describe("GET /api/admin/overview", () => {
  it("returns concise deployment-wide operational stats including duplicate external accounts", async () => {
    const service = getIntegrationsHubService();

    await service.saveOAuthConnection(
      "owner-a@example.com",
      "github",
      "github",
      { accessToken: "token-a" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-b@example.com",
      "github",
      "github",
      { accessToken: "token-b" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-c@example.com",
      "slack",
      "slack",
      { accessToken: "token-c" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["chat:write"],
        externalAccountId: "U123",
        displayName: "workspace-bot",
        metadata: { team: "Workspace" },
      },
    );

    await service.upsertManagedConnector({
      slug: "test-http",
      name: "Test HTTP",
      description: "Test managed connector",
      categories: ["test"],
      authStrategy: "api_key",
      credentialLabel: "API key",
      credentialPlaceholder: "sk_test",
      credentialHelp: "Paste a key.",
      apiBaseUrl: "https://example.com",
      enabled: true,
    });

    await service.createAccessRequest({
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "list_repos",
      scopes: ["repo"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "owner-a@example.com" },
      justification: "Need read access",
      agentData: {},
    });

    await service.createNotification({
      id: "notif-1",
      channel: "in_app",
      recipient: "owner-a@example.com",
      subject: "Approval required",
      body: "A request is waiting for review.",
      metadata: {},
      createdAt: nowIso(),
    });

    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");
    const response = await GET(
      new Request("http://localhost/api/admin/overview", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      totalConnections: 3,
      connectedOwners: 3,
      managedConnectors: 1,
      totalAccessRequests: 1,
      pendingAccessRequests: 1,
      notifications: 2,
      duplicateExternalAccounts: [
        {
          provider: "github",
          externalAccountId: "xingyaoww",
          ownerIds: ["owner-a@example.com", "owner-b@example.com"],
          ownerCount: 2,
          displayNames: ["xingyaoww"],
        },
      ],
      users: [
        {
          ownerId: "owner-a@example.com",
          totalConnections: 1,
          integrations: ["github"],
          providers: ["github"],
          totalAccessRequests: 1,
          pendingAccessRequests: 1,
          notifications: 2,
          duplicateExternalAccounts: [
            {
              provider: "github",
              externalAccountId: "xingyaoww",
              ownerIds: ["owner-a@example.com", "owner-b@example.com"],
              ownerCount: 2,
              displayNames: ["xingyaoww"],
            },
          ],
          connections: [
            {
              ownerId: "owner-a@example.com",
              integrationKey: "github",
              provider: "github",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["repo"],
              externalAccountId: "xingyaoww",
              displayName: "xingyaoww",
            },
          ],
        },
        {
          ownerId: "owner-b@example.com",
          totalConnections: 1,
          integrations: ["github"],
          providers: ["github"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [
            {
              provider: "github",
              externalAccountId: "xingyaoww",
              ownerIds: ["owner-a@example.com", "owner-b@example.com"],
              ownerCount: 2,
              displayNames: ["xingyaoww"],
            },
          ],
          connections: [
            {
              ownerId: "owner-b@example.com",
              integrationKey: "github",
              provider: "github",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["repo"],
              externalAccountId: "xingyaoww",
              displayName: "xingyaoww",
            },
          ],
        },
        {
          ownerId: "owner-c@example.com",
          totalConnections: 1,
          integrations: ["slack"],
          providers: ["slack"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [],
          connections: [
            {
              ownerId: "owner-c@example.com",
              integrationKey: "slack",
              provider: "slack",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["chat:write"],
              externalAccountId: "U123",
              displayName: "workspace-bot",
            },
          ],
        },
      ],
    });
  });

  it("returns zeroed stats when no operational data exists", async () => {
    const service = getIntegrationsHubService();
    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");
    const response = await GET(
      new Request("http://localhost/api/admin/overview", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      totalConnections: 0,
      connectedOwners: 0,
      managedConnectors: 0,
      totalAccessRequests: 0,
      pendingAccessRequests: 0,
      notifications: 0,
      duplicateExternalAccounts: [],
      users: [],
    });
  });

  it("normalizes duplicate identities and skips connections without an external account id", async () => {
    const service = getIntegrationsHubService();

    await service.saveOAuthConnection(
      "owner-a@example.com",
      "github",
      "GitHub",
      { accessToken: "token-a" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "XingYaoWW",
        displayName: "xingyaoww",
        metadata: { login: "XingYaoWW" },
      },
    );
    await service.saveOAuthConnection(
      "owner-b@example.com",
      "github",
      "github",
      { accessToken: "token-b" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-c@example.com",
      "slack",
      "slack",
      { accessToken: "token-c" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["chat:write"],
        metadata: {},
      },
    );

    const { apiKey } = await service.rotateAdminApiKey("admin@example.com");
    const response = await GET(
      new Request("http://localhost/api/admin/overview", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      totalConnections: 3,
      connectedOwners: 3,
      managedConnectors: 0,
      totalAccessRequests: 0,
      pendingAccessRequests: 0,
      notifications: 0,
      duplicateExternalAccounts: [
        {
          provider: "github",
          externalAccountId: "xingyaoww",
          ownerIds: ["owner-a@example.com", "owner-b@example.com"],
          ownerCount: 2,
          displayNames: ["xingyaoww"],
        },
      ],
      users: [
        {
          ownerId: "owner-a@example.com",
          totalConnections: 1,
          integrations: ["github"],
          providers: ["github"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [
            {
              provider: "github",
              externalAccountId: "xingyaoww",
              ownerIds: ["owner-a@example.com", "owner-b@example.com"],
              ownerCount: 2,
              displayNames: ["xingyaoww"],
            },
          ],
          connections: [
            {
              ownerId: "owner-a@example.com",
              integrationKey: "github",
              provider: "github",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["repo"],
              externalAccountId: "XingYaoWW",
              displayName: "xingyaoww",
            },
          ],
        },
        {
          ownerId: "owner-b@example.com",
          totalConnections: 1,
          integrations: ["github"],
          providers: ["github"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [
            {
              provider: "github",
              externalAccountId: "xingyaoww",
              ownerIds: ["owner-a@example.com", "owner-b@example.com"],
              ownerCount: 2,
              displayNames: ["xingyaoww"],
            },
          ],
          connections: [
            {
              ownerId: "owner-b@example.com",
              integrationKey: "github",
              provider: "github",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["repo"],
              externalAccountId: "xingyaoww",
            },
          ],
        },
        {
          ownerId: "owner-c@example.com",
          totalConnections: 1,
          integrations: ["slack"],
          providers: ["slack"],
          totalAccessRequests: 0,
          pendingAccessRequests: 0,
          notifications: 0,
          duplicateExternalAccounts: [],
          connections: [
            {
              ownerId: "owner-c@example.com",
              integrationKey: "slack",
              provider: "slack",
              authStrategy: "oauth2",
              tokenType: "Bearer",
              scopes: ["chat:write"],
            },
          ],
        },
      ],
    });
  });

  it("returns a bearer challenge when the admin API key is missing", async () => {
    const response = await GET(new Request("http://localhost/api/admin/overview"));

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe(ADMIN_API_BEARER_CHALLENGE);
    await expect(response.json()).resolves.toMatchObject({
      detail: ADMIN_API_UNAUTHORIZED_DETAIL,
    });
  });
});

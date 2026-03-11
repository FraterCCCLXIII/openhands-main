import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mcpListToolsMock, mcpState } = vi.hoisted(() => ({
  mcpListToolsMock: vi.fn(
    async (): Promise<{ tools: Array<Record<string, unknown>> }> => ({ tools: [] }),
  ),
  mcpState: {
    url: "",
    headers: undefined as Record<string, string> | undefined,
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: class MockClient {
    async connect() {}

    async listTools() {
      return mcpListToolsMock();
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: class MockTransport {
    constructor(
      url: URL,
      options?: { requestInit?: { headers?: Record<string, string> } },
    ) {
      mcpState.url = url.toString();
      mcpState.headers = options?.requestInit?.headers;
    }

    async close() {}
  },
}));

import { encryptCredentials } from "@/src/lib/credential-crypto";
import { MemoryRepository } from "@/src/lib/db/memory-repository";
import {
  discoverIntegration,
  inferMcpAuthStrategy,
  listBuiltInConnectors,
  normalizeComposioAuthModes,
} from "@/src/lib/integrations/discovery";

beforeEach(() => {
  mcpListToolsMock.mockReset();
  mcpListToolsMock.mockResolvedValue({ tools: [] });
  mcpState.url = "";
  mcpState.headers = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeComposioAuthModes", () => {
  it("normalizes multiple auth schemes and preserves no-auth support", () => {
    expect(
      normalizeComposioAuthModes(["oauth2", "api_key", "bearer_token"], true),
    ).toEqual(["oauth2", "api_key", "bearer", "none"]);
  });

  it("falls back to oauth2 when Composio provides no auth metadata", () => {
    expect(normalizeComposioAuthModes()).toEqual(["oauth2"]);
  });
});

describe("listBuiltInConnectors", () => {
  it("returns an empty catalog when no repository is provided", async () => {
    await expect(listBuiltInConnectors()).resolves.toEqual([]);
  });

  it("returns enabled managed connectors when a repository is provided", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "acme-crm",
      name: "Acme CRM",
      description: "Configurable CRM connector",
      categories: ["CRM"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Connect Acme CRM",
      credentialPlaceholder: "Connect Acme CRM",
      credentialHelp: "Use OAuth to connect Acme CRM.",
      serverUrl: "https://mcp.acme.test/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.acme.test/authorize",
        tokenUrl: "https://auth.acme.test/token",
        scopes: ["contacts.read"],
      },
      encryptedOAuthClient: encryptCredentials({
        clientId: "acme-client-id",
        clientSecret: "acme-client-secret",
      }),
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    const connectors = await listBuiltInConnectors(repository);

    expect(connectors).toEqual([
      expect.objectContaining({
        slug: "acme-crm",
        name: "Acme CRM",
        authStrategy: "oauth2",
        toolCount: 0,
        oauthConfigured: true,
      }),
    ]);
  });

  it("omits disabled managed connectors and sorts the catalog by name", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "zeta",
      name: "Zeta Desk",
      description: "Support connector",
      categories: ["Support"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Zeta token",
      credentialPlaceholder: "zeta_...",
      credentialHelp: "Use a Zeta access token.",
      serverUrl: "https://mcp.zeta.test/mcp",
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    await repository.upsertManagedConnector({
      slug: "alpha",
      name: "Alpha CRM",
      description: "CRM connector",
      categories: ["CRM"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Alpha token",
      credentialPlaceholder: "alpha_...",
      credentialHelp: "Use an Alpha access token.",
      serverUrl: "https://mcp.alpha.test/mcp",
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    await repository.upsertManagedConnector({
      slug: "disabled",
      name: "Disabled Connector",
      description: "Disabled connector",
      categories: ["Other"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Disabled token",
      credentialPlaceholder: "disabled_...",
      credentialHelp: "Use a token.",
      serverUrl: "https://mcp.disabled.test/mcp",
      functions: [],
      enabled: false,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    const connectors = await listBuiltInConnectors(repository);

    expect(connectors.map((connector) => connector.name)).toEqual([
      "Alpha CRM",
      "Zeta Desk",
    ]);
  });
});

describe("discoverIntegration", () => {
  it("discovers managed bearer MCP connectors and forwards the supplied token", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "github",
      name: "GitHub",
      description: "Managed GitHub MCP",
      categories: ["Engineering"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "GitHub token",
      credentialPlaceholder: "ghp_...",
      credentialHelp: "Use a GitHub token.",
      serverUrl: "https://api.githubcopilot.com/mcp/",
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    mcpListToolsMock.mockResolvedValue({
      tools: [
        {
          name: "get_me",
          description: "Get the authenticated user",
        },
        {
          name: "create_issue",
          description: "Create a GitHub issue",
        },
      ],
    });

    await expect(
      discoverIntegration(
        {
          key: "github",
          kind: "built_in",
          config: {
            builtInSlug: "github",
          },
          credentials: {
            accessToken: "github-pat",
          },
        },
        {
          repository,
        },
      ),
    ).resolves.toMatchObject({
      provider: "mcp",
      authStrategy: "bearer",
      config: {
        builtInSlug: "github",
        managedConnectorSlug: "github",
        serverUrl: "https://api.githubcopilot.com/mcp/",
      },
      credentials: {
        accessToken: "github-pat",
      },
      functions: {
        get_me: {
          description: "Get the authenticated user",
          config: {
            toolName: "get_me",
          },
        },
        create_issue: {
          description: "Create a GitHub issue",
          config: {
            toolName: "create_issue",
          },
        },
      },
    });
    expect(mcpState.url).toBe("https://api.githubcopilot.com/mcp/");
    expect(mcpState.headers).toEqual({
      Authorization: "Bearer github-pat",
    });
  });

  it("returns 404 when a built-in slug has not been registered as a managed connector", async () => {
    await expect(
      discoverIntegration(
        {
          key: "notion",
          kind: "built_in",
          config: {
            builtInSlug: "notion",
          },
          credentials: {},
        },
        {
          repository: new MemoryRepository(),
        },
      ),
    ).rejects.toMatchObject({
      message: "Unknown built-in connector 'notion'.",
    });
  });

  it("discovers managed OAuth MCP connectors with the user's stored connection", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "acme-crm",
      name: "Acme CRM",
      description: "Configurable CRM connector",
      categories: ["CRM"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "mcp",
      oauthConfigured: true,
      credentialLabel: "Connect Acme CRM",
      credentialPlaceholder: "Connect Acme CRM",
      credentialHelp: "Use OAuth to connect Acme CRM.",
      serverUrl: "https://mcp.acme.test/mcp",
      oauthConfig: {
        authorizationUrl: "https://auth.acme.test/authorize",
        tokenUrl: "https://auth.acme.test/token",
        scopes: ["contacts.read"],
      },
      encryptedOAuthClient: encryptCredentials({
        clientId: "acme-client-id",
        clientSecret: "acme-client-secret",
      }),
      functions: [],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    await repository.upsertIntegrationConnection({
      ownerId: "dev@localhost",
      integrationKey: "acme-crm",
      provider: "mcp",
      authStrategy: "oauth2",
      encryptedCredentials: encryptCredentials({
        accessToken: "acme-access-token",
      }),
      scopes: ["contacts.read"],
      metadata: {},
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    mcpListToolsMock.mockResolvedValue({
      tools: [
        {
          name: "list_contacts",
          description: "List contacts",
          inputSchema: {
            type: "object",
          },
        },
      ],
    });

    await expect(
      discoverIntegration(
        {
          key: "acme-crm",
          kind: "built_in",
          config: {
            builtInSlug: "acme-crm",
          },
          credentials: {},
        },
        {
          ownerId: "dev@localhost",
          repository,
        },
      ),
    ).resolves.toMatchObject({
      provider: "mcp",
      authStrategy: "oauth2",
      config: {
        builtInSlug: "acme-crm",
        managedConnectorSlug: "acme-crm",
        serverUrl: "https://mcp.acme.test/mcp",
      },
      credentials: {},
      functions: {
        list_contacts: {
          description: "List contacts",
          config: {
            toolName: "list_contacts",
          },
        },
      },
    });
    expect(mcpState.url).toBe("https://mcp.acme.test/mcp");
    expect(mcpState.headers).toEqual({
      Authorization: "Bearer acme-access-token",
    });
  });

  it("discovers managed HTTP connectors from their stored function templates", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "linear",
      name: "Linear",
      description: "Managed Linear API connector",
      categories: ["Project management"],
      authModes: ["api_key"],
      authStrategy: "api_key",
      provider: "http",
      oauthConfigured: true,
      credentialLabel: "Linear API key",
      credentialPlaceholder: "lin_api_...",
      credentialHelp: "Use a Linear API key.",
      apiBaseUrl: "https://api.linear.app",
      functions: [
        {
          name: "list_issues",
          description: "List Linear issues",
          defaultScopes: ["read"],
          request: {
            method: "POST",
            path: "/graphql",
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              query: "{ issues { nodes { id title } } }",
            },
            contentType: "json",
          },
        },
      ],
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    await expect(
      discoverIntegration(
        {
          key: "linear",
          kind: "built_in",
          config: {
            builtInSlug: "linear",
          },
          credentials: {
            headerName: "X-Linear-Key",
            secret: "linear-secret",
          },
        },
        {
          repository,
        },
      ),
    ).resolves.toMatchObject({
      provider: "http",
      authStrategy: "api_key",
      config: {
        builtInSlug: "linear",
        managedConnectorSlug: "linear",
        apiBaseUrl: "https://api.linear.app",
      },
      credentials: {
        headerName: "X-Linear-Key",
        secret: "linear-secret",
      },
      functions: {
        list_issues: {
          description: "List Linear issues",
          defaultScopes: ["read"],
          config: {
            request: {
              method: "POST",
              path: "/graphql",
            },
          },
        },
      },
    });
  });

  it("discovers managed OAuth HTTP connectors from generated OpenAPI function templates", async () => {
    const repository = new MemoryRepository();
    await repository.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Managed Notion REST connector",
      categories: ["Knowledge base"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "http",
      oauthConfigured: true,
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Use OAuth to connect Notion.",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfig: {
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: [],
      },
      encryptedOAuthClient: encryptCredentials({
        clientId: "notion-client-id",
        clientSecret: "notion-client-secret",
      }),
      functions: [
        {
          name: "post_search",
          description: "Search workspace Provide the request payload under `body`.",
          defaultScopes: [],
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
      enabled: true,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    await expect(
      discoverIntegration(
        {
          key: "notion",
          kind: "built_in",
          config: {
            builtInSlug: "notion",
          },
          credentials: {},
        },
        {
          ownerId: "dev@localhost",
          repository,
        },
      ),
    ).resolves.toMatchObject({
      provider: "http",
      authStrategy: "oauth2",
      config: {
        builtInSlug: "notion",
        managedConnectorSlug: "notion",
        apiBaseUrl: "https://api.notion.com",
      },
      credentials: {},
      functions: {
        post_search: {
          description: "Search workspace Provide the request payload under `body`.",
          config: {
            request: {
              method: "POST",
              path: "/v1/search",
              headers: {
                "Notion-Version": "2026-03-11",
              },
            },
          },
        },
      },
    });
  });

});

describe("inferMcpAuthStrategy", () => {
  it("treats a default header name without a secret as no auth", () => {
    expect(inferMcpAuthStrategy({ headerName: "X-API-Key" })).toBe("none");
  });

  it("handles an empty string secret as no auth", () => {
    expect(
      inferMcpAuthStrategy({
        headerName: "X-API-Key",
        secret: "",
      }),
    ).toBe("none");
  });

  it("prefers oauth2 when an access token is present", () => {
    expect(
      inferMcpAuthStrategy({
        accessToken: "github-pat",
        headerName: "X-API-Key",
      }),
    ).toBe("oauth2");
  });

  it("uses api_key when a secret is configured", () => {
    expect(
      inferMcpAuthStrategy({
        headerName: "X-API-Key",
        secret: "context-secret",
      }),
    ).toBe("api_key");
  });

  it("requires both username and password for basic auth", () => {
    expect(
      inferMcpAuthStrategy({
        username: "demo",
      }),
    ).toBe("none");
    expect(
      inferMcpAuthStrategy({
        username: "demo",
        password: "secret",
      }),
    ).toBe("basic");
  });
});

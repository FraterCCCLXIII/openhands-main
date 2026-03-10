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
  it("returns the curated Vercel-hosted built-in connector catalog", async () => {
    const connectors = await listBuiltInConnectors();
    const github = connectors.find((connector) => connector.slug === "github");
    const notion = connectors.find((connector) => connector.slug === "notion");
    const googleDocs = connectors.find(
      (connector) => connector.slug === "google-docs",
    );

    expect(connectors).toHaveLength(5);
    expect(github).toMatchObject({
      name: "GitHub",
      authModes: ["bearer"],
      credentialLabel: "GitHub token",
      toolCount: 4,
    });
    expect(notion).toMatchObject({
      name: "Notion",
      authModes: ["oauth2"],
      credentialLabel: "Connect Notion",
    });
    expect(googleDocs).toMatchObject({
      name: "Google Docs",
      credentialPlaceholder: "ya29....",
      toolCount: 4,
    });
  });

  it("includes managed connectors when a repository is provided", async () => {
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
    const connector = connectors.find((candidate) => candidate.slug === "acme-crm");

    expect(connector).toMatchObject({
      name: "Acme CRM",
      authStrategy: "oauth2",
      toolCount: 0,
      oauthConfigured: true,
    });
  });
});

describe("discoverIntegration", () => {
  it("maps curated built-in connectors to internal MCP endpoints", async () => {
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
          baseUrl: "https://context-layer.vercel.app",
        },
      ),
    ).resolves.toMatchObject({
      provider: "mcp",
      authStrategy: "bearer",
      config: {
        builtInSlug: "github",
        serverUrl: "https://context-layer.vercel.app/api/mcp/github",
      },
      credentials: {
        accessToken: "github-pat",
      },
      functions: {
        get_me: {
          config: {
            toolName: "get_me",
          },
          defaultScopes: ["read"],
        },
        create_issue: {
          defaultScopes: ["write"],
        },
      },
    });
  });

  it("does not require an embedded token for OAuth built-in connectors", async () => {
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
          baseUrl: "https://context-layer.vercel.app",
        },
      ),
    ).resolves.toMatchObject({
      authStrategy: "oauth2",
      config: {
        builtInSlug: "notion",
        serverUrl: "https://context-layer.vercel.app/api/mcp/notion",
      },
      credentials: {},
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

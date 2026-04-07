import { describe, expect, it } from "vitest";

import {
  managedConnectorListSchema,
  managedConnectorResponseSchema,
  managedConnectorUpsertSchema,
} from "@/src/lib/managed-connectors/api-schema";

describe("managedConnectorUpsertSchema", () => {
  it("accepts inferred MCP connectors and HTTP connectors with defaulted fields", () => {
    const inferredMcp = managedConnectorUpsertSchema.parse({
      slug: "mcp-proxy",
      name: "MCP Proxy",
      description: "Proxy hosted MCP tools.",
      authStrategy: "bearer",
      credentialLabel: "Access token",
      credentialPlaceholder: "mcp_...",
      credentialHelp: "Paste your MCP token.",
      serverUrl: "https://mcp.example.test/mcp",
    });

    const httpWithTools = managedConnectorUpsertSchema.parse({
      slug: "crm-api",
      name: "CRM API",
      description: "Customer sync tools.",
      provider: "http",
      authStrategy: "oauth2",
      credentialLabel: "Connect CRM API",
      credentialPlaceholder: "Connect CRM API",
      credentialHelp: "Use OAuth to connect CRM API.",
      apiBaseUrl: "https://api.crm.example.test",
      oauthConfig: {
        authorizationUrl: "https://auth.crm.example.test/authorize",
        tokenUrl: "https://auth.crm.example.test/token",
      },
      tools: [
        {
          name: "sync_customers",
          description: "Sync customer records.",
        },
      ],
    });

    const httpWithOpenApi = managedConnectorUpsertSchema.parse({
      slug: "docs-api",
      name: "Docs API",
      description: "Generated documentation tools.",
      provider: "http",
      authStrategy: "api_key",
      credentialLabel: "Docs API key",
      credentialPlaceholder: "docs_...",
      credentialHelp: "Paste your Docs API key.",
      apiBaseUrl: "https://api.docs.example.test",
      openApiUrl: "https://api.docs.example.test/openapi.json",
      tools: [],
    });

    const mcpViaApiBaseUrl = managedConnectorUpsertSchema.parse({
      slug: "mcp-via-api-base",
      name: "MCP via API base",
      description: "Hosted MCP with a reused base URL field.",
      provider: "mcp",
      authStrategy: "bearer",
      credentialLabel: "MCP token",
      credentialPlaceholder: "mcp_...",
      credentialHelp: "Paste your MCP token.",
      apiBaseUrl: "https://mcp-api-base.example.test/mcp",
    });

    expect(inferredMcp.categories).toEqual([]);
    expect(inferredMcp.tools).toEqual([]);
    expect(inferredMcp.enabled).toBe(true);

    expect(httpWithTools.oauthConfig?.scopes).toEqual([]);
    expect(httpWithTools.tools[0]?.defaultScopes).toEqual([]);
    expect(httpWithTools.tools[0]?.request).toBeUndefined();

    expect(httpWithOpenApi.openApiUrl).toBe("https://api.docs.example.test/openapi.json");
    expect(mcpViaApiBaseUrl.apiBaseUrl).toBe("https://mcp-api-base.example.test/mcp");
  });

  it("rejects MCP connectors without a server URL", () => {
    const result = managedConnectorUpsertSchema.safeParse({
      slug: "broken-mcp",
      name: "Broken MCP",
      description: "Missing an endpoint.",
      provider: "mcp",
      authStrategy: "bearer",
      credentialLabel: "MCP token",
      credentialPlaceholder: "mcp_...",
      credentialHelp: "Paste your MCP token.",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["serverUrl"],
        message: "MCP managed connectors require a serverUrl.",
      }),
    );
  });

  it("rejects HTTP connectors without an API base URL", () => {
    const result = managedConnectorUpsertSchema.safeParse({
      slug: "broken-http",
      name: "Broken HTTP",
      description: "Missing API base URL.",
      provider: "http",
      authStrategy: "api_key",
      credentialLabel: "API key",
      credentialPlaceholder: "api_...",
      credentialHelp: "Paste your API key.",
      tools: [
        {
          name: "list_records",
          description: "List records.",
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["apiBaseUrl"],
        message: "HTTP managed connectors require an apiBaseUrl.",
      }),
    );
  });

  it("rejects HTTP connectors without tool templates or an OpenAPI schema", () => {
    const result = managedConnectorUpsertSchema.safeParse({
      slug: "tool-less-http",
      name: "Tool-less HTTP",
      description: "No tools and no schema.",
      authStrategy: "api_key",
      credentialLabel: "API key",
      credentialPlaceholder: "api_...",
      credentialHelp: "Paste your API key.",
      apiBaseUrl: "https://api.tool-less.example.test",
      tools: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["tools"],
        message:
          "HTTP managed connectors require at least one tool template unless an openApiUrl is provided.",
      }),
    );
  });
});

describe("managedConnectorResponseSchema", () => {
  it("strips OAuth client secrets from API responses and supports list parsing", () => {
    const response = managedConnectorResponseSchema.parse({
      slug: "crm-api",
      name: "CRM API",
      description: "Customer sync tools.",
      categories: ["CRM"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "http",
      credentialLabel: "Connect CRM API",
      credentialPlaceholder: "Connect CRM API",
      credentialHelp: "Use OAuth to connect CRM API.",
      apiBaseUrl: "https://api.crm.example.test",
      oauthConfig: {
        authorizationUrl: "https://auth.crm.example.test/authorize",
        tokenUrl: "https://auth.crm.example.test/token",
        scopes: ["contacts.read"],
      },
      oauthClientId: "client-id",
      oauthClientSecret: "client-secret",
      tools: [
        {
          name: "sync_customers",
          description: "Sync customer records.",
          defaultScopes: ["contacts.read"],
        },
      ],
      enabled: true,
      oauthConfigured: true,
      createdAt: "2026-04-06T00:00:00.000Z",
      updatedAt: "2026-04-06T00:00:00.000Z",
    });

    expect(response).not.toHaveProperty("oauthClientId");
    expect(response).not.toHaveProperty("oauthClientSecret");
    expect(managedConnectorListSchema.parse([response])).toEqual([response]);
  });
});

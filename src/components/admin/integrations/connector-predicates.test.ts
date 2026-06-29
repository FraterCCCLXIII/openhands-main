import { describe, expect, it } from "vitest";

import {
  connectionsByIntegrationKey,
  inferConnectorProvider,
  isOAuthMcpConnector,
  isOAuthMcpWithoutConnection,
} from "@/src/components/admin/integrations/connector-predicates";
import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

const baseConnector = (overrides: Partial<ManagedConnectorDefinition> = {}) =>
  ({
    slug: "slack",
    name: "Slack",
    description: "Slack MCP",
    categories: [],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    provider: "mcp",
    oauthConfigured: true,
    credentialLabel: "Connect Slack",
    credentialPlaceholder: "Connect Slack",
    credentialHelp: "Connect Slack",
    serverUrl: "https://mcp.slack.com/mcp",
    tools: [],
    enabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as ManagedConnectorDefinition;

const connection = (integrationKey: string): IntegrationConnectionStatus => ({
  integrationKey,
  provider: "mcp",
  authStrategy: "oauth2",
  scopes: [],
  metadata: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("connector-predicates", () => {
  it("infers provider from openApiUrl when provider is absent", () => {
    expect(inferConnectorProvider(baseConnector({ provider: undefined, openApiUrl: "https://x/openapi.json" }))).toBe(
      "http",
    );
    expect(inferConnectorProvider(baseConnector({ provider: undefined }))).toBe("mcp");
    expect(inferConnectorProvider(baseConnector({ provider: "http" }))).toBe("http");
  });

  it("identifies an OAuth2 MCP connector without an OpenAPI URL", () => {
    expect(isOAuthMcpConnector(baseConnector())).toBe(true);
    // OAuth2 HTTP connectors (OpenAPI-driven) are excluded — tools come from the schema.
    expect(
      isOAuthMcpConnector(
        baseConnector({ provider: "http", openApiUrl: "https://x/openapi.json", serverUrl: undefined }),
      ),
    ).toBe(false);
    // api_key MCP connectors are excluded.
    expect(isOAuthMcpConnector(baseConnector({ authStrategy: "api_key" }))).toBe(false);
  });

  it("gates only OAuth2 MCP connectors the admin has not connected", () => {
    expect(isOAuthMcpWithoutConnection(baseConnector(), null)).toBe(true);
    expect(isOAuthMcpWithoutConnection(baseConnector(), connection("slack"))).toBe(false);
    // Non-OAuth-MCP connectors are never gated by the connection check.
    expect(
      isOAuthMcpWithoutConnection(
        baseConnector({ authStrategy: "api_key" }),
        null,
      ),
    ).toBe(false);
  });

  it("builds an O(1) connection lookup keyed by integration key", () => {
    const map = connectionsByIntegrationKey([
      connection("slack"),
      connection("notion"),
    ]);
    expect(map.get("slack")?.integrationKey).toBe("slack");
    expect(map.get("notion")?.integrationKey).toBe("notion");
    expect(map.get("github")).toBeUndefined();
    expect(connectionsByIntegrationKey(undefined).size).toBe(0);
  });
});

import type {
  IntegrationConnectionStatus,
  ManagedConnectorDefinition,
} from "@/src/types/integrations-hub";

/**
 * Infer a connector's transport provider when the explicit `provider` field is
 * absent. Falls back to "http" when an OpenAPI URL is present, otherwise "mcp".
 */
export const inferConnectorProvider = (
  connector: ManagedConnectorDefinition,
): "mcp" | "http" =>
  connector.provider ?? (connector.openApiUrl ? "http" : "mcp");

/**
 * OAuth2 MCP connectors (e.g. Slack's hosted MCP) require a user access token
 * on every request, including the `initialize` handshake used to list tools.
 * This predicate identifies that family so the admin UX can gate "Index tools"
 * and shape the setup checklist from a single source of truth. An OAuth2
 * connector with an OpenAPI URL is treated as HTTP (tools come from the
 * schema, not a live MCP handshake), so it is excluded.
 */
export const isOAuthMcpConnector = (connector: ManagedConnectorDefinition) =>
  connector.authStrategy === "oauth2" &&
  inferConnectorProvider(connector) === "mcp" &&
  !connector.openApiUrl;

/**
 * True when an OAuth2 MCP connector cannot be indexed because the acting admin
 * has not connected their own account. Indexing would send an unauthenticated
 * handshake and surface an opaque provider error (Slack returns
 * `missing_token`), so the UI gates the action and surfaces this predicate.
 */
export const isOAuthMcpWithoutConnection = (
  connector: ManagedConnectorDefinition,
  connection: IntegrationConnectionStatus | null,
) => isOAuthMcpConnector(connector) && !connection;

/**
 * Build an O(1) lookup of the acting admin's OAuth connections keyed by
 * integration key. Managed connectors are keyed by slug, which matches the
 * connection's `integrationKey` for managed connectors.
 */
export const connectionsByIntegrationKey = (
  connections: IntegrationConnectionStatus[] | undefined,
): Map<string, IntegrationConnectionStatus> => {
  const map = new Map<string, IntegrationConnectionStatus>();
  for (const connection of connections ?? []) {
    map.set(connection.integrationKey, connection);
  }
  return map;
};

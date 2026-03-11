import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";

export class McpAdapter implements IntegrationAdapter {
  async invoke({ integration, functionSpec, payload }: AdapterInvocationInput) {
    const serverUrl =
      (functionSpec.config.serverUrl as string | undefined) ??
      (integration.config.serverUrl as string | undefined);

    if (!serverUrl) {
      throw new ContextLayerError(
        `Integration '${integration.key}' is missing an MCP serverUrl configuration.`,
        400,
      );
    }

    const toolName =
      (functionSpec.config.toolName as string | undefined) ?? functionSpec.name;

    return runMcpClientOperation(
      serverUrl,
      buildMcpHeaders(integration.authStrategy, integration.credentials),
      `callTool(${toolName})`,
      (client) =>
        client.callTool({
          name: toolName,
          arguments: payload,
        }),
      {
        authStrategy: integration.authStrategy,
        credentials: integration.credentials,
        integrationKey: integration.key,
        managedConnectorSlug:
          (integration.config.managedConnectorSlug as string | undefined) ??
          (integration.config.builtInSlug as string | undefined),
      },
    );
  }
}

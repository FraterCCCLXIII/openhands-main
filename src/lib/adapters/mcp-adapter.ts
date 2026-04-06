import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";

export class McpAdapter implements IntegrationAdapter {
  async invoke({ integration, toolSpec, payload }: AdapterInvocationInput) {
    const serverUrl =
      (toolSpec.config.serverUrl as string | undefined) ??
      (integration.config.serverUrl as string | undefined);

    if (!serverUrl) {
      throw new ContextLayerError(
        `Integration '${integration.key}' is missing an MCP serverUrl configuration.`,
        400,
      );
    }

    const toolName =
      (toolSpec.config.toolName as string | undefined) ?? toolSpec.name;

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

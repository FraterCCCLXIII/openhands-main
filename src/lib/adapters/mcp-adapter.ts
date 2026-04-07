import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";
import { getMcpTransportOrder } from "@/src/lib/mcp-transport-policy";
import { getOptionalTrimmedString } from "@/src/lib/type-utils";

export class McpAdapter implements IntegrationAdapter {
  async invoke({ integration, toolSpec, payload }: AdapterInvocationInput) {
    const serverUrl =
      getOptionalTrimmedString(toolSpec.config, "serverUrl") ??
      getOptionalTrimmedString(integration.config, "serverUrl");

    if (!serverUrl) {
      throw new ContextLayerError(
        `Integration '${integration.key}' is missing an MCP serverUrl configuration.`,
        400,
      );
    }

    const toolName = getOptionalTrimmedString(toolSpec.config, "toolName") ?? toolSpec.name;
    const transportOrder = getMcpTransportOrder(
      serverUrl,
      toolSpec.config,
      integration.config,
    );

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
        debugContext: {
          authStrategy: integration.authStrategy,
          credentials: integration.credentials,
          integrationKey: integration.key,
          managedConnectorSlug:
            getOptionalTrimmedString(integration.config, "managedConnectorSlug") ??
            getOptionalTrimmedString(integration.config, "builtInSlug"),
        },
        transportOrder,
      },
    );
  }
}

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";

const buildHeaders = (
  authStrategy: string,
  credentials: Record<string, unknown>,
): Record<string, string> => {
  if (authStrategy === "api_key") {
    const headerName = (credentials.headerName as string | undefined) ?? "X-API-Key";
    const secret = credentials.secret as string | undefined;
    return secret ? { [headerName]: secret } : {};
  }

  if (authStrategy === "bearer" || authStrategy === "oauth2") {
    const token = credentials.accessToken as string | undefined;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  if (authStrategy === "basic") {
    const username = credentials.username as string | undefined;
    const password = credentials.password as string | undefined;

    if (username && password) {
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
    }
  }

  return {};
};

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

    const client = new Client({
      name: "agent-context-layer",
      version: "0.2.0",
    });

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
      requestInit: {
        headers: buildHeaders(integration.authStrategy, integration.credentials),
      },
    });

    await client.connect(transport);

    try {
      return await client.callTool({
        name: toolName,
        arguments: payload,
      });
    } finally {
      await transport.close();
    }
  }
}

import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { createContextLayerMcpServer } from "@/src/lib/mcp/context-layer-server";
import { handleStatelessMcpRequest } from "@/src/lib/mcp/route-handler";

const BEARER_CHALLENGE = 'Bearer realm="agent-context-layer-mcp"';

const handleMcpRoute = async (request: Request) => {
  try {
    return await handleStatelessMcpRequest(request, async (mcpRequest, apiKey) => {
      const service = getContextLayerService();
      const hasStoredAgentApiKeys = await service.hasStoredAgentApiKeys();

      if (!hasStoredAgentApiKeys) {
        throw new ContextLayerError(
          "Open the dashboard once to provision a personal context-layer API key before agents connect to MCP.",
          503,
        );
      }

      const apiKeyRecord = await service.getStoredAgentApiKey(apiKey);
      if (!apiKeyRecord) {
        throw new ContextLayerError(
          "Provide a valid personal context-layer API key in the Authorization bearer header before connecting to MCP.",
          401,
        );
      }

      return createContextLayerMcpServer({
        request: mcpRequest,
        service,
        ownerId: apiKeyRecord.ownerId,
      });
    });
  } catch (error) {
    if (error instanceof ContextLayerError) {
      return Response.json(
        { detail: error.message },
        {
          status: error.statusCode,
          headers:
            error.statusCode === 401
              ? { "WWW-Authenticate": BEARER_CHALLENGE }
              : undefined,
        },
      );
    }

    throw error;
  }
};

export const POST = handleMcpRoute;
export const GET = handleMcpRoute;
export const DELETE = handleMcpRoute;

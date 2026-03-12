import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { createContextLayerMcpServer } from "@/src/lib/mcp/context-layer-server";

const BEARER_CHALLENGE = 'Bearer realm="agent-context-layer-mcp"';

type McpSessionRecord = {
  transport: WebStandardStreamableHTTPServerTransport;
  ownerId: string;
};

const mcpSessions = new Map<string, McpSessionRecord>();

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

const getSessionId = (request: Request) => request.headers.get("mcp-session-id")?.trim() ?? "";

const authorizeApiKey = async (apiKey: string) => {
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

  return apiKeyRecord;
};

const getAuthorizedSession = (sessionId: string, ownerId: string) => {
  const session = mcpSessions.get(sessionId);

  if (!session || session.ownerId !== ownerId) {
    throw new ContextLayerError(
      "MCP session not found. Reconnect to create a fresh MCP session.",
      404,
    );
  }

  return session;
};

const createSessionTransport = async ({
  request,
  ownerId,
}: {
  request: Request;
  ownerId: string;
}) => {
  const service = getContextLayerService();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sessionId) => {
      mcpSessions.set(sessionId, { transport, ownerId });
    },
  });

  transport.onclose = () => {
    const sessionId = transport.sessionId;

    if (sessionId) {
      mcpSessions.delete(sessionId);
    }
  };

  const server = await createContextLayerMcpServer({
    request,
    service,
    ownerId,
  });

  await server.connect(transport);
  return transport;
};

const handleMcpRoute = async (request: Request) => {
  try {
    if (request.method === "GET" && !getSessionId(request)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    }

    const apiKey = getBearerToken(request);
    if (!apiKey) {
      throw new ContextLayerError(
        "Provide a valid personal context-layer API key in the Authorization bearer header before connecting to MCP.",
        401,
      );
    }

    const apiKeyRecord = await authorizeApiKey(apiKey);
    const sessionId = getSessionId(request);

    if (request.method === "POST") {
      if (sessionId) {
        return getAuthorizedSession(sessionId, apiKeyRecord.ownerId).transport.handleRequest(request);
      }

      const transport = await createSessionTransport({
        request,
        ownerId: apiKeyRecord.ownerId,
      });

      return transport.handleRequest(request);
    }

    if (request.method === "GET") {
      return getAuthorizedSession(sessionId, apiKeyRecord.ownerId).transport.handleRequest(request);
    }

    if (request.method === "DELETE") {
      if (!sessionId) {
        throw new ContextLayerError(
          "MCP session termination requires an mcp-session-id header.",
          400,
        );
      }

      return getAuthorizedSession(sessionId, apiKeyRecord.ownerId).transport.handleRequest(request);
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, POST, DELETE" },
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

export const resetMcpSessionsForTests = async () => {
  const transports = [...mcpSessions.values()].map(({ transport }) => transport);
  mcpSessions.clear();

  await Promise.all(
    transports.map(async (transport) => {
      await transport.close().catch(() => undefined);
    }),
  );
};

export const POST = handleMcpRoute;
export const GET = handleMcpRoute;
export const DELETE = handleMcpRoute;

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { createContextLayerMcpServer } from "@/src/lib/mcp/context-layer-server";
import {
  deleteMcpSession,
  getMcpSession,
  resetMcpSessionsForTests as resetStoredMcpSessionsForTests,
  upsertMcpSession,
  type McpSessionDefaults,
} from "@/src/lib/mcp/session-store";

const BEARER_CHALLENGE = 'Bearer realm="agent-context-layer-mcp"';

type HydratableSessionTransport = {
  sessionId?: string;
  _initialized?: boolean;
};

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

const getSessionId = (request: Request) => request.headers.get("mcp-session-id")?.trim() ?? "";

const getRequestSessionDefaults = (request: Request): McpSessionDefaults => {
  const url = new URL(request.url);

  return {
    agentId: url.searchParams.get("agentId")?.trim() ?? "",
    agentClass: url.searchParams.get("agentClass")?.trim() ?? "",
    agentData: {},
  };
};

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

const getAuthorizedSession = async (sessionId: string, ownerId: string) => {
  const session = await getMcpSession(sessionId);

  if (!session || session.ownerId !== ownerId) {
    throw new ContextLayerError(
      "MCP session not found. Reconnect to create a fresh MCP session.",
      404,
    );
  }

  return session;
};

const hydrateTransportSession = (
  transport: WebStandardStreamableHTTPServerTransport,
  sessionId: string,
) => {
  const hydratedTransport = transport as unknown as HydratableSessionTransport;
  hydratedTransport.sessionId = sessionId;
  hydratedTransport._initialized = true;
};

const createSessionTransport = async ({
  request,
  ownerId,
  sessionId,
  sessionDefaults,
}: {
  request: Request;
  ownerId: string;
  sessionId?: string;
  sessionDefaults: McpSessionDefaults;
}) => {
  const service = getContextLayerService();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: () => sessionId ?? crypto.randomUUID(),
    onsessioninitialized: async (initializedSessionId) => {
      await upsertMcpSession({
        sessionId: initializedSessionId,
        ownerId,
        defaults: { ...sessionDefaults },
      });
    },
    onsessionclosed: async (closedSessionId) => {
      if (closedSessionId) {
        await deleteMcpSession(closedSessionId);
      }
    },
  });

  if (sessionId) {
    hydrateTransportSession(transport, sessionId);
  }

  const server = await createContextLayerMcpServer({
    request,
    service,
    ownerId,
    sessionDefaults,
    onSessionDefaultsChanged: async (defaults) => {
      const activeSessionId = transport.sessionId ?? sessionId;

      if (!activeSessionId) {
        return;
      }

      await upsertMcpSession({
        sessionId: activeSessionId,
        ownerId,
        defaults,
      });
    },
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
        const session = await getAuthorizedSession(sessionId, apiKeyRecord.ownerId);
        const transport = await createSessionTransport({
          request,
          ownerId: apiKeyRecord.ownerId,
          sessionId,
          sessionDefaults: session.defaults,
        });

        return transport.handleRequest(request);
      }

      const transport = await createSessionTransport({
        request,
        ownerId: apiKeyRecord.ownerId,
        sessionDefaults: getRequestSessionDefaults(request),
      });

      return transport.handleRequest(request);
    }

    if (request.method === "GET") {
      const session = await getAuthorizedSession(sessionId, apiKeyRecord.ownerId);
      const transport = await createSessionTransport({
        request,
        ownerId: apiKeyRecord.ownerId,
        sessionId,
        sessionDefaults: session.defaults,
      });

      return transport.handleRequest(request);
    }

    if (request.method === "DELETE") {
      if (!sessionId) {
        throw new ContextLayerError(
          "MCP session termination requires an mcp-session-id header.",
          400,
        );
      }

      const session = await getAuthorizedSession(sessionId, apiKeyRecord.ownerId);
      const transport = await createSessionTransport({
        request,
        ownerId: apiKeyRecord.ownerId,
        sessionId,
        sessionDefaults: session.defaults,
      });

      return transport.handleRequest(request);
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
  await resetStoredMcpSessionsForTests();
};

export const POST = handleMcpRoute;
export const GET = handleMcpRoute;
export const DELETE = handleMcpRoute;

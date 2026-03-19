import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

export const handleStatelessMcpRequest = async (
  request: Request,
  buildServer: (request: Request, token: string) => Promise<McpServer> | McpServer,
) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const token = getBearerToken(request);
  if (!token) {
    return Response.json(
      { detail: "Authorization: Bearer <token> is required." },
      { status: 401 },
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = await buildServer(request, token);

  await server.connect(transport);
  return transport.handleRequest(request);
};

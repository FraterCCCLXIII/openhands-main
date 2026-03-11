import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { ContextLayerError } from "@/src/lib/core/errors";
import type { AuthStrategy } from "@/src/types/context-layer";

const MCP_OPERATION_TIMEOUT_MS = 10_000;
const MCP_CLIENT_INFO = {
  name: "agent-context-layer",
  version: "0.2.0",
};

type McpTransportKind = "streamable_http" | "sse";

type McpClientOperation<T> = (client: Client) => Promise<T>;

const buildTimeoutError = (message: string) =>
  new ContextLayerError(message, 504);

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMessage: string,
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(buildTimeoutError(timeoutMessage));
        }, MCP_OPERATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const closeTransport = async (transport: { close?: () => Promise<void> | void }) => {
  try {
    await transport.close?.();
  } catch {
    // ignore transport shutdown errors
  }
};

const getNotionFallbackUrl = (serverUrl: string) => {
  const url = new URL(serverUrl);
  if (url.hostname !== "mcp.notion.com") {
    return null;
  }

  if (url.pathname === "/mcp" || url.pathname === "/mcp/") {
    url.pathname = "/sse";
    return url;
  }

  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/sse";
    return url;
  }

  return null;
};

const createTransport = (
  kind: McpTransportKind,
  url: URL,
  headers: Record<string, string>,
) => {
  if (kind === "sse") {
    return new SSEClientTransport(url, {
      requestInit: {
        headers,
      },
    });
  }

  return new StreamableHTTPClientTransport(url, {
    requestInit: {
      headers,
    },
  });
};

const formatAttemptError = (kind: McpTransportKind, url: URL, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown MCP error";
  return `${kind === "streamable_http" ? "Streamable HTTP" : "SSE"} transport failed for ${url.toString()}: ${message}`;
};

const runTransportAttempt = async <T,>(
  kind: McpTransportKind,
  url: URL,
  headers: Record<string, string>,
  operationName: string,
  operation: McpClientOperation<T>,
): Promise<T> => {
  const client = new Client(MCP_CLIENT_INFO);
  const transport = createTransport(kind, url, headers);

  try {
    await withTimeout(
      client.connect(transport),
      `Timed out connecting to ${url.toString()} over ${kind === "streamable_http" ? "Streamable HTTP" : "SSE"}.`,
    );
    return await withTimeout(
      operation(client),
      `Timed out running ${operationName} against ${url.toString()}.`,
    );
  } finally {
    await closeTransport(transport);
  }
};

export const buildMcpHeaders = (
  authStrategy: AuthStrategy,
  credentials: Record<string, unknown>,
): Record<string, string> => {
  if (authStrategy === "api_key") {
    const headerName =
      (credentials.headerName as string | undefined) ?? "X-API-Key";
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

export const runMcpClientOperation = async <T,>(
  serverUrl: string,
  headers: Record<string, string>,
  operationName: string,
  operation: McpClientOperation<T>,
): Promise<T> => {
  const primaryUrl = new URL(serverUrl);
  const fallbackUrl = getNotionFallbackUrl(serverUrl);

  try {
    return await runTransportAttempt(
      "streamable_http",
      primaryUrl,
      headers,
      operationName,
      operation,
    );
  } catch (primaryError) {
    const primaryMessage = formatAttemptError(
      "streamable_http",
      primaryUrl,
      primaryError,
    );

    if (!fallbackUrl) {
      console.error(`[mcp] ${operationName} failed. ${primaryMessage}`);
      throw primaryError;
    }

    console.warn(
      `[mcp] ${operationName} primary transport failed; retrying with SSE. ${primaryMessage}`,
    );

    try {
      const result = await runTransportAttempt(
        "sse",
        fallbackUrl,
        headers,
        operationName,
        operation,
      );
      console.warn(
        `[mcp] ${operationName} succeeded via SSE fallback for ${fallbackUrl.toString()}.`,
      );
      return result;
    } catch (fallbackError) {
      const fallbackMessage = formatAttemptError("sse", fallbackUrl, fallbackError);
      console.error(
        `[mcp] ${operationName} failed after fallback. ${primaryMessage} ${fallbackMessage}`,
      );
      throw new ContextLayerError(
        `${primaryMessage} ${fallbackMessage}`,
        fallbackError instanceof ContextLayerError
          ? fallbackError.statusCode
          : primaryError instanceof ContextLayerError
            ? primaryError.statusCode
            : 502,
      );
    }
  }
};

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  McpTransportKind,
  McpTransportTarget,
} from "@/src/lib/mcp-transport-policy";
import { getOptionalString, getOptionalTrimmedString } from "@/src/lib/type-utils";
import type { AuthStrategy } from "@/src/types/context-layer";

const MCP_OPERATION_TIMEOUT_MS = 10_000;
const MCP_CLIENT_INFO = {
  name: "agent-context-layer",
  version: "0.2.0",
};

type McpClientOperation<T> = (client: Client) => Promise<T>;

export interface McpDebugContext {
  authStrategy: AuthStrategy;
  credentials: Record<string, unknown>;
  integrationKey?: string;
  managedConnectorSlug?: string;
}

interface McpAttemptDebug {
  transport: McpTransportKind;
  url: string;
  error: string;
}

export interface RunMcpClientOperationOptions {
  debugContext?: McpDebugContext;
  transportOrder?: McpTransportTarget[];
}

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

const formatTransportName = (kind: McpTransportKind) =>
  kind === "streamable_http" ? "Streamable HTTP" : "SSE";

const formatAttemptError = (kind: McpTransportKind, url: URL, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown MCP error";
  return `${formatTransportName(kind)} transport failed for ${url.toString()}: ${message}`;
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
      `Timed out connecting to ${url.toString()} over ${formatTransportName(kind)}.`,
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
    const headerName = getOptionalTrimmedString(credentials, "headerName") ?? "X-API-Key";
    const secret = getOptionalTrimmedString(credentials, "secret");
    return secret ? { [headerName]: secret } : {};
  }

  if (authStrategy === "bearer" || authStrategy === "oauth2") {
    const token = getOptionalTrimmedString(credentials, "accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  if (authStrategy === "basic") {
    const username = getOptionalTrimmedString(credentials, "username");
    const password = getOptionalTrimmedString(credentials, "password");

    if (username && password) {
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
    }
  }

  return {};
};

const summarizeStringCredential = (value: unknown) => {
  if (typeof value !== "string") {
    return {
      present: false,
    };
  }

  const trimmed = value.trim();
  return {
    present: trimmed.length > 0,
    length: trimmed.length,
    containsWhitespace: /\s/.test(value),
  };
};

const summarizeTokenCredential = (value: unknown) => {
  const summary = summarizeStringCredential(value);
  if (!summary.present || typeof value !== "string") {
    return summary;
  }

  return {
    ...summary,
    startsWithBearerPrefix: value.trim().startsWith("Bearer "),
  };
};

const buildMcpDebugDetails = (
  operationName: string,
  serverUrl: string,
  debugContext: McpDebugContext | undefined,
  attempts: McpAttemptDebug[],
) => ({
  operationName,
  serverUrl,
  integrationKey: debugContext?.integrationKey,
  managedConnectorSlug: debugContext?.managedConnectorSlug,
  auth: debugContext
    ? {
        authStrategy: debugContext.authStrategy,
        accessToken: summarizeTokenCredential(debugContext.credentials.accessToken),
        refreshToken: summarizeStringCredential(debugContext.credentials.refreshToken),
        secret: summarizeStringCredential(debugContext.credentials.secret),
        headerName: getOptionalString(debugContext.credentials, "headerName"),
        usernameProvided:
          typeof debugContext.credentials.username === "string" &&
          debugContext.credentials.username.trim().length > 0,
        passwordProvided:
          typeof debugContext.credentials.password === "string" &&
          debugContext.credentials.password.trim().length > 0,
      }
    : undefined,
  attempts,
});

const toContextLayerError = (
  message: string,
  error: unknown,
  debugDetails: Record<string, unknown>,
) =>
  new ContextLayerError(
    message,
    error instanceof ContextLayerError ? error.statusCode : 502,
    debugDetails,
  );

export const runMcpClientOperation = async <T,>(
  serverUrl: string,
  headers: Record<string, string>,
  operationName: string,
  operation: McpClientOperation<T>,
  options: RunMcpClientOperationOptions = {},
): Promise<T> => {
  const attempts: McpAttemptDebug[] = [];
  const orderedTargets: McpTransportTarget[] = options.transportOrder?.length
    ? options.transportOrder
    : [
        {
          transport: "streamable_http",
          url: serverUrl,
        },
      ];
  const transportPlan: Array<{ transport: McpTransportKind; url: URL }> =
    orderedTargets.map((target) => ({
      transport: target.transport,
      url: new URL(target.url),
    }));
  let firstError: unknown;

  for (const [index, attempt] of transportPlan.entries()) {
    try {
      const result = await runTransportAttempt(
        attempt.transport,
        attempt.url,
        headers,
        operationName,
        operation,
      );

      if (index > 0) {
        console.warn(
          `[mcp] ${operationName} succeeded via ${formatTransportName(attempt.transport)} after retrying transport order at ${attempt.url.toString()}.`,
        );
      }

      return result;
    } catch (error) {
      const message = formatAttemptError(attempt.transport, attempt.url, error);
      attempts.push({
        transport: attempt.transport,
        url: attempt.url.toString(),
        error: message,
      });
      firstError ??= error;

      const nextAttempt = transportPlan[index + 1];
      if (nextAttempt) {
        console.warn(
          `[mcp] ${operationName} transport failed; retrying with ${formatTransportName(nextAttempt.transport)}. ${message}`,
        );
        continue;
      }

      const combinedMessage = attempts.map((entry) => entry.error).join(" ");
      console.error(
        `[mcp] ${operationName} failed${attempts.length > 1 ? " after trying multiple transports" : ""}. ${combinedMessage}`,
      );

      const debugDetails = buildMcpDebugDetails(
        operationName,
        serverUrl,
        options.debugContext,
        attempts,
      );

      if (attempts.length === 1) {
        throw toContextLayerError(message, error, debugDetails);
      }

      throw new ContextLayerError(
        combinedMessage,
        error instanceof ContextLayerError
          ? error.statusCode
          : firstError instanceof ContextLayerError
            ? firstError.statusCode
            : 502,
        debugDetails,
      );
    }
  }

  throw new ContextLayerError(
    `No MCP transports configured for ${operationName}.`,
    500,
  );
};

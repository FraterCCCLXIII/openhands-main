import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  callToolMock,
  closeMock,
  connectMock,
  listToolsMock,
  transportAttempts,
} = vi.hoisted(() => ({
  connectMock: vi.fn<(transport: { kind: string }) => Promise<void>>(),
  listToolsMock: vi.fn<
    () => Promise<{ tools: Array<{ name: string; description?: string }> }>
  >(),
  callToolMock: vi.fn<(args: unknown) => Promise<{ content: unknown[] }>>(),
  closeMock: vi.fn<
    (kind: string, url: string) => Promise<void>
  >(),
  transportAttempts: [] as Array<{
    kind: "streamable_http" | "sse";
    url: string;
    headers?: Record<string, string>;
  }>,
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: class MockClient {
    async connect(transport: { kind: string }) {
      return connectMock(transport);
    }

    async listTools() {
      return listToolsMock();
    }

    async callTool(args: unknown) {
      return callToolMock(args);
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: class MockStreamableTransport {
    kind = "streamable_http" as const;
    url: string;

    constructor(
      url: URL,
      options?: { requestInit?: { headers?: Record<string, string> } },
    ) {
      this.url = url.toString();
      transportAttempts.push({
        kind: this.kind,
        url: this.url,
        headers: options?.requestInit?.headers,
      });
    }

    async close() {
      return closeMock(this.kind, this.url);
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: class MockSseTransport {
    kind = "sse" as const;
    url: string;

    constructor(
      url: URL,
      options?: { requestInit?: { headers?: Record<string, string> } },
    ) {
      this.url = url.toString();
      transportAttempts.push({
        kind: this.kind,
        url: this.url,
        headers: options?.requestInit?.headers,
      });
    }

    async close() {
      return closeMock(this.kind, this.url);
    }
  },
}));

import { ContextLayerError } from "@/src/lib/core/errors";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";

beforeEach(() => {
  connectMock.mockReset();
  connectMock.mockResolvedValue(undefined);
  listToolsMock.mockReset();
  listToolsMock.mockResolvedValue({ tools: [] });
  callToolMock.mockReset();
  callToolMock.mockResolvedValue({ content: [] });
  closeMock.mockReset();
  closeMock.mockResolvedValue(undefined);
  transportAttempts.splice(0, transportAttempts.length);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildMcpHeaders", () => {
  it("sends bearer credentials as Authorization: Bearer header", () => {
    expect(buildMcpHeaders("bearer", { accessToken: "ord_test_key" })).toEqual({
      Authorization: "Bearer ord_test_key",
    });
  });

  it("sends api_key credentials in a custom header without Bearer prefix", () => {
    expect(
      buildMcpHeaders("api_key", { headerName: "X-API-Key", secret: "sk_123" }),
    ).toEqual({ "X-API-Key": "sk_123" });
  });

  it("returns empty headers when no token is provided for bearer", () => {
    expect(buildMcpHeaders("bearer", {})).toEqual({});
  });

  it("ignores malformed credential values instead of emitting invalid headers", () => {
    expect(
      buildMcpHeaders("api_key", {
        headerName: { invalid: true },
        secret: { invalid: true },
      }),
    ).toEqual({});

    expect(
      buildMcpHeaders("basic", {
        username: "demo",
        password: { invalid: true },
      }),
    ).toEqual({});
  });
});

describe("runMcpClientOperation", () => {
  it("retries transports in the configured order", async () => {
    vi.useFakeTimers();
    connectMock.mockImplementation((transport: { kind: string }) => {
      if (transport.kind === "streamable_http") {
        return new Promise<void>(() => undefined);
      }

      return Promise.resolve();
    });
    listToolsMock.mockResolvedValue({
      tools: [{ name: "searchPages", description: "Search pages" }],
    });

    const operation = runMcpClientOperation(
      "https://mcp.acme.test/mcp",
      { Authorization: "Bearer acme-token" },
      "listTools",
      (client) => client.listTools(),
      {
        transportOrder: [
          {
            transport: "streamable_http",
            url: "https://mcp.acme.test/mcp",
          },
          {
            transport: "sse",
            url: "https://mcp.acme.test/sse",
          },
        ],
      },
    );

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(operation).resolves.toEqual({
      tools: [{ name: "searchPages", description: "Search pages" }],
    });
    expect(transportAttempts).toEqual([
      {
        kind: "streamable_http",
        url: "https://mcp.acme.test/mcp",
        headers: { Authorization: "Bearer acme-token" },
      },
      {
        kind: "sse",
        url: "https://mcp.acme.test/sse",
        headers: { Authorization: "Bearer acme-token" },
      },
    ]);
  });

  it("defaults to streamable HTTP when no transport order is configured", async () => {
    connectMock.mockRejectedValue(new Error("streamable failed"));

    await expect(
      runMcpClientOperation(
        "https://mcp.acme.test/mcp",
        { Authorization: "Bearer acme-token" },
        "listTools",
        (client) => client.listTools(),
      ),
    ).rejects.toThrow("streamable failed");

    expect(transportAttempts).toEqual([
      {
        kind: "streamable_http",
        url: "https://mcp.acme.test/mcp",
        headers: { Authorization: "Bearer acme-token" },
      },
    ]);
  });

  it("honors a custom first transport in the configured order", async () => {
    listToolsMock.mockResolvedValue({
      tools: [{ name: "searchPages", description: "Search pages" }],
    });

    await expect(
      runMcpClientOperation(
        "https://mcp.acme.test/mcp",
        { Authorization: "Bearer acme-token" },
        "listTools",
        (client) => client.listTools(),
        {
          transportOrder: [
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
            {
              transport: "streamable_http",
              url: "https://mcp.acme.test/mcp",
            },
          ],
        },
      ),
    ).resolves.toEqual({
      tools: [{ name: "searchPages", description: "Search pages" }],
    });

    expect(transportAttempts).toEqual([
      {
        kind: "sse",
        url: "https://mcp.acme.test/sse",
        headers: { Authorization: "Bearer acme-token" },
      },
    ]);
  });

  it("captures sanitized credential diagnostics on MCP failures", async () => {
    connectMock.mockRejectedValue(new Error("invalid token"));

    let capturedError: unknown;
    try {
      await runMcpClientOperation(
        "https://mcp.acme.test/mcp",
        { Authorization: "Bearer token" },
        "listTools",
        (client) => client.listTools(),
        {
          debugContext: {
            authStrategy: "oauth2",
            credentials: {
              accessToken: "Bearer malformed-token\n",
            },
            integrationKey: "notion",
            managedConnectorSlug: "notion",
          },
        },
      );
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(ContextLayerError);
    expect((capturedError as ContextLayerError).debugDetails).toEqual({
      operationName: "listTools",
      serverUrl: "https://mcp.acme.test/mcp",
      integrationKey: "notion",
      managedConnectorSlug: "notion",
      auth: {
        authStrategy: "oauth2",
        accessToken: {
          present: true,
          length: 22,
          containsWhitespace: true,
          startsWithBearerPrefix: true,
        },
        refreshToken: {
          present: false,
        },
        secret: {
          present: false,
        },
        headerName: undefined,
        usernameProvided: false,
        passwordProvided: false,
      },
      attempts: [
        {
          transport: "streamable_http",
          url: "https://mcp.acme.test/mcp",
          error:
            "Streamable HTTP transport failed for https://mcp.acme.test/mcp: invalid token",
        },
      ],
    });
  });

  it("supports oauth2, default api-key, and basic auth header construction", () => {
    expect(buildMcpHeaders("oauth2", { accessToken: "oauth-token" })).toEqual({
      Authorization: "Bearer oauth-token",
    });
    expect(buildMcpHeaders("api_key", { secret: "sk_default" })).toEqual({
      "X-API-Key": "sk_default",
    });
    expect(
      buildMcpHeaders("basic", {
        username: "demo",
        password: "s3cret",
      }),
    ).toEqual({
      Authorization: `Basic ${Buffer.from("demo:s3cret").toString("base64")}`,
    });
  });

  it("retries a configured fallback transport and ignores transport close errors", async () => {
    connectMock.mockImplementation((transport: { kind: string }) => {
      if (transport.kind === "streamable_http") {
        return Promise.reject(new Error("streamable failed"));
      }

      return Promise.resolve();
    });
    closeMock.mockRejectedValue(new Error("close failed"));
    listToolsMock.mockResolvedValue({
      tools: [{ name: "search", description: "Search pages" }],
    });

    await expect(
      runMcpClientOperation(
        "https://mcp.acme.test/mcp",
        { Authorization: "Bearer acme-token" },
        "listTools",
        (client) => client.listTools(),
        {
          transportOrder: [
            {
              transport: "streamable_http",
              url: "https://mcp.acme.test/mcp",
            },
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
          ],
        },
      ),
    ).resolves.toEqual({
      tools: [{ name: "search", description: "Search pages" }],
    });

    expect(transportAttempts).toEqual([
      {
        kind: "streamable_http",
        url: "https://mcp.acme.test/mcp",
        headers: { Authorization: "Bearer acme-token" },
      },
      {
        kind: "sse",
        url: "https://mcp.acme.test/sse",
        headers: { Authorization: "Bearer acme-token" },
      },
    ]);
  });

  it("surfaces multiple configured transport failures with sanitized debug details", async () => {
    connectMock.mockImplementation((transport: { kind: string }) => {
      if (transport.kind === "streamable_http") {
        return Promise.reject(new ContextLayerError("streamable unavailable", 504));
      }

      return Promise.reject(new ContextLayerError("sse unavailable", 429));
    });

    let capturedError: unknown;
    try {
      await runMcpClientOperation(
        "https://mcp.acme.test/mcp",
        { Authorization: "Bearer acme-token" },
        "callTool",
        (client) => client.listTools(),
        {
          debugContext: {
            authStrategy: "basic",
            credentials: {
              username: "demo",
              password: "  pass with space  ",
              refreshToken: " refresh-token ",
            },
          },
          transportOrder: [
            {
              transport: "streamable_http",
              url: "https://mcp.acme.test/mcp",
            },
            {
              transport: "sse",
              url: "https://mcp.acme.test/sse",
            },
          ],
        },
      );
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(ContextLayerError);
    expect((capturedError as ContextLayerError).message).toContain(
      "Streamable HTTP transport failed for https://mcp.acme.test/mcp: streamable unavailable",
    );
    expect((capturedError as ContextLayerError).message).toContain(
      "SSE transport failed for https://mcp.acme.test/sse: sse unavailable",
    );
    expect((capturedError as ContextLayerError).statusCode).toBe(429);
    expect((capturedError as ContextLayerError).debugDetails).toEqual({
      operationName: "callTool",
      serverUrl: "https://mcp.acme.test/mcp",
      integrationKey: undefined,
      managedConnectorSlug: undefined,
      auth: {
        authStrategy: "basic",
        accessToken: {
          present: false,
        },
        refreshToken: {
          present: true,
          length: 13,
          containsWhitespace: true,
        },
        secret: {
          present: false,
        },
        headerName: undefined,
        usernameProvided: true,
        passwordProvided: true,
      },
      attempts: [
        {
          transport: "streamable_http",
          url: "https://mcp.acme.test/mcp",
          error:
            "Streamable HTTP transport failed for https://mcp.acme.test/mcp: streamable unavailable",
        },
        {
          transport: "sse",
          url: "https://mcp.acme.test/sse",
          error: "SSE transport failed for https://mcp.acme.test/sse: sse unavailable",
        },
      ],
    });
  });

});

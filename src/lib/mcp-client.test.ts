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
  it("falls back to Notion SSE when streamable HTTP times out", async () => {
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
      "https://mcp.notion.com/mcp",
      { Authorization: "Bearer notion-token" },
      "listTools",
      (client) => client.listTools(),
    );

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(operation).resolves.toEqual({
      tools: [{ name: "searchPages", description: "Search pages" }],
    });
    expect(transportAttempts).toEqual([
      {
        kind: "streamable_http",
        url: "https://mcp.notion.com/mcp",
        headers: { Authorization: "Bearer notion-token" },
      },
      {
        kind: "sse",
        url: "https://mcp.notion.com/sse",
        headers: { Authorization: "Bearer notion-token" },
      },
    ]);
  });

  it("does not attempt SSE fallback for non-Notion MCP servers", async () => {
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
          authStrategy: "oauth2",
          credentials: {
            accessToken: "Bearer malformed-token\n",
          },
          integrationKey: "notion",
          managedConnectorSlug: "notion",
        },
      );
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(ContextLayerError);
    expect((capturedError as ContextLayerError).debugDetails).toEqual({
      operationName: "listTools",
      serverUrl: "https://mcp.acme.test/mcp",
      fallbackUrl: undefined,
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
});

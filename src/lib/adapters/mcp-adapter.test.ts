import { beforeEach, describe, expect, it, vi } from "vitest";

const { runMcpClientOperationMock } = vi.hoisted(() => ({
  runMcpClientOperationMock: vi.fn(),
}));

vi.mock("@/src/lib/mcp-client", async () => {
  const actual = await vi.importActual<typeof import("@/src/lib/mcp-client")>(
    "@/src/lib/mcp-client",
  );

  return {
    ...actual,
    runMcpClientOperation: runMcpClientOperationMock,
  };
});

import { McpAdapter } from "@/src/lib/adapters/mcp-adapter";
import type { AdapterInvocationInput } from "@/src/lib/core/adapter-registry";

const buildInput = (): AdapterInvocationInput => ({
  agentId: "agent-123",
  integration: {
    key: "notion",
    name: "Notion",
    kind: "mcp",
    provider: "mcp",
    authStrategy: "bearer",
    enabled: true,
    fineGrainedPermissions: false,
    config: {
      serverUrl: "https://integration.example/mcp",
      managedConnectorSlug: "notion",
    },
    credentials: {
      accessToken: "notion-token",
    },
    tools: {},
  },
  toolSpec: {
    name: "search",
    description: "Search pages",
    enabled: true,
    fineGrainedPermissions: false,
    defaultScopes: [],
    executionMode: "provider",
    config: {},
  },
  payload: {
    query: "workspace docs",
  },
});

beforeEach(() => {
  runMcpClientOperationMock.mockReset();
});

describe("McpAdapter", () => {
  it("throws a 400 error when neither the tool nor integration defines a server URL", async () => {
    const adapter = new McpAdapter();
    const input = buildInput();
    input.integration.config = {};

    await expect(adapter.invoke(input)).rejects.toMatchObject({
      name: "ContextLayerError",
      statusCode: 400,
      message: "Integration 'notion' is missing an MCP serverUrl configuration.",
    });
    expect(runMcpClientOperationMock).not.toHaveBeenCalled();
  });

  it("uses tool-specific server URL and tool name overrides when invoking the MCP client", async () => {
    runMcpClientOperationMock.mockResolvedValueOnce({ content: [{ type: "text", text: "ok" }] });

    const adapter = new McpAdapter();
    const input = buildInput();
    input.toolSpec.config = {
      serverUrl: "https://tool.example/mcp",
      toolName: "searchPages",
    };

    await expect(adapter.invoke(input)).resolves.toEqual({
      content: [{ type: "text", text: "ok" }],
    });

    expect(runMcpClientOperationMock).toHaveBeenCalledTimes(1);
    const [serverUrl, headers, operationName, operation, metadata] =
      runMcpClientOperationMock.mock.calls[0] ?? [];

    expect(serverUrl).toBe("https://tool.example/mcp");
    expect(headers).toEqual({ Authorization: "Bearer notion-token" });
    expect(operationName).toBe("callTool(searchPages)");
    expect(metadata).toEqual({
      authStrategy: "bearer",
      credentials: { accessToken: "notion-token" },
      integrationKey: "notion",
      managedConnectorSlug: "notion",
    });

    const client = {
      callTool: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "tool result" }] }),
    };
    await expect(operation(client)).resolves.toEqual({
      content: [{ type: "text", text: "tool result" }],
    });
    expect(client.callTool).toHaveBeenCalledWith({
      name: "searchPages",
      arguments: { query: "workspace docs" },
    });
  });

  it("falls back to the integration server URL and original tool name", async () => {
    runMcpClientOperationMock.mockResolvedValueOnce({ ok: true });

    const adapter = new McpAdapter();
    const input = buildInput();

    await expect(adapter.invoke(input)).resolves.toEqual({ ok: true });

    expect(runMcpClientOperationMock).toHaveBeenCalledWith(
      "https://integration.example/mcp",
      { Authorization: "Bearer notion-token" },
      "callTool(search)",
      expect.any(Function),
      expect.objectContaining({
        integrationKey: "notion",
        managedConnectorSlug: "notion",
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContextLayerError } from "@/src/lib/core/errors";
import {
  CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME,
  CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME,
  CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME,
  buildContextLayerMcpToolName,
  createContextLayerMcpServer,
} from "@/src/lib/mcp/context-layer-server";
import type { ContextLayerService } from "@/src/lib/core/service";
import type { IntegrationSpec } from "@/src/types/context-layer";

const { registeredTools } = vi.hoisted(() => ({
  registeredTools: new Map<
    string,
    {
      metadata: { description?: string; inputSchema?: { parse: (value: unknown) => unknown } };
      handler: (args: unknown) => Promise<unknown>;
    }
  >(),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class MockMcpServer {
    registerTool(
      name: string,
      metadata: { description?: string; inputSchema?: { parse: (value: unknown) => unknown } },
      handler: (args: unknown) => Promise<unknown>,
    ) {
      registeredTools.set(name, { metadata, handler });
    }
  },
}));

const buildIntegration = (
  overrides?: Partial<IntegrationSpec>,
): IntegrationSpec => ({
  key: "crm",
  name: "CRM",
  kind: "api",
  provider: "mock",
  authStrategy: "none",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  tools: {
    accounts: {
      name: "accounts",
      description: "List accounts",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["crm.read"],
      executionMode: "mock",
      config: {},
    },
    contacts: {
      name: "contacts",
      description: "List contacts",
      enabled: true,
      accessMode: "approval_required",
      fineGrainedPermissions: true,
      defaultScopes: ["crm.read"],
      executionMode: "mock",
      config: {},
    },
    hidden: {
      name: "hidden",
      description: "Hidden tool",
      enabled: false,
      accessMode: "disabled",
      fineGrainedPermissions: true,
      defaultScopes: ["crm.admin"],
      executionMode: "mock",
      config: {},
    },
  },
  ...overrides,
});

const getRegisteredTool = (name: string) => {
  const tool = registeredTools.get(name);
  expect(tool).toBeDefined();
  return tool!;
};

const createService = () => {
  const service = {
    listOwnerIntegrations: vi.fn<ContextLayerService["listOwnerIntegrations"]>(),
    listIntegrationConnections: vi.fn<ContextLayerService["listIntegrationConnections"]>(),
    evaluateAccess: vi.fn<ContextLayerService["evaluateAccess"]>(),
    invokeContext: vi.fn<ContextLayerService["invokeContext"]>(),
  } as unknown as ContextLayerService & {
    listOwnerIntegrations: ReturnType<typeof vi.fn>;
    listIntegrationConnections: ReturnType<typeof vi.fn>;
    evaluateAccess: ReturnType<typeof vi.fn>;
    invokeContext: ReturnType<typeof vi.fn>;
  };

  service.listIntegrationConnections.mockResolvedValue([]);
  service.evaluateAccess.mockResolvedValue({
    allowed: true,
    reason: "",
    effectiveScopes: ["crm.read"],
  });

  return service;
};

beforeEach(() => {
  registeredTools.clear();
});

describe("createContextLayerMcpServer", () => {
  it("registers only enabled tools and annotates approval-required descriptions", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([
      buildIntegration(),
      buildIntegration({ key: "disabled", enabled: false, tools: {} }),
    ]);

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
    });

    expect([...registeredTools.keys()].sort()).toEqual([
      "crm__accounts",
      "crm__contacts",
      CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME,
      CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME,
      CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME,
    ]);
    expect(registeredTools.has("crm__hidden")).toBe(false);
    expect(registeredTools.has("disabled__accounts")).toBe(false);

    expect(getRegisteredTool("crm__contacts").metadata.description).toContain(
      "This tool is case-by-case and returns an approval link until a temporary grant is active.",
    );
    expect(getRegisteredTool("crm__contacts").metadata.description).toContain(
      "Original function name: contacts.",
    );
  });

  it("persists trimmed session agent settings and clears them when null is provided", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    const persistedDefaults: unknown[] = [];

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
      onSessionDefaultsChanged: async (defaults) => {
        persistedDefaults.push(defaults);
      },
    });

    const setAgentId = getRegisteredTool(CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME);
    const parsedAgentId = setAgentId.metadata.inputSchema?.parse({ agentId: "  agent-42  " }) as {
      agentId: string | null;
    };
    await expect(setAgentId.handler(parsedAgentId)).resolves.toMatchObject({
      structuredContent: { agentId: "agent-42" },
      content: [{ text: "MCP session agentId set to agent-42." }],
    });

    const parsedAgentIdClear = setAgentId.metadata.inputSchema?.parse({ agentId: null }) as {
      agentId: string | null;
    };
    await expect(setAgentId.handler(parsedAgentIdClear)).resolves.toMatchObject({
      structuredContent: { agentId: null },
      content: [{ text: "MCP session agentId cleared." }],
    });

    const setAgentClass = getRegisteredTool(CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME);
    const parsedAgentClass = setAgentClass.metadata.inputSchema?.parse({
      agentClass: " reviewer ",
    }) as { agentClass: string | null };
    await expect(setAgentClass.handler(parsedAgentClass)).resolves.toMatchObject({
      structuredContent: { agentClass: "reviewer" },
      content: [{ text: "MCP session agentClass set to reviewer." }],
    });

    expect(() =>
      setAgentClass.metadata.inputSchema?.parse({ agentClass: 42 })
    ).toThrow();
    expect(persistedDefaults).toEqual([
      { agentId: "agent-42", agentClass: null, agentData: {} },
      { agentId: null, agentClass: null, agentData: {} },
      { agentId: null, agentClass: "reviewer", agentData: {} },
    ]);
  });

  it("uses request query defaults for approval checks and formats scalar results", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    service.invokeContext.mockResolvedValue({
      integration: "crm",
      tool: "contacts",
      provider: "mock",
      kind: "api",
      authStrategy: "none",
      decision: { allowed: true, reason: "", effectiveScopes: ["crm.read"] },
      data: 7,
    });

    await createContextLayerMcpServer({
      request: new Request(
        "https://api.example.test/api/mcp?agentId=%20agent-123%20&agentClass=%20reviewer%20",
        {
          headers: {
            "x-forwarded-host": "agents.example.test",
            "x-forwarded-proto": "https",
          },
        },
      ),
      service,
      ownerId: "owner@example.com",
    });

    const result = await getRegisteredTool("crm__contacts").handler({
      contextScopes: ["crm.read"],
      accountId: "acct_1",
    });

    expect(service.evaluateAccess).toHaveBeenCalledWith(
      "agent-123",
      "reviewer",
      "crm",
      "contacts",
      ["crm.read"],
      { ownerId: "owner@example.com" },
    );
    expect(service.invokeContext).toHaveBeenCalledWith(
      "agent-123",
      "reviewer",
      "crm",
      "contacts",
      { accountId: "acct_1" },
      ["crm.read"],
      { ownerId: "owner@example.com", agentData: {} },
    );
    expect(result).toMatchObject({
      content: [{ type: "text", text: "7" }],
    });
  });

  it("lets explicit null overrides clear session identity for subsequent tool calls", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    service.invokeContext.mockResolvedValue({
      integration: "crm",
      tool: "accounts",
      provider: "mock",
      kind: "api",
      authStrategy: "none",
      decision: { allowed: true, reason: "", effectiveScopes: [] },
      data: true,
    });

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
      sessionDefaults: {
        agentId: "default-agent",
        agentClass: "default-class",
        agentData: {},
      },
    });

    const result = await getRegisteredTool(buildContextLayerMcpToolName("crm", "accounts")).handler({
      contextAgentId: null,
      contextAgentClass: null,
    });

    expect(service.invokeContext).toHaveBeenCalledWith(
      null,
      null,
      "crm",
      "accounts",
      {},
      [],
      { ownerId: "owner@example.com", agentData: {} },
    );
    expect(result).toMatchObject({
      content: [{ type: "text", text: "true" }],
    });
  });

  it("preserves MCP-formatted results and only adds structuredContent for record payloads", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    service.invokeContext
      .mockResolvedValueOnce({
        integration: "crm",
        tool: "accounts",
        provider: "mock",
        kind: "api",
        authStrategy: "none",
        decision: { allowed: true, reason: "", effectiveScopes: [] },
        data: {
          content: [{ type: "text", text: "already formatted" }],
          structuredContent: { ok: true },
        },
      })
      .mockResolvedValueOnce({
        integration: "crm",
        tool: "accounts",
        provider: "mock",
        kind: "api",
        authStrategy: "none",
        decision: { allowed: true, reason: "", effectiveScopes: [] },
        data: [1, 2, 3],
      })
      .mockResolvedValueOnce({
        integration: "crm",
        tool: "accounts",
        provider: "mock",
        kind: "api",
        authStrategy: "none",
        decision: { allowed: true, reason: "", effectiveScopes: [] },
        data: {
          nested: true,
          content: [{ missing: "type" }],
        },
      });

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
    });

    await expect(getRegisteredTool("crm__accounts").handler({})).resolves.toEqual({
      content: [{ type: "text", text: "already formatted" }],
      structuredContent: { ok: true },
    });
    await expect(getRegisteredTool("crm__accounts").handler({})).resolves.toEqual({
      content: [{ type: "text", text: "[\n  1,\n  2,\n  3\n]" }],
    });
    await expect(getRegisteredTool("crm__accounts").handler({})).resolves.toMatchObject({
      content: [
        {
          type: "text",
          text: '{\n  "nested": true,\n  "content": [\n    {\n      "missing": "type"\n    }\n  ]\n}',
        },
      ],
      structuredContent: {
        nested: true,
        content: [{ missing: "type" }],
      },
    });
  });

  it("rethrows non-approval invocation failures after session agent data is configured", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    service.invokeContext.mockRejectedValue(new Error("upstream exploded"));

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
      sessionDefaults: {
        agentId: null,
        agentClass: null,
        agentData: { conversationLink: " https://chat.example/convo/123 " },
      },
    });

    await expect(getRegisteredTool("crm__contacts").handler({})).rejects.toThrow("upstream exploded");
  });

  it("returns approval-setup guidance when access is denied before a conversation link is set", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);
    service.evaluateAccess.mockResolvedValue({
      allowed: false,
      reason: "approval required",
      effectiveScopes: ["crm.read"],
    });

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
    });

    await expect(getRegisteredTool("crm__contacts").handler({})).resolves.toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: expect.stringContaining("Before requesting approval, call set_agent_data with conversationLink"),
        },
      ],
    });
    expect(service.invokeContext).not.toHaveBeenCalled();
  });

  it("wraps legacy override keys in a ContextLayerError", async () => {
    const service = createService();
    service.listOwnerIntegrations.mockResolvedValue([buildIntegration()]);

    await createContextLayerMcpServer({
      request: new Request("https://api.example.test/api/mcp"),
      service,
      ownerId: "owner@example.com",
    });

    await expect(
      getRegisteredTool("crm__accounts").handler({ _agentId: "legacy-agent" }),
    ).rejects.toBeInstanceOf(ContextLayerError);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { getContextLayerService } from "@/src/lib/core/runtime";
import type { IntegrationSpec } from "@/src/types/context-layer";

import { DELETE, GET, POST, resetMcpSessionsForTests } from "./route";

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const routeFetch: typeof fetch = async (input, init) => {
  const url =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : String(input);
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const request = new Request(url, init ?? (input instanceof Request ? input : undefined));

  if (method === "POST") {
    return POST(request);
  }

  if (method === "DELETE") {
    return DELETE(request);
  }

  return GET(request);
};

const connectClient = async ({
  url,
  apiKey,
}: {
  url: string;
  apiKey: string;
}) => {
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    fetch: routeFetch,
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  });

  await client.connect(transport);
  return { client, transport };
};

const readToolText = (result: Awaited<ReturnType<Client["callTool"]>>) => {
  const content = result.content as Array<{ type: string; text?: string }>;
  expect(content[0]).toMatchObject({ type: "text" });
  return content[0]?.type === "text" ? (content[0].text ?? "") : "";
};

const baseIntegration: IntegrationSpec = {
  key: "crm",
  name: "CRM",
  kind: "api",
  provider: "mock",
  authStrategy: "none",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  functions: {
    accounts: {
      name: "accounts",
      description: "List accounts",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: ["crm.read"],
      executionMode: "mock",
      config: {},
      mockResponse: {
        source: "accounts",
      },
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
    secrets: {
      name: "secrets",
      description: "Hidden tool",
      enabled: false,
      accessMode: "disabled",
      fineGrainedPermissions: true,
      defaultScopes: ["crm.admin"],
      executionMode: "mock",
      config: {},
    },
  },
};

afterEach(async () => {
  await resetMcpSessionsForTests();
  resetRuntime();
});

describe("/api/mcp", () => {
  it("lists built-in tools and forwards enabled invocations after session defaults are set", async () => {
    const service = getContextLayerService();
    await service.registerIntegration(baseIntegration);
    const apiKey = (await service.getOrCreateAgentApiKey("owner@example.com")).apiKey;

    const { client, transport } = await connectClient({
      url: "http://localhost:3000/api/mcp",
      apiKey,
    });

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "crm__accounts",
      "crm__contacts",
      "set_agent_class",
      "set_agent_id",
    ]);

    const setAgentIdResult = await client.callTool({
      name: "set_agent_id",
      arguments: {
        agentId: "agent-1",
      },
    });
    expect(readToolText(setAgentIdResult)).toContain("MCP session agentId set to agent-1.");

    const setAgentClassResult = await client.callTool({
      name: "set_agent_class",
      arguments: {
        agentClass: "assistant",
      },
    });
    expect(readToolText(setAgentClassResult)).toContain(
      "MCP session agentClass set to assistant.",
    );

    const result = await client.callTool({
      name: "crm__accounts",
      arguments: {
        limit: 5,
        _scopes: ["crm.read"],
      },
    });

    expect(result.isError).toBeFalsy();
    const text = readToolText(result);
    expect(text).toContain('"limit": 5');
    expect(text).not.toContain("_scopes");
    expect(text).toContain('"source": "accounts"');

    await transport.close();
  });

  it("returns a human-approval link for case-by-case tools after session defaults are set", async () => {
    const service = getContextLayerService();
    await service.registerIntegration(baseIntegration);
    const apiKey = (await service.getOrCreateAgentApiKey("owner@example.com")).apiKey;

    const { client, transport } = await connectClient({
      url: "http://localhost:3000/api/mcp",
      apiKey,
    });

    await client.callTool({
      name: "set_agent_id",
      arguments: {
        agentId: "agent-2",
      },
    });
    await client.callTool({
      name: "set_agent_class",
      arguments: {
        agentClass: "assistant",
      },
    });

    const result = await client.callTool({
      name: "crm__contacts",
      arguments: {
        _scopes: ["crm.read"],
      },
    });

    expect(result.isError).toBe(true);
    const text = readToolText(result);
    expect(text).toContain("Human approval is currently required before calling crm.contacts.");
    expect(text).toContain("http://localhost:3000/admin");

    await transport.close();
  });
});

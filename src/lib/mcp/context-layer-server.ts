import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextLayerService } from "@/src/lib/core/service";
import { getRequestOrigin } from "@/src/lib/request-context";
import type { ContextInvocationResult, FunctionSpec, IntegrationSpec } from "@/src/types/context-layer";

const CONTEXT_LAYER_MCP_SERVER_INFO = {
  name: "agent-context-layer",
  version: "0.2.0",
};

const CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA = z
  .object({
    _agentId: z.string().trim().min(1).optional(),
    _agentClass: z.string().trim().min(1).optional(),
    _scopes: z.array(z.string()).default([]),
  })
  .passthrough();

const RESERVED_TOOL_ARGUMENT_KEYS = new Set(["_agentId", "_agentClass", "_scopes"]);
const APPROVAL_DASHBOARD_PATH = "/admin";
export const CONTEXT_LAYER_MCP_TOOL_SEPARATOR = "__";

const getFunctionAccessMode = (functionSpec: FunctionSpec) =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isToolResultContentBlock = (
  value: unknown,
): value is CallToolResult["content"][number] =>
  isRecord(value) && typeof value.type === "string";

const isMcpToolResult = (value: unknown): value is CallToolResult =>
  isRecord(value) &&
  Array.isArray(value.content) &&
  value.content.every(isToolResultContentBlock);

const buildToolDescription = (
  integration: IntegrationSpec,
  functionSpec: FunctionSpec,
  toolName: string,
) => {
  const mode = getFunctionAccessMode(functionSpec);
  const notes = [
    functionSpec.description?.trim(),
    `Invoke ${integration.key}.${functionSpec.name} through the context layer MCP bridge.`,
    "Pass downstream tool arguments as top-level fields. Reserved fields: _scopes, _agentId, _agentClass.",
  ].filter(Boolean);

  if (mode === "approval_required") {
    notes.push(
      "This tool is case-by-case and returns an approval link until a temporary grant is active.",
    );
  }

  if (toolName !== functionSpec.name) {
    notes.push(`Original function name: ${functionSpec.name}.`);
  }

  return notes.join(" ");
};

const buildApprovalMessage = ({
  functionName,
  integrationKey,
  approvalUrl,
}: {
  functionName: string;
  integrationKey: string;
  approvalUrl: string;
}) =>
  [
    `Human approval is currently required before calling ${integrationKey}.${functionName}.`,
    `Ask your human to authorize access in the dashboard: ${approvalUrl}`,
  ].join(" ");

const extractInvocationContext = (
  request: Request,
  args: z.infer<typeof CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA>,
) => {
  const url = new URL(request.url);
  const queryAgentId = url.searchParams.get("agentId")?.trim() ?? "";
  const queryAgentClass = url.searchParams.get("agentClass")?.trim() ?? "";
  const agentId = args._agentId?.trim() || queryAgentId;
  const agentClass = args._agentClass?.trim() || queryAgentClass;

  if (!agentId || !agentClass) {
    throw new ContextLayerError(
      "MCP tool calls require an agentId and agentClass. Add ?agentId=<id>&agentClass=<class> to the MCP server URL or pass _agentId and _agentClass in the tool arguments.",
      400,
    );
  }

  const payload = Object.fromEntries(
    Object.entries(args).filter(([key]) => !RESERVED_TOOL_ARGUMENT_KEYS.has(key)),
  );

  return {
    agentId,
    agentClass,
    payload,
    scopes: args._scopes,
  };
};

const formatToolResult = (
  result: ContextInvocationResult["data"],
): CallToolResult => {
  if (isMcpToolResult(result)) {
    return result;
  }

  if (typeof result === "string") {
    return {
      content: [{ type: "text" as const, text: result }],
    };
  }

  if (typeof result === "number" || typeof result === "boolean" || result === null) {
    return {
      content: [{ type: "text" as const, text: String(result) }],
    };
  }

  const text = JSON.stringify(result, null, 2);
  return {
    content: [{ type: "text" as const, text }],
    ...(isRecord(result) ? { structuredContent: result } : {}),
  };
};

export const buildContextLayerMcpToolName = (
  integrationKey: string,
  functionName: string,
) => `${integrationKey}${CONTEXT_LAYER_MCP_TOOL_SEPARATOR}${functionName}`;

export const createContextLayerMcpServer = async ({
  request,
  service,
  ownerId,
}: {
  request: Request;
  service: ContextLayerService;
  ownerId: string;
}) => {
  const server = new McpServer(CONTEXT_LAYER_MCP_SERVER_INFO);
  const approvalUrl = new URL(
    APPROVAL_DASHBOARD_PATH,
    getRequestOrigin(request.headers),
  ).toString();
  const integrations = await service.listIntegrations();

  for (const integration of integrations) {
    if (!integration.enabled) {
      continue;
    }

    for (const functionSpec of Object.values(integration.functions)) {
      const accessMode = getFunctionAccessMode(functionSpec);
      if (!functionSpec.enabled || accessMode === "disabled") {
        continue;
      }

      const toolName = buildContextLayerMcpToolName(
        integration.key,
        functionSpec.name,
      );

      server.registerTool(
        toolName,
        {
          title: `${integration.name} · ${functionSpec.name}`,
          description: buildToolDescription(integration, functionSpec, toolName),
          inputSchema: CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA,
        },
        async (args) => {
          const invocation = extractInvocationContext(request, args);

          try {
            const result = await service.invokeContext(
              invocation.agentId,
              invocation.agentClass,
              integration.key,
              functionSpec.name,
              invocation.payload,
              invocation.scopes,
              { ownerId },
            );

            return formatToolResult(result.data);
          } catch (error) {
            if (
              accessMode === "approval_required" &&
              error instanceof ContextLayerError &&
              error.statusCode === 403
            ) {
              return {
                isError: true,
                content: [
                  {
                    type: "text" as const,
                    text: buildApprovalMessage({
                      functionName: functionSpec.name,
                      integrationKey: integration.key,
                      approvalUrl,
                    }),
                  },
                ],
              };
            }

            throw error;
          }
        },
      );
    }
  }

  return server;
};

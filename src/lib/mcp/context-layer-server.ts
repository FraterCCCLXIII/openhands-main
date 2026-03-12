import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { resolveInvocationIdentity } from "@/src/lib/agent-defaults";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextLayerService } from "@/src/lib/core/service";
import { buildContextLayerToolInputShape } from "@/src/lib/mcp/tool-input-schema";
import type { McpSessionDefaults } from "@/src/lib/mcp/session-store";
import { getRequestOrigin } from "@/src/lib/request-context";
import type { ContextInvocationResult, FunctionSpec, IntegrationSpec } from "@/src/types/context-layer";

const CONTEXT_LAYER_MCP_SERVER_INFO = {
  name: "agent-context-layer",
  version: "0.2.0",
};

const CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA = z
  .object({
    contextAgentId: z.string().trim().min(1).optional(),
    contextAgentClass: z.string().trim().min(1).optional(),
    contextScopes: z.array(z.string()).default([]),
  })
  .passthrough();

const SET_AGENT_ID_TOOL_INPUT_SCHEMA = z.object({
  agentId: z.string().trim().min(1),
});

const SET_AGENT_CLASS_TOOL_INPUT_SCHEMA = z.object({
  agentClass: z.string().trim().min(1),
});

const RESERVED_TOOL_ARGUMENT_KEYS = new Set([
  "contextAgentId",
  "contextAgentClass",
  "contextScopes",
]);
const LEGACY_RESERVED_TOOL_ARGUMENT_KEYS = ["_agentId", "_agentClass", "_scopes"] as const;
const APPROVAL_DASHBOARD_PATH = "/admin";
export const CONTEXT_LAYER_MCP_TOOL_SEPARATOR = "__";
export const CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME = "set_agent_id";
export const CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME = "set_agent_class";

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
    `Pass downstream tool arguments as top-level fields. Reserved fields: contextScopes, contextAgentId, contextAgentClass. If you omit agent identity, enabled tools use the default session identity; use ${CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME} and ${CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME} to override it for the current MCP session.`,
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

const extractInvocationContext = (args: Record<string, unknown>, defaults: McpSessionDefaults) => {
  const legacyKeys = LEGACY_RESERVED_TOOL_ARGUMENT_KEYS.filter((key) => key in args);

  if (legacyKeys.length > 0) {
    throw new ContextLayerError(
      `Unsupported MCP tool argument(s): ${legacyKeys.join(", ")}. Use contextAgentId, contextAgentClass, and contextScopes instead.`,
      400,
    );
  }

  const parsedArgs = CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA.parse(args);
  const { agentId, agentClass } = resolveInvocationIdentity({
    agentId: parsedArgs.contextAgentId || defaults.agentId,
    agentClass: parsedArgs.contextAgentClass || defaults.agentClass,
  });

  const payload = Object.fromEntries(
    Object.entries(parsedArgs).filter(([key]) => !RESERVED_TOOL_ARGUMENT_KEYS.has(key)),
  );

  return {
    agentId,
    agentClass,
    payload,
    scopes: parsedArgs.contextScopes,
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

const buildSessionSettingResult = (
  field: "agentId" | "agentClass",
  value: string,
): CallToolResult => ({
  content: [{ type: "text" as const, text: `MCP session ${field} set to ${value}.` }],
  structuredContent: { [field]: value },
});

export const buildContextLayerMcpToolName = (
  integrationKey: string,
  functionName: string,
) => `${integrationKey}${CONTEXT_LAYER_MCP_TOOL_SEPARATOR}${functionName}`;

export const createContextLayerMcpServer = async ({
  request,
  service,
  ownerId,
  sessionDefaults,
  onSessionDefaultsChanged,
}: {
  request: Request;
  service: ContextLayerService;
  ownerId: string;
  sessionDefaults?: Partial<McpSessionDefaults>;
  onSessionDefaultsChanged?: (defaults: McpSessionDefaults) => Promise<void> | void;
}) => {
  const server = new McpServer(CONTEXT_LAYER_MCP_SERVER_INFO);
  const approvalUrl = new URL(
    APPROVAL_DASHBOARD_PATH,
    getRequestOrigin(request.headers),
  ).toString();
  const initialUrl = new URL(request.url);
  const sessionAgentDefaults: McpSessionDefaults = resolveInvocationIdentity({
    agentId: sessionDefaults?.agentId ?? initialUrl.searchParams.get("agentId"),
    agentClass: sessionDefaults?.agentClass ?? initialUrl.searchParams.get("agentClass"),
  });
  const persistSessionDefaults = async () => {
    await onSessionDefaultsChanged?.({ ...sessionAgentDefaults });
  };
  const integrations = await service.listIntegrations();

  server.registerTool(
    CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME,
    {
      title: "Set session agent ID",
      description: "Set the default agentId for subsequent MCP tool calls in this session.",
      inputSchema: SET_AGENT_ID_TOOL_INPUT_SCHEMA,
    },
    async ({ agentId }) => {
      sessionAgentDefaults.agentId = agentId.trim();
      await persistSessionDefaults();
      return buildSessionSettingResult("agentId", sessionAgentDefaults.agentId);
    },
  );

  server.registerTool(
    CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME,
    {
      title: "Set session agent class",
      description:
        "Set the default agentClass for subsequent MCP tool calls in this session.",
      inputSchema: SET_AGENT_CLASS_TOOL_INPUT_SCHEMA,
    },
    async ({ agentClass }) => {
      sessionAgentDefaults.agentClass = agentClass.trim();
      await persistSessionDefaults();
      return buildSessionSettingResult("agentClass", sessionAgentDefaults.agentClass);
    },
  );

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
          inputSchema: buildContextLayerToolInputShape(functionSpec),
        },
        async (args) => {
          const invocation = extractInvocationContext(args as Record<string, unknown>, sessionAgentDefaults);

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

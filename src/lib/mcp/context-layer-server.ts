import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { normalizeAgentIdentityValue, resolveInvocationIdentity } from "@/src/lib/agent-defaults";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextLayerService } from "@/src/lib/core/service";
import { filterIntegrationsVisibleToOwner } from "@/src/lib/integrations/visible-integrations";
import { buildContextLayerToolInputShape } from "@/src/lib/mcp/tool-input-schema";
import type { McpSessionDefaults } from "@/src/lib/mcp/session-store";
import { getRequestOrigin } from "@/src/lib/request-context";
import type {
  AccessRequestAgentData,
  ContextInvocationResult,
  ToolSpec,
  IntegrationSpec,
} from "@/src/types/context-layer";

const CONTEXT_LAYER_MCP_SERVER_INFO = {
  name: "agent-context-layer",
  version: "0.2.0",
};

const nullableAgentIdentitySchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      return normalizeAgentIdentityValue(value);
    }

    return value == null ? null : value;
  },
  z.string().trim().min(1).nullable(),
);

const CONTEXT_LAYER_MCP_TOOL_INPUT_SCHEMA = z
  .object({
    contextAgentId: nullableAgentIdentitySchema.optional(),
    contextAgentClass: nullableAgentIdentitySchema.optional(),
    contextScopes: z.array(z.string()).default([]),
  })
  .passthrough();

const SET_AGENT_ID_TOOL_INPUT_SCHEMA = z.object({
  agentId: nullableAgentIdentitySchema,
});

const SET_AGENT_CLASS_TOOL_INPUT_SCHEMA = z.object({
  agentClass: nullableAgentIdentitySchema,
});

const SET_AGENT_DATA_TOOL_INPUT_SCHEMA = z.object({
  conversationLink: z.string().trim().min(1),
});

const RESERVED_TOOL_ARGUMENT_KEYS = new Set([
  "contextAgentId",
  "contextAgentClass",
  "contextScopes",
]);
const LEGACY_RESERVED_TOOL_ARGUMENT_KEYS = ["_agentId", "_agentClass", "_scopes"] as const;
const APPROVAL_DASHBOARD_PATH = "/case-by-case-approvals";
export const CONTEXT_LAYER_MCP_TOOL_SEPARATOR = "__";
export const CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME = "set_agent_id";
export const CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME = "set_agent_class";
export const CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME = "set_agent_data";

const getToolAccessMode = (toolSpec: ToolSpec) =>
  toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isToolResultContentBlock = (
  value: unknown,
): value is CallToolResult["content"][number] =>
  isRecord(value) && typeof value.type === "string";


const normalizeAgentData = (
  agentData?: AccessRequestAgentData,
): AccessRequestAgentData => {
  const conversationLink = agentData?.conversationLink?.trim();

  return conversationLink ? { conversationLink } : {};
};

const hasConversationLink = (agentData?: AccessRequestAgentData) =>
  Boolean(normalizeAgentData(agentData).conversationLink);

const isMcpToolResult = (value: unknown): value is CallToolResult =>
  isRecord(value) &&
  Array.isArray(value.content) &&
  value.content.every(isToolResultContentBlock);

const buildToolDescription = (
  integration: IntegrationSpec,
  toolSpec: ToolSpec,
  toolName: string,
) => {
  const mode = getToolAccessMode(toolSpec);
  const notes = [
    toolSpec.description?.trim(),
    `Invoke ${integration.key}.${toolSpec.name} through the context layer MCP bridge.`,
    `Pass downstream tool arguments as top-level fields. Reserved fields: contextScopes, contextAgentId, contextAgentClass. If you omit agent identity, calls use the session identity when one is set; otherwise agentId and agentClass remain null. Use ${CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME}, ${CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME}, and ${CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME} to set or clear the session identity or add conversation metadata for approvals.`,
  ].filter(Boolean);

  if (mode === "approval_required") {
    notes.push(
      "This tool is case-by-case and returns an approval link until a temporary grant is active.",
    );
  }

  if (toolName !== toolSpec.name) {
    notes.push(`Original function name: ${toolSpec.name}.`);
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

const buildApprovalSetupMessage = ({
  functionName,
  integrationKey,
}: {
  functionName: string;
  integrationKey: string;
}) =>
  [
    `Human approval is currently required before calling ${integrationKey}.${functionName}.`,
    `Before requesting approval, call ${CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME} with conversationLink so the approvals page can link back to the conversation.`,
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
  const usesExplicitAgentId = Object.prototype.hasOwnProperty.call(parsedArgs, "contextAgentId");
  const usesExplicitAgentClass = Object.prototype.hasOwnProperty.call(parsedArgs, "contextAgentClass");
  const { agentId, agentClass } = resolveInvocationIdentity({
    agentId: usesExplicitAgentId ? parsedArgs.contextAgentId : defaults.agentId,
    agentClass: usesExplicitAgentClass ? parsedArgs.contextAgentClass : defaults.agentClass,
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
  value: string | null,
): CallToolResult => ({
  content: [
    {
      type: "text" as const,
      text:
        value === null
          ? `MCP session ${field} cleared.`
          : `MCP session ${field} set to ${value}.`,
    },
  ],
  structuredContent: { [field]: value },
});

const buildSessionAgentDataResult = (
  agentData: AccessRequestAgentData,
): CallToolResult => ({
  content: [
    {
      type: "text" as const,
      text: `MCP session agent data set with conversation link ${agentData.conversationLink}.`,
    },
  ],
  structuredContent: {
    conversationLink: agentData.conversationLink,
  },
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
  const resolvedIdentity = resolveInvocationIdentity({
    agentId:
      sessionDefaults?.agentId !== undefined
        ? sessionDefaults.agentId
        : initialUrl.searchParams.get("agentId"),
    agentClass:
      sessionDefaults?.agentClass !== undefined
        ? sessionDefaults.agentClass
        : initialUrl.searchParams.get("agentClass"),
  });
  const sessionAgentDefaults: McpSessionDefaults = {
    ...resolvedIdentity,
    agentData: normalizeAgentData(sessionDefaults?.agentData),
  };
  const persistSessionDefaults = async () => {
    await onSessionDefaultsChanged?.({ ...sessionAgentDefaults });
  };
  const [integrations, connections] = await Promise.all([
    service.listOwnerIntegrations(ownerId),
    service.listIntegrationConnections(ownerId),
  ]);
  const visibleIntegrations = filterIntegrationsVisibleToOwner(
    integrations,
    connections,
  );

  server.registerTool(
    CONTEXT_LAYER_MCP_SET_AGENT_ID_TOOL_NAME,
    {
      title: "Set session agent ID",
      description: "Set or clear the default agentId for subsequent MCP tool calls in this session.",
      inputSchema: SET_AGENT_ID_TOOL_INPUT_SCHEMA,
    },
    async ({ agentId }) => {
      sessionAgentDefaults.agentId = agentId;
      await persistSessionDefaults();
      return buildSessionSettingResult("agentId", sessionAgentDefaults.agentId);
    },
  );

  server.registerTool(
    CONTEXT_LAYER_MCP_SET_AGENT_CLASS_TOOL_NAME,
    {
      title: "Set session agent class",
      description:
        "Set or clear the default agentClass for subsequent MCP tool calls in this session.",
      inputSchema: SET_AGENT_CLASS_TOOL_INPUT_SCHEMA,
    },
    async ({ agentClass }) => {
      sessionAgentDefaults.agentClass = agentClass;
      await persistSessionDefaults();
      return buildSessionSettingResult("agentClass", sessionAgentDefaults.agentClass);
    },
  );


  server.registerTool(
    CONTEXT_LAYER_MCP_SET_AGENT_DATA_TOOL_NAME,
    {
      title: "Set session agent data",
      description:
        "Set session-scoped agent metadata such as a conversationLink for approval review.",
      inputSchema: SET_AGENT_DATA_TOOL_INPUT_SCHEMA,
    },
    async ({ conversationLink }) => {
      sessionAgentDefaults.agentData = normalizeAgentData({ conversationLink });
      await persistSessionDefaults();
      return buildSessionAgentDataResult(sessionAgentDefaults.agentData);
    },
  );

  for (const integration of visibleIntegrations) {
    if (!integration.enabled) {
      continue;
    }

    for (const toolSpec of Object.values(integration.functions)) {
      const accessMode = getToolAccessMode(toolSpec);
      if (!toolSpec.enabled || accessMode === "disabled") {
        continue;
      }

      const toolName = buildContextLayerMcpToolName(
        integration.key,
        toolSpec.name,
      );

      server.registerTool(
        toolName,
        {
          title: `${integration.name} · ${toolSpec.name}`,
          description: buildToolDescription(integration, toolSpec, toolName),
          inputSchema: buildContextLayerToolInputShape(toolSpec),
        },
        async (args) => {
          const invocation = extractInvocationContext(
            args as Record<string, unknown>,
            sessionAgentDefaults,
          );

          if (accessMode === "approval_required" && !hasConversationLink(sessionAgentDefaults.agentData)) {
            const decision = await service.evaluateAccess(
              invocation.agentId,
              invocation.agentClass,
              integration.key,
              toolSpec.name,
              invocation.scopes,
              { ownerId },
            );

            if (!decision.allowed) {
              return {
                isError: true,
                content: [
                  {
                    type: "text" as const,
                    text: buildApprovalSetupMessage({
                      functionName: toolSpec.name,
                      integrationKey: integration.key,
                    }),
                  },
                ],
              };
            }
          }

          try {
            const result = await service.invokeContext(
              invocation.agentId,
              invocation.agentClass,
              integration.key,
              toolSpec.name,
              invocation.payload,
              invocation.scopes,
              {
                ownerId,
                agentData: sessionAgentDefaults.agentData,
              },
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
                      functionName: toolSpec.name,
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

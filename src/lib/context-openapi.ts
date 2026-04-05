import {
  contextInvocationResultSchema,
  contextInvokeSchema,
} from "@/src/lib/core/schema";
import {
  OPENAPI_VERSION,
  buildApiKeySecurity,
  buildApiKeySecurityScheme,
  buildJsonRefResponse,
  buildJsonRequestBody,
  buildUnauthorizedResponse,
  errorResponseSchema,
  toOpenApiSchema,
} from "@/src/lib/openapi/shared";
import {
  buildExamplePayload,
  buildPermissionNote,
  getToolAccessMode,
  listExampleTools,
} from "@/src/lib/tool-examples";
import type { ToolSpec, IntegrationSpec } from "@/src/types/context-layer";

const buildRequestExample = (toolSpec: ToolSpec) => ({
  scopes: toolSpec.defaultScopes,
  payload: buildExamplePayload(toolSpec),
});

const toOperationId = (integrationKey: string, toolName: string) =>
  `invoke_${`${integrationKey}_${toolName}`.replace(/[^a-zA-Z0-9_]+/g, "_")}`;

const buildOperationDescription = (
  integration: IntegrationSpec,
  toolSpec: ToolSpec,
) => {
  const details = [
    `Integration key: ${integration.key}`,
    `Provider: ${integration.provider}`,
  ];

  if (toolSpec.defaultScopes.length > 0) {
    details.push(`Default scopes: ${toolSpec.defaultScopes.join(", ")}`);
  }

  details.push("Invocation identity is optional; agentId and agentClass default to null when omitted.");

  if (getToolAccessMode(toolSpec) === "approval_required") {
    details.push("Access mode: case-by-case approval");
  }

  details.push(buildPermissionNote(toolSpec));

  return `${integration.name} tool \`${toolSpec.name}\` exposed through the unified context-layer endpoint. ${details.join(" · ")}`;
};

/**
 * Generates the agent runtime OpenAPI document for the caller's currently visible tools.
 */
export const buildContextOpenApiDocument = ({
  baseUrl,
  integrations,
}: {
  baseUrl: string;
  integrations: IntegrationSpec[];
}) => {
  const enabledIntegrations = integrations
    .filter((integration) => integration.enabled)
    .map((integration) => ({
      integration,
      tools: listExampleTools(integration),
    }))
    .filter(({ tools }) => tools.length > 0)
    .sort((left, right) => left.integration.key.localeCompare(right.integration.key));

  const paths = Object.fromEntries(
    enabledIntegrations.flatMap(({ integration, tools }) =>
      tools.map((toolSpec) => [
        `/api/context/${integration.key}/${toolSpec.name}`,
        {
          post: {
            tags: [integration.name],
            operationId: toOperationId(integration.key, toolSpec.name),
            summary:
              toolSpec.description?.trim() ||
              `${integration.name}: ${toolSpec.name}`,
            description: buildOperationDescription(integration, toolSpec),
            security: buildApiKeySecurity("ContextApiKey"),
            requestBody: buildJsonRequestBody(
              { $ref: "#/components/schemas/ContextInvokeRequest" },
              {
                examples: {
                  default: {
                    value: buildRequestExample(toolSpec),
                  },
                },
              },
            ),
            responses: {
              200: buildJsonRefResponse(
                "Successful tool invocation result.",
                "ContextInvocationResult",
              ),
              401: buildUnauthorizedResponse(
                "Missing or invalid personal context-layer API key.",
              ),
              403: buildJsonRefResponse(
                "Permission required, case-by-case approval needed, or the user connection is missing.",
                "ErrorResponse",
              ),
              404: buildJsonRefResponse(
                "Unknown integration or tool.",
                "ErrorResponse",
              ),
              503: buildJsonRefResponse(
                "Context-layer key provisioning or storage unavailable.",
                "ErrorResponse",
              ),
            },
          },
        },
      ]),
    ),
  );

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "Context Layer Tool API",
      version: "1.0.0",
      description:
        "OpenAPI-compatible document for the authenticated user's currently available context-layer tools.",
    },
    servers: [{ url: baseUrl }],
    tags: enabledIntegrations.map(({ integration }) => ({
      name: integration.name,
      description: `${integration.name} tools exposed through ${integration.provider}.`,
    })),
    paths,
    components: {
      securitySchemes: {
        ContextApiKey: buildApiKeySecurityScheme(
          "Personal context-layer API key sent as an Authorization bearer token. X-API-Key is also accepted by the runtime.",
        ),
      },
      schemas: {
        ContextInvokeRequest: toOpenApiSchema(contextInvokeSchema),
        ContextInvocationResult: toOpenApiSchema(contextInvocationResultSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  };
};

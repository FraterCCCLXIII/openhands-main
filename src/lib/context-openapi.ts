import { z } from "zod";

import { contextInvokeSchema } from "@/src/lib/core/schema";
import {
  buildExamplePayload,
  buildPermissionNote,
  getFunctionAccessMode,
  listExampleFunctions,
} from "@/src/lib/tool-examples";
import type { FunctionSpec, IntegrationSpec } from "@/src/types/context-layer";

const CONTEXT_OPENAPI_VERSION = "3.0.3";

const accessDecisionSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  effectiveScopes: z.array(z.string()),
});

const contextInvocationResultSchema = z.object({
  integration: z.string(),
  function: z.string(),
  provider: z.enum(["composio", "mcp", "mock", "http"]),
  kind: z.enum(["api", "mcp"]),
  authStrategy: z.enum([
    "none",
    "api_key",
    "bearer",
    "basic",
    "oauth2",
    "mcp_session",
  ]),
  decision: accessDecisionSchema,
  data: z.unknown(),
});

const errorResponseSchema = z.object({
  detail: z.string(),
  debug: z.record(z.string(), z.unknown()).optional(),
});

const toOpenApiSchema = (schema: z.ZodType) => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "openapi-3.0",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;
  return jsonSchema;
};

const buildRequestExample = (functionSpec: FunctionSpec) => ({
  scopes: functionSpec.defaultScopes,
  payload: buildExamplePayload(functionSpec),
});

const toOperationId = (integrationKey: string, functionName: string) =>
  `invoke_${`${integrationKey}_${functionName}`.replace(/[^a-zA-Z0-9_]+/g, "_")}`;

const buildOperationDescription = (
  integration: IntegrationSpec,
  functionSpec: FunctionSpec,
) => {
  const details = [
    `Integration key: ${integration.key}`,
    `Provider: ${integration.provider}`,
  ];

  if (functionSpec.defaultScopes.length > 0) {
    details.push(`Default scopes: ${functionSpec.defaultScopes.join(", ")}`);
  }

  details.push("Invocation identity is optional; agentId and agentClass default to null when omitted.");

  if (getFunctionAccessMode(functionSpec) === "approval_required") {
    details.push("Access mode: case-by-case approval");
  }

  details.push(buildPermissionNote(functionSpec));

  return `${integration.name} tool \`${functionSpec.name}\` exposed through the unified context-layer endpoint. ${details.join(" · ")}`;
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
      functions: listExampleFunctions(integration),
    }))
    .filter(({ functions }) => functions.length > 0)
    .sort((left, right) => left.integration.key.localeCompare(right.integration.key));

  const paths = Object.fromEntries(
    enabledIntegrations.flatMap(({ integration, functions }) =>
      functions.map((functionSpec) => [
        `/api/context/${integration.key}/${functionSpec.name}`,
        {
          post: {
            tags: [integration.name],
            operationId: toOperationId(integration.key, functionSpec.name),
            summary:
              functionSpec.description?.trim() ||
              `${integration.name}: ${functionSpec.name}`,
            description: buildOperationDescription(integration, functionSpec),
            security: [{ ContextApiKey: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ContextInvokeRequest",
                  },
                  examples: {
                    default: {
                      value: buildRequestExample(functionSpec),
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Successful tool invocation result.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ContextInvocationResult",
                    },
                  },
                },
              },
              401: {
                description: "Missing or invalid personal context-layer API key.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                  },
                },
              },
              403: {
                description:
                  "Permission required, case-by-case approval needed, or the user connection is missing.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                  },
                },
              },
              404: {
                description: "Unknown integration or function.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                  },
                },
              },
              503: {
                description: "Context-layer key provisioning or storage unavailable.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                  },
                },
              },
            },
          },
        },
      ]),
    ),
  );

  return {
    openapi: CONTEXT_OPENAPI_VERSION,
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
        ContextApiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description:
            "Personal context-layer API key sent as an Authorization bearer token. X-API-Key is also accepted by the runtime.",
        },
      },
      schemas: {
        ContextInvokeRequest: toOpenApiSchema(contextInvokeSchema),
        ContextInvocationResult: toOpenApiSchema(contextInvocationResultSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  };
};

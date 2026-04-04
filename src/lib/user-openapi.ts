import { z } from "zod";

import { selectExampleIntegration } from "@/src/lib/tool-examples";
import type { IntegrationSpec } from "@/src/types/context-layer";

const USER_OPENAPI_VERSION = "3.0.3";

const functionAccessModeSchema = z.enum([
  "enabled",
  "disabled",
  "approval_required",
]);
const accessRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);
const notificationChannelSchema = z.enum(["email", "in_app", "sms"]);
const integrationProviderSchema = z.enum(["composio", "mcp", "mock", "http"]);
const integrationKindSchema = z.enum(["api", "mcp"]);
const authStrategySchema = z.enum([
  "none",
  "api_key",
  "bearer",
  "basic",
  "oauth2",
  "mcp_session",
]);

const functionSpecSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  accessMode: functionAccessModeSchema.optional(),
  fineGrainedPermissions: z.boolean(),
  defaultScopes: z.array(z.string()),
  executionMode: z.enum(["provider", "mock"]),
  config: z.record(z.string(), z.unknown()),
  mockResponse: z.record(z.string(), z.unknown()).optional(),
});

const integrationSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  kind: integrationKindSchema,
  provider: integrationProviderSchema,
  authStrategy: authStrategySchema,
  enabled: z.boolean(),
  fineGrainedPermissions: z.boolean(),
  config: z.record(z.string(), z.unknown()),
  credentials: z.record(z.string(), z.unknown()),
  functions: z.record(z.string(), functionSpecSchema),
});

const accessRequestSchema = z.object({
  id: z.string(),
  agentId: z.string().nullable(),
  agentClass: z.string().nullable(),
  integrationKey: z.string(),
  functionName: z.string(),
  scopes: z.array(z.string()),
  requestedMinutes: z.number().int(),
  channels: z.array(notificationChannelSchema),
  notificationTargets: z.record(z.string(), z.string()),
  justification: z.string().optional(),
  createdAt: z.string(),
  status: accessRequestStatusSchema,
  decidedAt: z.string().optional(),
  decidedBy: z.string().optional(),
});

const temporaryGrantSchema = z.object({
  id: z.string(),
  agentId: z.string().nullable(),
  agentClass: z.string().nullable(),
  integrationKey: z.string(),
  functionName: z.string(),
  scopes: z.array(z.string()),
  grantedBy: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

const updateFunctionAccessRequestSchema = z.object({
  accessMode: functionAccessModeSchema,
});

const approveAccessRequestSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
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

const buildUserSecurity = () => [{ UserApiKey: [] }];

const buildUnauthorizedResponse = () => ({
  description: "Missing or invalid user automation API key.",
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ErrorResponse",
      },
    },
  },
});

const buildAdminForbiddenResponse = () => ({
  description: "The authenticated user API key does not have admin privileges.",
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ErrorResponse",
      },
    },
  },
});

export const buildUserOpenApiDocument = ({
  baseUrl,
  integrations,
  isAdmin,
}: {
  baseUrl: string;
  integrations: IntegrationSpec[];
  isAdmin: boolean;
}) => {
  const exampleIntegration = selectExampleIntegration(integrations)?.integration;
  const exampleFunction = exampleIntegration
    ? Object.values(exampleIntegration.functions).find((candidate) => candidate.enabled)
    : undefined;

  const integrationKeyExample = exampleIntegration?.key ?? "integration-key";
  const functionNameExample = exampleFunction?.name ?? "function-name";

  const paths: Record<string, Record<string, unknown>> = {
    "/api/user/integrations": {
      get: {
        tags: ["User Integrations"],
        operationId: "listUserIntegrations",
        summary: "List installed integrations",
        description:
          "Returns the authenticated user's installed integrations and current per-function access settings.",
        security: buildUserSecurity(),
        responses: {
          200: {
            description: "Installed integrations for the authenticated user.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/IntegrationSpec" },
                },
              },
            },
          },
          401: buildUnauthorizedResponse(),
        },
      },
    },
    "/api/user/integrations/{integrationKey}/functions/{functionName}": {
      patch: {
        tags: ["User Integrations"],
        operationId: "updateUserFunctionAccessMode",
        summary: "Update a function access mode",
        description:
          "Updates the authenticated user's stored access mode for one installed integration function.",
        security: buildUserSecurity(),
        parameters: [
          {
            name: "integrationKey",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: integrationKeyExample,
          },
          {
            name: "functionName",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: functionNameExample,
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateFunctionAccessRequest",
              },
              examples: {
                default: {
                  value: {
                    accessMode: "enabled",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated function configuration.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FunctionSpec",
                },
              },
            },
          },
          401: buildUnauthorizedResponse(),
          404: {
            description: "Unknown integration or function for the authenticated user.",
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
  };

  if (isAdmin) {
    paths["/api/user/access-requests"] = {
      get: {
        tags: ["Admin approvals"],
        operationId: "listUserAccessRequests",
        summary: "List pending and historical access requests",
        description:
          "Admin-only endpoint for reviewing access requests that were submitted through the dashboard or user API.",
        security: buildUserSecurity(),
        responses: {
          200: {
            description: "Access requests visible to the admin user.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AccessRequest" },
                },
              },
            },
          },
          401: buildUnauthorizedResponse(),
          403: buildAdminForbiddenResponse(),
        },
      },
    };

    paths["/api/user/access-requests/{requestId}/approve"] = {
      post: {
        tags: ["Admin approvals"],
        operationId: "approveUserAccessRequest",
        summary: "Approve an access request",
        description:
          "Admin-only endpoint that approves a request and creates a temporary grant.",
        security: buildUserSecurity(),
        parameters: [
          {
            name: "requestId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApproveAccessRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Temporary grant created for the approved request.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TemporaryGrant",
                },
              },
            },
          },
          401: buildUnauthorizedResponse(),
          403: buildAdminForbiddenResponse(),
          404: {
            description: "Unknown access request.",
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
    };

    paths["/api/user/access-requests/{requestId}/reject"] = {
      post: {
        tags: ["Admin approvals"],
        operationId: "rejectUserAccessRequest",
        summary: "Reject an access request",
        description:
          "Admin-only endpoint that rejects a pending access request.",
        security: buildUserSecurity(),
        parameters: [
          {
            name: "requestId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Updated access request after rejection.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AccessRequest",
                },
              },
            },
          },
          401: buildUnauthorizedResponse(),
          403: buildAdminForbiddenResponse(),
          404: {
            description: "Unknown access request.",
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
    };
  }

  return {
    openapi: USER_OPENAPI_VERSION,
    info: {
      title: "Context Layer User REST API",
      version: "1.0.0",
      description:
        "OpenAPI schema for the authenticated user's dashboard-equivalent REST API endpoints.",
    },
    servers: [{ url: baseUrl }],
    tags: [
      {
        name: "User Integrations",
        description:
          "Endpoints that read and update the authenticated user's installed integration settings.",
      },
      ...(isAdmin
        ? [
            {
              name: "Admin approvals",
              description:
                "Admin-only endpoints for reviewing and deciding access requests.",
            },
          ]
        : []),
    ],
    paths,
    components: {
      securitySchemes: {
        UserApiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description:
            "User automation API key sent as an Authorization bearer token. X-API-Key is also accepted by the runtime.",
        },
      },
      schemas: {
        FunctionSpec: toOpenApiSchema(functionSpecSchema),
        IntegrationSpec: toOpenApiSchema(integrationSpecSchema),
        AccessRequest: toOpenApiSchema(accessRequestSchema),
        TemporaryGrant: toOpenApiSchema(temporaryGrantSchema),
        UpdateFunctionAccessRequest: toOpenApiSchema(
          updateFunctionAccessRequestSchema,
        ),
        ApproveAccessRequest: toOpenApiSchema(approveAccessRequestSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  };
};

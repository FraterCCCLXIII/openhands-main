import { z } from "zod";

import {
  accessRequestDecisionSchema,
  accessRequestSchema,
  toolSpecSchema,
  integrationCreateSchema,
  integrationSpecSchema,
  notificationRecordSchema,
} from "@/src/lib/core/schema";
import {
  errorResponseSchema,
  managedConnectorListSchema,
  managedConnectorResponseSchema,
  managedConnectorUpsertSchema,
} from "@/src/lib/managed-connectors/api-schema";
import { selectExampleIntegration } from "@/src/lib/tool-examples";
import type { IntegrationSpec } from "@/src/types/context-layer";

const integrationDiscoveryRequestSchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["api", "mcp", "built_in"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

const integrationConnectionSchema = z.object({
  integrationKey: z.string(),
  provider: z.string(),
  authStrategy: z.enum(["none", "api_key", "bearer", "basic", "oauth2", "mcp_session"]),
  tokenType: z.string().optional(),
  scopes: z.array(z.string()),
  expiresAt: z.string().optional(),
  externalAccountId: z.string().optional(),
  externalWorkspaceId: z.string().optional(),
  displayName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const arbitraryObjectSchema = z.record(z.string(), z.unknown());
const arbitraryObjectArraySchema = z.array(arbitraryObjectSchema);
const deleteResultSchema = z.object({
  deleted: z.boolean(),
  key: z.string().optional(),
  slug: z.string().optional(),
});

const toOpenApiSchema = (schema: z.ZodType) => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "openapi-3.0",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;
  return jsonSchema;
};

const buildAdminSecurity = () => [{ AdminApiKey: [] }];

const buildUnauthorizedResponse = () => ({
  description: "Missing or invalid admin automation API key.",
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ErrorResponse",
      },
    },
  },
});

export const buildAdminOpenApiDocument = ({
  baseUrl,
  integrations,
}: {
  baseUrl: string;
  integrations: IntegrationSpec[];
}) => {
  const exampleSelection = selectExampleIntegration(integrations);
  const exampleIntegration = exampleSelection?.integration;
  const exampleTool = exampleSelection?.tools[0];

  const integrationKeyExample = exampleIntegration?.key ?? "integration-key";
  const toolNameExample = exampleTool?.name ?? "tool-name";

  return {
    openapi: "3.0.3",
    info: {
      title: "Context Layer Admin REST API",
      version: "1.0.0",
      description:
        "Admin-only automation API for QA and operational workflows that match admin dashboard capabilities.",
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "Admin Integrations" },
      { name: "Admin Discovery" },
      { name: "Admin Approvals" },
      { name: "Admin Connectors" },
      { name: "Admin Workspace" },
    ],
    paths: {
      "/api/admin/integrations": {
        get: {
          tags: ["Admin Integrations"],
          operationId: "listAdminIntegrations",
          summary: "List installed integrations",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "Installed integrations for the authenticated admin user.",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/IntegrationSpec" } },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
        post: {
          tags: ["Admin Integrations"],
          operationId: "createAdminIntegration",
          summary: "Install or update an integration",
          security: buildAdminSecurity(),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IntegrationCreateRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Saved integration.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IntegrationSpec" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/integrations/{integrationKey}": {
        delete: {
          tags: ["Admin Integrations"],
          operationId: "deleteAdminIntegration",
          summary: "Delete an installed integration",
          security: buildAdminSecurity(),
          parameters: [
            {
              name: "integrationKey",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: integrationKeyExample,
            },
          ],
          responses: {
            200: {
              description: "Deletion result.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DeleteResult" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/integrations/{integrationKey}/functions/{functionName}": {
        patch: {
          tags: ["Admin Integrations"],
          operationId: "updateAdminToolAccessMode",
          summary: "Update a tool access mode",
          security: buildAdminSecurity(),
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
              example: toolNameExample,
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["accessMode"],
                  properties: {
                    accessMode: {
                      type: "string",
                      enum: ["enabled", "disabled", "approval_required"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated tool spec.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ToolSpec" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/oauth/connections": {
        get: {
          tags: ["Admin Workspace"],
          operationId: "listAdminOauthConnections",
          summary: "List OAuth connection status",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "OAuth connection state for the authenticated admin user.",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/IntegrationConnection" } },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/notifications": {
        get: {
          tags: ["Admin Workspace"],
          operationId: "listAdminNotifications",
          summary: "List dashboard notifications",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "In-app notifications visible in the dashboard.",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/NotificationRecord" } },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/access-requests": {
        get: {
          tags: ["Admin Approvals"],
          operationId: "listAdminAccessRequests",
          summary: "List access requests",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "Access requests visible to the admin user.",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/AccessRequest" } },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/access-requests/{requestId}/approve": {
        post: {
          tags: ["Admin Approvals"],
          operationId: "approveAdminAccessRequest",
          summary: "Approve an access request",
          security: buildAdminSecurity(),
          parameters: [
            { name: "requestId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccessRequestDecision" },
              },
            },
          },
          responses: {
            200: {
              description: "Temporary grant created from the approval.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ArbitraryObject" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/access-requests/{requestId}/reject": {
        post: {
          tags: ["Admin Approvals"],
          operationId: "rejectAdminAccessRequest",
          summary: "Reject an access request",
          security: buildAdminSecurity(),
          parameters: [
            { name: "requestId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "Updated access request after rejection.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AccessRequest" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/integrations/built-in-connectors": {
        get: {
          tags: ["Admin Discovery"],
          operationId: "listAdminBuiltInConnectors",
          summary: "List built-in connector catalog",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "Available built-in connectors.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ArbitraryObjectArray" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/integrations/oauth-provider-catalog": {
        get: {
          tags: ["Admin Discovery"],
          operationId: "listAdminOauthProviderCatalog",
          summary: "List provider catalog defaults",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "OAuth-capable provider catalog entries.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ArbitraryObjectArray" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/integrations/discover": {
        post: {
          tags: ["Admin Discovery"],
          operationId: "discoverAdminIntegration",
          summary: "Discover tools from an integration definition",
          security: buildAdminSecurity(),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IntegrationDiscoveryRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Discovered integration spec.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IntegrationSpec" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/managed-connectors": {
        get: {
          tags: ["Admin Connectors"],
          operationId: "listAdminManagedConnectors",
          summary: "List managed connectors",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "Managed connectors visible to the admin user.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ManagedConnectorList" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
        post: {
          tags: ["Admin Connectors"],
          operationId: "saveAdminManagedConnector",
          summary: "Create or update a managed connector",
          security: buildAdminSecurity(),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ManagedConnectorUpsert" },
              },
            },
          },
          responses: {
            200: {
              description: "Saved managed connector.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ManagedConnector" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/managed-connectors/{slug}": {
        delete: {
          tags: ["Admin Connectors"],
          operationId: "deleteAdminManagedConnector",
          summary: "Delete a managed connector",
          security: buildAdminSecurity(),
          parameters: [
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "Deletion result.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DeleteResult" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
      "/api/admin/managed-connectors/openapi": {
        get: {
          tags: ["Admin Connectors"],
          operationId: "getAdminManagedConnectorsOpenApi",
          summary: "Get managed connectors OpenAPI document",
          security: buildAdminSecurity(),
          responses: {
            200: {
              description: "Managed connectors OpenAPI document.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ArbitraryObject" },
                },
              },
            },
            401: buildUnauthorizedResponse(),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        AdminApiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API key",
          description:
            "Admin automation API key from the dashboard API keys section. You can also pass it in X-API-Key.",
        },
      },
      schemas: {
        IntegrationCreateRequest: toOpenApiSchema(integrationCreateSchema),
        IntegrationSpec: toOpenApiSchema(integrationSpecSchema),
        ToolSpec: toOpenApiSchema(toolSpecSchema),
        IntegrationDiscoveryRequest: toOpenApiSchema(integrationDiscoveryRequestSchema),
        IntegrationConnection: toOpenApiSchema(integrationConnectionSchema),
        NotificationRecord: toOpenApiSchema(notificationRecordSchema),
        AccessRequest: toOpenApiSchema(accessRequestSchema),
        AccessRequestDecision: toOpenApiSchema(accessRequestDecisionSchema.partial()),
        ManagedConnectorUpsert: toOpenApiSchema(managedConnectorUpsertSchema),
        ManagedConnector: toOpenApiSchema(managedConnectorResponseSchema),
        ManagedConnectorList: toOpenApiSchema(managedConnectorListSchema),
        DeleteResult: toOpenApiSchema(deleteResultSchema),
        ArbitraryObject: toOpenApiSchema(arbitraryObjectSchema),
        ArbitraryObjectArray: toOpenApiSchema(arbitraryObjectArraySchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  };
};

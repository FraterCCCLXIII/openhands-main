import { z } from "zod";

import {
  accessRequestDecisionSchema,
  accessRequestSchema,
  adminIntegrationConnectionSummarySchema,
  adminOperationalOverviewSchema,
  integrationSpecSchema,
  notificationRecordSchema,
} from "@/src/lib/core/schema";
import {
  managedConnectorListSchema,
  managedConnectorResponseSchema,
  managedConnectorUpsertSchema,
} from "@/src/lib/managed-connectors/api-schema";
import {
  OPENAPI_VERSION,
  arbitraryObjectArraySchema,
  arbitraryObjectSchema,
  buildApiKeySecurity,
  buildApiKeySecurityScheme,
  buildJsonArrayRefResponse,
  buildJsonRefResponse,
  buildJsonRequestBody,
  buildPathParameter,
  buildUnauthorizedResponse,
  errorResponseSchema,
  toOpenApiSchema,
} from "@/src/lib/openapi/shared";

const integrationDiscoveryRequestSchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["mcp", "managed"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

const deleteResultSchema = z.object({
  deleted: z.boolean(),
  key: z.string().optional(),
  slug: z.string().optional(),
});

export const buildAdminOpenApiDocument = ({
  baseUrl,
}: {
  baseUrl: string;
}) => {
  const security = buildApiKeySecurity("AdminApiKey");
  const unauthorizedResponse = buildUnauthorizedResponse(
    "Missing or invalid admin automation API key.",
  );

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "Context Layer Admin REST API",
      version: "1.0.0",
      description:
        "Admin-only automation API for QA and operational workflows that match admin dashboard capabilities.",
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "Admin Discovery" },
      { name: "Admin Approvals" },
      { name: "Admin Connectors" },
      { name: "Admin Connections" },
      { name: "Admin Overview" },
      { name: "Admin Workspace" },
    ],
    paths: {
      "/api/admin/notifications": {
        get: {
          tags: ["Admin Workspace"],
          operationId: "listAdminNotifications",
          summary: "List dashboard notifications",
          security,
          responses: {
            200: buildJsonArrayRefResponse(
              "In-app notifications visible in the dashboard.",
              "NotificationRecord",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/connections": {
        get: {
          tags: ["Admin Connections"],
          operationId: "listAdminConnections",
          summary: "List deployment-wide connection identities",
          security,
          parameters: [
            {
              name: "ownerId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "provider",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "integrationKey",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "q",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Case-insensitive substring search across ownerId, provider, integrationKey, displayName, externalAccountId, and externalWorkspaceId.",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 1000,
                default: 100,
              },
              description: "Maximum number of connection summaries to return.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 0,
                default: 0,
              },
              description: "Number of matching connection summaries to skip before returning results.",
            },
          ],
          responses: {
            200: buildJsonArrayRefResponse(
              "Sanitized deployment-wide integration connection summaries.",
              "AdminIntegrationConnectionSummary",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/overview": {
        get: {
          tags: ["Admin Overview"],
          operationId: "getAdminOperationalOverview",
          summary: "Get concise deployment-wide operational stats",
          security,
          responses: {
            200: buildJsonRefResponse(
              "Concise deployment-wide operational summary for admin review.",
              "AdminOperationalOverview",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/access-requests": {
        get: {
          tags: ["Admin Approvals"],
          operationId: "listAdminAccessRequests",
          summary: "List access requests",
          security,
          responses: {
            200: buildJsonArrayRefResponse(
              "Access requests visible to the admin user.",
              "AccessRequest",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/access-requests/{requestId}/approve": {
        post: {
          tags: ["Admin Approvals"],
          operationId: "approveAdminAccessRequest",
          summary: "Approve an access request",
          security,
          parameters: [buildPathParameter("requestId")],
          requestBody: buildJsonRequestBody(
            { $ref: "#/components/schemas/AccessRequestDecision" },
            { required: false },
          ),
          responses: {
            200: buildJsonRefResponse(
              "Temporary grant created from the approval.",
              "ArbitraryObject",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/access-requests/{requestId}/reject": {
        post: {
          tags: ["Admin Approvals"],
          operationId: "rejectAdminAccessRequest",
          summary: "Reject an access request",
          security,
          parameters: [buildPathParameter("requestId")],
          responses: {
            200: buildJsonRefResponse(
              "Updated access request after rejection.",
              "AccessRequest",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/integrations/managed-connectors": {
        get: {
          tags: ["Admin Discovery"],
          operationId: "listAdminManagedConnectorCatalog",
          summary: "List managed connector catalog",
          security,
          responses: {
            200: buildJsonRefResponse(
              "Available managed connectors.",
              "ArbitraryObjectArray",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/integrations/oauth-provider-catalog": {
        get: {
          tags: ["Admin Discovery"],
          operationId: "listAdminOauthProviderCatalog",
          summary: "List provider catalog defaults",
          security,
          responses: {
            200: buildJsonRefResponse(
              "OAuth-capable provider catalog entries.",
              "ArbitraryObjectArray",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/integrations/discover": {
        post: {
          tags: ["Admin Discovery"],
          operationId: "discoverAdminIntegration",
          summary: "Discover tools from an integration definition",
          security,
          requestBody: buildJsonRequestBody({
            $ref: "#/components/schemas/IntegrationDiscoveryRequest",
          }),
          responses: {
            200: buildJsonRefResponse(
              "Discovered integration spec.",
              "IntegrationSpec",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/managed-connectors": {
        get: {
          tags: ["Admin Connectors"],
          operationId: "listAdminManagedConnectors",
          summary: "List managed connectors",
          security,
          responses: {
            200: buildJsonRefResponse(
              "Managed connectors visible to the admin user.",
              "ManagedConnectorList",
            ),
            401: unauthorizedResponse,
          },
        },
        post: {
          tags: ["Admin Connectors"],
          operationId: "saveAdminManagedConnector",
          summary: "Create or update a managed connector",
          security,
          requestBody: buildJsonRequestBody({
            $ref: "#/components/schemas/ManagedConnectorUpsert",
          }),
          responses: {
            200: buildJsonRefResponse(
              "Saved managed connector.",
              "ManagedConnector",
            ),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/managed-connectors/{slug}": {
        delete: {
          tags: ["Admin Connectors"],
          operationId: "deleteAdminManagedConnector",
          summary: "Delete a managed connector",
          security,
          parameters: [buildPathParameter("slug")],
          responses: {
            200: buildJsonRefResponse("Deletion result.", "DeleteResult"),
            401: unauthorizedResponse,
          },
        },
      },
      "/api/admin/managed-connectors/openapi": {
        get: {
          tags: ["Admin Connectors"],
          operationId: "getAdminManagedConnectorsOpenApi",
          summary: "Get managed connectors OpenAPI document",
          security,
          responses: {
            200: buildJsonRefResponse(
              "Managed connectors OpenAPI document.",
              "ArbitraryObject",
            ),
            401: unauthorizedResponse,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        AdminApiKey: buildApiKeySecurityScheme(
          "Admin automation API key from the dashboard API keys section. You can also pass it in X-API-Key.",
        ),
      },
      schemas: {
        IntegrationSpec: toOpenApiSchema(integrationSpecSchema),
        IntegrationDiscoveryRequest: toOpenApiSchema(integrationDiscoveryRequestSchema),
        NotificationRecord: toOpenApiSchema(notificationRecordSchema),
        AdminIntegrationConnectionSummary: toOpenApiSchema(
          adminIntegrationConnectionSummarySchema,
        ),
        AdminOperationalOverview: toOpenApiSchema(adminOperationalOverviewSchema),
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

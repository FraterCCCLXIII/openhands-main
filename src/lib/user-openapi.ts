import { z } from "zod";

import {
  accessRequestSchema,
  functionAccessModeSchema,
  functionSpecSchema,
  integrationSpecSchema,
  temporaryGrantSchema,
} from "@/src/lib/core/schema";
import {
  OPENAPI_VERSION,
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
import { selectExampleIntegration } from "@/src/lib/tool-examples";
import type { IntegrationSpec } from "@/src/types/context-layer";

const updateFunctionAccessRequestSchema = z.object({
  accessMode: functionAccessModeSchema,
});

const approveAccessRequestSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
});

const buildAdminForbiddenResponse = () =>
  buildJsonRefResponse(
    "The authenticated user API key does not have admin privileges.",
    "ErrorResponse",
  );

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
  const security = buildApiKeySecurity("UserApiKey");
  const unauthorizedResponse = buildUnauthorizedResponse(
    "Missing or invalid user automation API key.",
  );

  const paths: Record<string, Record<string, unknown>> = {
    "/api/user/integrations": {
      get: {
        tags: ["User Integrations"],
        operationId: "listUserIntegrations",
        summary: "List installed integrations",
        description:
          "Returns the authenticated user's installed integrations and current per-function access settings.",
        security,
        responses: {
          200: buildJsonArrayRefResponse(
            "Installed integrations for the authenticated user.",
            "IntegrationSpec",
          ),
          401: unauthorizedResponse,
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
        security,
        parameters: [
          buildPathParameter("integrationKey", integrationKeyExample),
          buildPathParameter("functionName", functionNameExample),
        ],
        requestBody: buildJsonRequestBody(
          { $ref: "#/components/schemas/UpdateFunctionAccessRequest" },
          {
            examples: {
              default: {
                value: {
                  accessMode: "enabled",
                },
              },
            },
          },
        ),
        responses: {
          200: buildJsonRefResponse(
            "Updated function configuration.",
            "FunctionSpec",
          ),
          401: unauthorizedResponse,
          404: buildJsonRefResponse(
            "Unknown integration or function for the authenticated user.",
            "ErrorResponse",
          ),
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
        security,
        responses: {
          200: buildJsonArrayRefResponse(
            "Access requests visible to the admin user.",
            "AccessRequest",
          ),
          401: unauthorizedResponse,
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
        security,
        parameters: [buildPathParameter("requestId")],
        requestBody: buildJsonRequestBody(
          { $ref: "#/components/schemas/ApproveAccessRequest" },
          { required: false },
        ),
        responses: {
          200: buildJsonRefResponse(
            "Temporary grant created for the approved request.",
            "TemporaryGrant",
          ),
          401: unauthorizedResponse,
          403: buildAdminForbiddenResponse(),
          404: buildJsonRefResponse("Unknown access request.", "ErrorResponse"),
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
        security,
        parameters: [buildPathParameter("requestId")],
        responses: {
          200: buildJsonRefResponse(
            "Updated access request after rejection.",
            "AccessRequest",
          ),
          401: unauthorizedResponse,
          403: buildAdminForbiddenResponse(),
          404: buildJsonRefResponse("Unknown access request.", "ErrorResponse"),
        },
      },
    };
  }

  return {
    openapi: OPENAPI_VERSION,
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
        UserApiKey: buildApiKeySecurityScheme(
          "User automation API key sent as an Authorization bearer token. X-API-Key is also accepted by the runtime.",
        ),
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

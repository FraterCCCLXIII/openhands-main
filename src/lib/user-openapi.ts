import { z } from "zod";

import {
  accessRequestSchema,
  toolAccessModeSchema,
  toolSpecSchema,
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

const updateToolAccessRequestSchema = z.object({
  accessMode: toolAccessModeSchema,
});

const approveAccessRequestSchema = z.object({
  durationMinutes: z.number().int().positive().optional(),
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
  const exampleTool = exampleIntegration
    ? Object.values(exampleIntegration.tools).find((candidate) => candidate.enabled)
    : undefined;

  const integrationKeyExample = exampleIntegration?.key ?? "integration-key";
  const toolNameExample = exampleTool?.name ?? "tool-name";
  const security = buildApiKeySecurity("UserApiKey");
  const unauthorizedResponse = buildUnauthorizedResponse(
    "Missing or invalid user automation API key.",
  );
  const caseByCaseTagDescription = isAdmin
    ? "Endpoints that let a user review and decide access requests from their own agents. Admins can additionally use the admin API for workspace-wide review."
    : "Endpoints that let a user review and decide access requests from their own agents.";

  const paths: Record<string, Record<string, unknown>> = {
    "/api/user/integrations": {
      get: {
        tags: ["User Integrations"],
        operationId: "listUserIntegrations",
        summary: "List installed integrations",
        description:
          "Returns the authenticated user's installed integrations and current per-tool access settings.",
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
    "/api/user/integrations/{integrationKey}/tools/{toolName}": {
      patch: {
        tags: ["User Integrations"],
        operationId: "updateUserToolAccessMode",
        summary: "Update a tool access mode",
        description:
          "Updates the authenticated user's stored access mode for one installed integration tool.",
        security,
        parameters: [
          buildPathParameter("integrationKey", integrationKeyExample),
          buildPathParameter("toolName", toolNameExample),
        ],
        requestBody: buildJsonRequestBody(
          { $ref: "#/components/schemas/UpdateToolAccessRequest" },
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
            "Updated tool configuration.",
            "ToolSpec",
          ),
          401: unauthorizedResponse,
          404: buildJsonRefResponse(
            "Unknown integration or tool for the authenticated user.",
            "ErrorResponse",
          ),
        },
      },
    },
  };

  paths["/api/user/access-requests"] = {
    get: {
      tags: ["Case-by-case approvals"],
      operationId: "listUserAccessRequests",
      summary: "List your pending and historical access requests",
      description:
        "Returns only the case-by-case access requests associated with the authenticated user's own agents.",
      security,
      responses: {
        200: buildJsonArrayRefResponse(
          "Access requests visible to the authenticated user.",
          "AccessRequest",
        ),
        401: unauthorizedResponse,
      },
    },
  };

  paths["/api/user/access-requests/{requestId}/approve"] = {
    post: {
      tags: ["Case-by-case approvals"],
      operationId: "approveUserAccessRequest",
      summary: "Approve one of your access requests",
      description:
        "Approves one of the authenticated user's own access requests and creates a temporary grant.",
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
        404: buildJsonRefResponse("Unknown access request.", "ErrorResponse"),
      },
    },
  };

  paths["/api/user/access-requests/{requestId}/reject"] = {
    post: {
      tags: ["Case-by-case approvals"],
      operationId: "rejectUserAccessRequest",
      summary: "Reject one of your access requests",
      description:
        "Rejects one of the authenticated user's own pending access requests.",
      security,
      parameters: [buildPathParameter("requestId")],
      responses: {
        200: buildJsonRefResponse(
          "Updated access request after rejection.",
          "AccessRequest",
        ),
        401: unauthorizedResponse,
        404: buildJsonRefResponse("Unknown access request.", "ErrorResponse"),
      },
    },
  };

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
      {
        name: "Case-by-case approvals",
        description: caseByCaseTagDescription,
      },
    ],
    paths,
    components: {
      securitySchemes: {
        UserApiKey: buildApiKeySecurityScheme(
          "User automation API key sent as an Authorization bearer token. X-API-Key is also accepted by the runtime.",
        ),
      },
      schemas: {
        ToolSpec: toOpenApiSchema(toolSpecSchema),
        IntegrationSpec: toOpenApiSchema(integrationSpecSchema),
        AccessRequest: toOpenApiSchema(accessRequestSchema),
        TemporaryGrant: toOpenApiSchema(temporaryGrantSchema),
        UpdateToolAccessRequest: toOpenApiSchema(
          updateToolAccessRequestSchema,
        ),
        ApproveAccessRequest: toOpenApiSchema(approveAccessRequestSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  };
};

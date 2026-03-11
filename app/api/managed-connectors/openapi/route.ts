import { z } from "zod";

import { ok } from "@/src/lib/api";
import {
  errorResponseSchema,
  managedConnectorListSchema,
  managedConnectorResponseSchema,
  managedConnectorUpsertSchema,
} from "@/src/lib/managed-connectors/api-schema";

const toOpenApiSchema = (schema: z.ZodType) => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "openapi-3.0",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;
  return jsonSchema;
};

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;

  return ok({
    openapi: "3.0.3",
    info: {
      title: "Managed Connectors API",
      version: "1.0.0",
      description:
        "Minimal OpenAPI-compatible document for creating and listing DB-backed managed connectors.",
    },
    servers: [{ url: baseUrl }],
    tags: [
      {
        name: "Managed Connectors",
        description:
          "DB-backed connector definitions used by the managed connector system for remote MCP and generic HTTP/OpenAPI connectors.",
      },
    ],
    paths: {
      "/api/managed-connectors": {
        get: {
          tags: ["Managed Connectors"],
          summary: "List managed connectors",
          responses: {
            200: {
              description: "Managed connectors currently stored in the repository.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ManagedConnectorList" },
                },
              },
            },
            500: {
              description: "Unexpected error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Managed Connectors"],
          summary: "Create or update a managed connector",
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
              description: "The saved managed connector record.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ManagedConnector" },
                },
              },
            },
            400: {
              description: "Validation or request error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Unexpected error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ManagedConnectorUpsert: toOpenApiSchema(managedConnectorUpsertSchema),
        ManagedConnector: toOpenApiSchema(managedConnectorResponseSchema),
        ManagedConnectorList: toOpenApiSchema(managedConnectorListSchema),
        ErrorResponse: toOpenApiSchema(errorResponseSchema),
      },
    },
  });
}

import { z } from "zod";

export const OPENAPI_VERSION = "3.0.3";

export const arbitraryObjectSchema = z.record(z.string(), z.unknown());
export const arbitraryObjectArraySchema = z.array(arbitraryObjectSchema);
export const errorResponseSchema = z.object({
  detail: z.string(),
  debug: z.record(z.string(), z.unknown()).optional(),
});

type OpenApiSchema = Record<string, unknown> & {
  $schema?: unknown;
};

export const toOpenApiSchema = (schema: z.ZodType) => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "openapi-3.0",
  }) as OpenApiSchema;

  delete jsonSchema.$schema;
  return jsonSchema;
};

const APPLICATION_JSON = "application/json";

export const buildApiKeySecurity = (schemeName: string) => [{ [schemeName]: [] }];

export const buildApiKeySecurityScheme = (description: string) => ({
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Key",
  description,
});

export const buildJsonResponse = (
  description: string,
  schema: Record<string, unknown>,
) => ({
  description,
  content: {
    [APPLICATION_JSON]: {
      schema,
    },
  },
});

export const buildJsonRefResponse = (
  description: string,
  schemaName: string,
) => buildJsonResponse(description, { $ref: `#/components/schemas/${schemaName}` });

export const buildJsonArrayRefResponse = (
  description: string,
  schemaName: string,
) =>
  buildJsonResponse(description, {
    type: "array",
    items: { $ref: `#/components/schemas/${schemaName}` },
  });

export const buildUnauthorizedResponse = (description: string) =>
  buildJsonRefResponse(description, "ErrorResponse");

export const buildPathParameter = (
  name: string,
  example?: string,
): Record<string, unknown> => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  ...(example ? { example } : {}),
});

export const buildJsonRequestBody = (
  schema: Record<string, unknown>,
  options?: {
    required?: boolean;
    examples?: Record<string, unknown>;
  },
) => ({
  required: options?.required ?? true,
  content: {
    [APPLICATION_JSON]: {
      schema,
      ...(options?.examples ? { examples: options.examples } : {}),
    },
  },
});

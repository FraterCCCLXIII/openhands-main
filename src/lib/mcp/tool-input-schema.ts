import { z } from "zod";

import { collectHttpTemplateVariables } from "@/src/lib/http-request-template";
import type { ToolSpec, GenericHttpRequestTemplate } from "@/src/types/context-layer";

type JsonLiteral = string | number | boolean | null;

type JsonSchema = {
  type?: string | string[];
  enum?: unknown[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  description?: string;
};

const toRootVariableName = (value: string) => value.split(".").find(Boolean)?.trim() ?? "";

const describeSchema = (schema: z.ZodTypeAny, description?: string) =>
  description ? schema.describe(description) : schema;

const getPrimarySchemaType = (schema?: JsonSchema) =>
  Array.isArray(schema?.type)
    ? schema.type.find((value) => value !== "null")
    : schema?.type;

const isJsonLiteral = (value: unknown): value is JsonLiteral =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const buildEnumSchema = (values: unknown[]) => {
  if (!values.every(isJsonLiteral)) {
    return z.unknown();
  }

  const literals = values.map((value) => z.literal(value));
  const [first, second, ...rest] = literals;

  if (!first) {
    return z.unknown();
  }

  if (!second) {
    return first;
  }

  return z.union([first, second, ...rest]);
};

const buildZodSchemaFromJsonSchema = (schema?: JsonSchema): z.ZodTypeAny => {
  if (!schema) {
    return z.unknown();
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return describeSchema(buildEnumSchema(schema.enum), schema.description);
  }

  const schemaType = getPrimarySchemaType(schema);
  const nullable = Array.isArray(schema.type) && schema.type.includes("null");

  let resolved: z.ZodTypeAny;
  switch (schemaType) {
    case "string":
      resolved = z.string();
      break;
    case "integer":
      resolved = z.number().int();
      break;
    case "number":
      resolved = z.number();
      break;
    case "boolean":
      resolved = z.boolean();
      break;
    case "array":
      resolved = z.array(buildZodSchemaFromJsonSchema(schema.items));
      break;
    case "object": {
      const properties = buildShapeFromJsonSchema(schema) ?? {};
      resolved = z.object(properties).passthrough();
      break;
    }
    default:
      resolved = z.unknown();
      break;
  }

  if (nullable) {
    resolved = resolved.nullable();
  }

  return describeSchema(resolved, schema.description);
};

const buildShapeFromJsonSchema = (schema?: JsonSchema) => {
  if (getPrimarySchemaType(schema) !== "object" || !schema?.properties) {
    return null;
  }

  const required = new Set(schema.required ?? []);
  return Object.fromEntries(
    Object.entries(schema.properties).map(([key, propertySchema]) => {
      const valueSchema = buildZodSchemaFromJsonSchema(propertySchema);
      return [key, required.has(key) ? valueSchema : valueSchema.optional()];
    }),
  );
};

const buildShapeFromRequestTemplate = (requestTemplate?: GenericHttpRequestTemplate) => {
  if (!requestTemplate) {
    return null;
  }

  const rootVariables = [...collectHttpTemplateVariables(requestTemplate)]
    .map(toRootVariableName)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  if (rootVariables.length === 0) {
    return null;
  }

  return Object.fromEntries(rootVariables.map((variable) => [variable, z.unknown().optional()]));
};

export const CONTEXT_RESERVED_TOOL_INPUT_SHAPE = {
  contextAgentId: z.string().trim().min(1).nullable().optional(),
  contextAgentClass: z.string().trim().min(1).nullable().optional(),
  contextScopes: z.array(z.string()).default([]),
};

export const buildContextLayerToolInputShape = (toolSpec: ToolSpec) => {
  const jsonSchemaShape = buildShapeFromJsonSchema(toolSpec.config.inputSchema as JsonSchema | undefined);
  const requestTemplateShape = buildShapeFromRequestTemplate(
    toolSpec.config.request as GenericHttpRequestTemplate | undefined,
  );

  return z
    .object({
      ...CONTEXT_RESERVED_TOOL_INPUT_SHAPE,
      ...(jsonSchemaShape ?? {}),
      ...(requestTemplateShape ?? {}),
    })
    .passthrough();
};

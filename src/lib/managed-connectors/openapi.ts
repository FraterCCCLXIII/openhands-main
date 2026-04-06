import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  AuthStrategy,
  GenericHttpRequestTemplate,
  HttpRequestContentType,
  ManagedConnectorToolDefinition,
} from "@/src/types/context-layer";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type OpenApiSecurityRequirement = Record<string, string[]>;

type OpenApiSchema = {
  type?: string;
  enum?: unknown[];
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  additionalProperties?: boolean | OpenApiSchema;
  description?: string;
};

type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
};

type OpenApiRequestBody = {
  required?: boolean;
  content?: Record<
    string,
    {
      schema?: OpenApiSchema;
    }
  >;
};

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<OpenApiParameter | { $ref: string }>;
  requestBody?: OpenApiRequestBody | { $ref: string };
  security?: OpenApiSecurityRequirement[];
};

type OpenApiDocument = {
  openapi?: string;
  servers?: Array<{ url?: string }>;
  security?: OpenApiSecurityRequirement[];
  paths?: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;
  components?: {
    parameters?: Record<string, OpenApiParameter>;
    requestBodies?: Record<string, OpenApiRequestBody>;
  };
};

const OPERATION_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];
const PATH_PLACEHOLDER = /\{([^}]+)\}/g;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeToolName = (value: string) => {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return normalized || "call_api";
};

const resolveLocalRef = <T>(ref: string, document: OpenApiDocument): T => {
  if (!ref.startsWith("#/")) {
    throw new ContextLayerError(`Unsupported OpenAPI reference '${ref}'.`, 500);
  }

  const resolved = ref
    .slice(2)
    .split("/")
    .reduce<unknown>((value, segment) => {
      if (!isObject(value)) {
        return undefined;
      }

      return value[segment];
    }, document as unknown);

  if (resolved === undefined) {
    throw new ContextLayerError(`Could not resolve OpenAPI reference '${ref}'.`, 500);
  }

  return resolved as T;
};

const resolveParameter = (
  parameter: OpenApiParameter | { $ref: string },
  document: OpenApiDocument,
): OpenApiParameter => ("$ref" in parameter ? resolveLocalRef(parameter.$ref, document) : parameter);

const resolveRequestBody = (
  requestBody: OpenApiRequestBody | { $ref: string } | undefined,
  document: OpenApiDocument,
): OpenApiRequestBody | undefined => {
  if (!requestBody) {
    return undefined;
  }

  return "$ref" in requestBody ? resolveLocalRef(requestBody.$ref, document) : requestBody;
};

const resolveSecurity = (
  operation: OpenApiOperation,
  document: OpenApiDocument,
): OpenApiSecurityRequirement[] => operation.security ?? document.security ?? [];

const isOperationCompatibleWithAuth = (
  operation: OpenApiOperation,
  document: OpenApiDocument,
  authStrategy: AuthStrategy,
) => {
  if (authStrategy !== "oauth2" && authStrategy !== "bearer") {
    return true;
  }

  const requirements = resolveSecurity(operation, document);
  if (requirements.length === 0) {
    return true;
  }

  return requirements.some((requirement) => Object.keys(requirement).includes("bearerAuth"));
};

const toContentType = (content: Record<string, { schema?: OpenApiSchema }>): {
  contentType?: HttpRequestContentType;
  supported: boolean;
} => {
  if (content["application/json"]) {
    return { contentType: "json", supported: true };
  }

  if (content["application/x-www-form-urlencoded"]) {
    return { contentType: "form_urlencoded", supported: true };
  }

  if (content["multipart/form-data"]) {
    return { contentType: "multipart_form_data", supported: true };
  }

  if (content["text/plain"]) {
    return { contentType: "text", supported: true };
  }

  return { supported: false };
};

const describeParameterList = (parameters: OpenApiParameter[]) =>
  parameters
    .map((parameter) => `${parameter.name}${parameter.required ? " (required)" : ""}`)
    .join(", ");

const describeBody = (requestBody: OpenApiRequestBody | undefined) => {
  const jsonSchema = requestBody?.content?.["application/json"]?.schema;
  if (jsonSchema) {
    if (jsonSchema.type === "object") {
      const properties = Object.keys(jsonSchema.properties ?? {});
      const required = new Set(jsonSchema.required ?? []);
      if (properties.length > 0) {
        return `Provide the request payload under \`body\`${properties.length > 0 ? ` with fields like ${properties
          .map((property) => `${property}${required.has(property) ? " (required)" : ""}`)
          .join(", ")}` : ""}.`;
      }
    }

    if (jsonSchema.type === "array") {
      return "Provide the request payload array under `body`.";
    }
  }

  if (requestBody?.content?.["application/x-www-form-urlencoded"]) {
    return "Provide form fields under `body`.";
  }

  if (requestBody?.content?.["multipart/form-data"]) {
    return "Provide multipart form fields under `body`. File inputs can use objects like { filename, contentType, contentBase64 }.";
  }

  if (requestBody?.content?.["text/plain"]) {
    return "Provide the plain-text request payload under `body`.";
  }

  return "Provide the request payload under `body`.";
};

const buildDescription = (
  operation: OpenApiOperation,
  pathParameters: OpenApiParameter[],
  queryParameters: OpenApiParameter[],
  requestBody: OpenApiRequestBody | undefined,
) => {
  const base = operation.summary?.trim() || operation.description?.trim() || "HTTP API operation";
  const hints: string[] = [];

  if (pathParameters.length > 0) {
    hints.push(`Path params: ${describeParameterList(pathParameters)}.`);
  }

  if (queryParameters.length > 0) {
    hints.push(`Query params: ${describeParameterList(queryParameters)}.`);
  }

  if (requestBody) {
    hints.push(describeBody(requestBody));
  }

  return hints.length > 0 ? `${base} ${hints.join(" ")}` : base;
};

const buildHeaders = (parameters: OpenApiParameter[]) => {
  const headers: Record<string, string> = {};

  for (const parameter of parameters) {
    if (parameter.in !== "header") {
      continue;
    }

    if (parameter.name.toLowerCase() === "authorization") {
      continue;
    }

    const enumValues = parameter.schema?.enum;
    if (Array.isArray(enumValues) && enumValues.length === 1) {
      headers[parameter.name] = String(enumValues[0]);
    }
  }

  return headers;
};

const buildQuery = (parameters: OpenApiParameter[]) => {
  const queryEntries = parameters
    .filter((parameter) => parameter.in === "query")
    .map((parameter) => [parameter.name, `{{${parameter.name}}}`] as const);

  return queryEntries.length > 0 ? Object.fromEntries(queryEntries) : undefined;
};

const buildPathTemplate = (path: string) => path.replace(PATH_PLACEHOLDER, (_, key: string) => `{{${key}}}`);

const buildRequestTemplate = (
  method: HttpMethod,
  path: string,
  parameters: OpenApiParameter[],
  requestBody: OpenApiRequestBody | undefined,
): GenericHttpRequestTemplate | null => {
  const content = requestBody?.content;
  const contentInfo = content ? toContentType(content) : { supported: true };
  if (!contentInfo.supported) {
    return null;
  }

  const headers = buildHeaders(parameters);

  return {
    method: method.toUpperCase(),
    path: buildPathTemplate(path),
    query: buildQuery(parameters),
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: requestBody ? "{{body}}" : undefined,
    contentType: contentInfo.contentType,
  };
};

export interface GenerateManagedConnectorToolsFromOpenApiOptions {
  openApiUrl: string;
  authStrategy: AuthStrategy;
}

export const generateManagedConnectorToolsFromOpenApi = async ({
  openApiUrl,
  authStrategy,
}: GenerateManagedConnectorToolsFromOpenApiOptions): Promise<
  ManagedConnectorToolDefinition[]
> => {
  const response = await fetch(openApiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ContextLayerError(
      `Failed to load OpenAPI schema from ${openApiUrl} (${response.status}).`,
      502,
    );
  }

  const document = (await response.json()) as OpenApiDocument;
  if (!document.paths || !isObject(document.paths)) {
    throw new ContextLayerError(
      `OpenAPI schema at ${openApiUrl} does not contain any paths.`,
      500,
    );
  }

  const tools: ManagedConnectorToolDefinition[] = [];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of OPERATION_METHODS) {
      const operation = pathItem[method];
      if (!operation || !isOperationCompatibleWithAuth(operation, document, authStrategy)) {
        continue;
      }

      const parameters = (operation.parameters ?? []).map((parameter) =>
        resolveParameter(parameter, document),
      );
      const requestBody = resolveRequestBody(operation.requestBody, document);
      const request = buildRequestTemplate(method, path, parameters, requestBody);
      if (!request) {
        continue;
      }

      const toolName = normalizeToolName(
        operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]+/g, "_")}`,
      );
      const pathParameters = parameters.filter((parameter) => parameter.in === "path");
      const queryParameters = parameters.filter((parameter) => parameter.in === "query");

      tools.push({
        name: toolName,
        description: buildDescription(operation, pathParameters, queryParameters, requestBody),
        defaultScopes: [],
        request,
      });
    }
  }

  if (tools.length === 0) {
    throw new ContextLayerError(
      `OpenAPI schema at ${openApiUrl} did not produce any supported HTTP tools.`,
      500,
    );
  }

  return tools;
};

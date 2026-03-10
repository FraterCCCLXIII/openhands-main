import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  GenericHttpRequestTemplate,
  HttpRequestContentType,
} from "@/src/types/context-layer";

const EXACT_TEMPLATE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;
const TEMPLATE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

const getByPath = (source: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((value, segment) => {
    if (value == null || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, source);

const interpolateValue = (
  template: unknown,
  payload: Record<string, unknown>,
): unknown => {
  if (typeof template === "string") {
    const exact = template.match(EXACT_TEMPLATE);
    if (exact) {
      return getByPath(payload, exact[1]);
    }

    return template.replace(TEMPLATE, (_, key: string) => {
      const resolved = getByPath(payload, key);
      return resolved == null ? "" : String(resolved);
    });
  }

  if (Array.isArray(template)) {
    return template
      .map((item) => interpolateValue(item, payload))
      .filter((item) => item !== undefined);
  }

  if (template && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template)
        .map(([key, value]) => [key, interpolateValue(value, payload)] as const)
        .filter(([, value]) => value !== undefined),
    );
  }

  return template;
};

const buildAuthHeaders = (input: AdapterInvocationInput): Record<string, string> => {
  const { integration } = input;
  const credentials = integration.credentials;

  if (integration.authStrategy === "api_key") {
    const headerName =
      (credentials.headerName as string | undefined)?.trim() || "X-API-Key";
    const secret = (credentials.secret as string | undefined)?.trim();
    return secret ? { [headerName]: secret } : {};
  }

  if (
    integration.authStrategy === "oauth2" ||
    integration.authStrategy === "bearer"
  ) {
    const accessToken = (credentials.accessToken as string | undefined)?.trim();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  if (integration.authStrategy === "basic") {
    const username = (credentials.username as string | undefined)?.trim();
    const password = (credentials.password as string | undefined)?.trim();
    if (username && password) {
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
    }
  }

  return {};
};

const encodeBody = (
  body: unknown,
  contentType: HttpRequestContentType,
): { body?: BodyInit; headers: Record<string, string> } => {
  if (body == null) {
    return { headers: {} };
  }

  if (contentType === "form_urlencoded") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries((body as Record<string, unknown>) ?? {})) {
      if (value == null) {
        continue;
      }
      params.set(key, String(value));
    }

    return {
      body: params.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };
  }

  if (contentType === "text") {
    return {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "Content-Type": "text/plain" },
    };
  }

  return {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
};

const parseResponse = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export class HttpAdapter implements IntegrationAdapter {
  async invoke(input: AdapterInvocationInput) {
    const apiBaseUrl = (input.integration.config.apiBaseUrl as string | undefined)?.trim();
    const requestTemplate = input.functionSpec.config.request as
      | GenericHttpRequestTemplate
      | undefined;

    if (!apiBaseUrl) {
      throw new ContextLayerError(
        `Integration '${input.integration.key}' is missing an apiBaseUrl configuration.`,
        400,
      );
    }

    if (!requestTemplate) {
      throw new ContextLayerError(
        `Function '${input.functionSpec.name}' is missing an HTTP request template.`,
        400,
      );
    }

    const method = requestTemplate.method.toUpperCase();
    const path = interpolateValue(requestTemplate.path, input.payload);
    if (typeof path !== "string" || !path.trim()) {
      throw new ContextLayerError(
        `Function '${input.functionSpec.name}' produced an invalid request path.`,
        400,
      );
    }

    const url = new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`);
    const query = interpolateValue(requestTemplate.query ?? {}, input.payload);
    if (query && typeof query === "object" && !Array.isArray(query)) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const headers = {
      ...buildAuthHeaders(input),
      ...((interpolateValue(requestTemplate.headers ?? {}, input.payload) as
        | Record<string, string>
        | undefined) ?? {}),
    };

    const contentType = requestTemplate.contentType ?? "json";
    const encoded = encodeBody(
      interpolateValue(requestTemplate.body, input.payload),
      contentType,
    );

    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        ...encoded.headers,
      },
      body: method === "GET" || method === "HEAD" ? undefined : encoded.body,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new ContextLayerError(
        `${input.integration.name} ${input.functionSpec.name} failed (${response.status}): ${detail || response.statusText}`,
        502,
      );
    }

    return parseResponse(response);
  }
}

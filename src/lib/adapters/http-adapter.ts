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

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const appendFormValue = (formData: FormData, key: string, value: unknown) => {
  if (value == null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormValue(formData, key, item);
    }
    return;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  if (isObject(value) && typeof value.contentBase64 === "string") {
    const blob = new Blob([Buffer.from(value.contentBase64, "base64")], {
      type:
        typeof value.contentType === "string" && value.contentType.trim()
          ? value.contentType
          : "application/octet-stream",
    });
    formData.append(
      key,
      blob,
      typeof value.filename === "string" && value.filename.trim()
        ? value.filename
        : key,
    );
    return;
  }

  if (isObject(value) && typeof value.text === "string") {
    if (typeof value.filename === "string" && value.filename.trim()) {
      const blob = new Blob([value.text], {
        type:
          typeof value.contentType === "string" && value.contentType.trim()
            ? value.contentType
            : "text/plain",
      });
      formData.append(key, blob, value.filename);
      return;
    }

    formData.append(key, value.text);
    return;
  }

  formData.append(key, isObject(value) ? JSON.stringify(value) : String(value));
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

  if (contentType === "multipart_form_data") {
    const formData = new FormData();
    for (const [key, value] of Object.entries((body as Record<string, unknown>) ?? {})) {
      appendFormValue(formData, key, value);
    }

    return {
      body: formData,
      headers: {},
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

  if (
    contentType.startsWith("text/") ||
    contentType.includes("xml") ||
    contentType.includes("html")
  ) {
    return response.text();
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    contentType: contentType || "application/octet-stream",
    contentDisposition: response.headers.get("content-disposition") ?? undefined,
    sizeBytes: buffer.byteLength,
    contentBase64: buffer.toString("base64"),
  };
};

export class HttpAdapter implements IntegrationAdapter {
  async invoke(input: AdapterInvocationInput) {
    const apiBaseUrl = (input.integration.config.apiBaseUrl as string | undefined)?.trim();
    const requestTemplate = input.toolSpec.config.request as
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
        `Function '${input.toolSpec.name}' is missing an HTTP request template.`,
        400,
      );
    }

    const method = requestTemplate.method.toUpperCase();
    const path = interpolateValue(requestTemplate.path, input.payload);
    if (typeof path !== "string" || !path.trim()) {
      throw new ContextLayerError(
        `Function '${input.toolSpec.name}' produced an invalid request path.`,
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
        `${input.integration.name} ${input.toolSpec.name} failed (${response.status}): ${detail || response.statusText}`,
        502,
      );
    }

    return parseResponse(response);
  }
}

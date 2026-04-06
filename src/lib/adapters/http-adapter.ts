import type {
  AdapterInvocationInput,
  IntegrationAdapter,
} from "@/src/lib/core/adapter-registry";
import { ContextLayerError } from "@/src/lib/core/errors";
import {
  getOptionalString,
  getOptionalTrimmedString,
  isRecord,
} from "@/src/lib/type-utils";
import type {
  GenericHttpRequestTemplate,
  HttpRequestContentType,
} from "@/src/types/context-layer";

const EXACT_TEMPLATE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;
const TEMPLATE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

const getByPath = (source: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((value, segment) => {
    if (!isRecord(value)) {
      return undefined;
    }

    return value[segment];
  }, source);

const isHttpRequestTemplate = (value: unknown): value is GenericHttpRequestTemplate =>
  isRecord(value) && typeof value.method === "string" && typeof value.path === "string";

const interpolateValue = (
  template: unknown,
  payload: Record<string, unknown>,
): unknown => {
  if (typeof template === "string") {
    const exact = template.match(EXACT_TEMPLATE);
    const exactKey = exact?.[1];
    if (exactKey) {
      return getByPath(payload, exactKey);
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
    const headerName = getOptionalTrimmedString(credentials, "headerName") ?? "X-API-Key";
    const secret = getOptionalTrimmedString(credentials, "secret");
    return secret ? { [headerName]: secret } : {};
  }

  if (
    integration.authStrategy === "oauth2" ||
    integration.authStrategy === "bearer"
  ) {
    const accessToken = getOptionalTrimmedString(credentials, "accessToken");
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  if (integration.authStrategy === "basic") {
    const username = getOptionalTrimmedString(credentials, "username");
    const password = getOptionalTrimmedString(credentials, "password");
    if (username && password) {
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
    }
  }

  return {};
};

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

  if (isRecord(value)) {
    const contentBase64 = getOptionalString(value, "contentBase64");
    if (contentBase64) {
      const contentType = getOptionalTrimmedString(value, "contentType") ?? "application/octet-stream";
      const filename = getOptionalTrimmedString(value, "filename") ?? key;
      const blob = new Blob([Buffer.from(contentBase64, "base64")], {
        type: contentType,
      });
      formData.append(key, blob, filename);
      return;
    }

    const text = getOptionalString(value, "text");
    if (text) {
      const filename = getOptionalTrimmedString(value, "filename");
      if (filename) {
        const contentType = getOptionalTrimmedString(value, "contentType") ?? "text/plain";
        const blob = new Blob([text], {
          type: contentType,
        });
        formData.append(key, blob, filename);
        return;
      }

      formData.append(key, text);
      return;
    }
  }

  formData.append(key, isRecord(value) ? JSON.stringify(value) : String(value));
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
    const bodyRecord = isRecord(body) ? body : {};
    for (const [key, value] of Object.entries(bodyRecord)) {
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
    const bodyRecord = isRecord(body) ? body : {};
    for (const [key, value] of Object.entries(bodyRecord)) {
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
    const apiBaseUrl = getOptionalTrimmedString(input.integration.config, "apiBaseUrl");
    const requestTemplate = isHttpRequestTemplate(input.toolSpec.config["request"])
      ? input.toolSpec.config["request"]
      : undefined;

    if (!apiBaseUrl) {
      throw new ContextLayerError(
        `Integration '${input.integration.key}' is missing an apiBaseUrl configuration.`,
        400,
      );
    }

    if (!requestTemplate) {
      throw new ContextLayerError(
        `Tool '${input.toolSpec.name}' is missing an HTTP request template.`,
        400,
      );
    }

    const method = requestTemplate.method.toUpperCase();
    const path = interpolateValue(requestTemplate.path, input.payload);
    if (typeof path !== "string" || !path.trim()) {
      throw new ContextLayerError(
        `Tool '${input.toolSpec.name}' produced an invalid request path.`,
        400,
      );
    }

    const url = new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`);
    const query = interpolateValue(requestTemplate.query ?? {}, input.payload);
    if (isRecord(query)) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const interpolatedHeaders = interpolateValue(requestTemplate.headers ?? {}, input.payload);
    const headers = {
      ...buildAuthHeaders(input),
      ...Object.fromEntries(
        isRecord(interpolatedHeaders)
          ? Object.entries(interpolatedHeaders)
              .filter(([, value]) => value != null)
              .map(([key, value]) => [key, String(value)])
          : [],
      ),
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

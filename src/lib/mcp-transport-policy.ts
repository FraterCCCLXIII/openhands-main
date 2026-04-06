export type McpTransportKind = "streamable_http" | "sse";

export interface McpTransportTarget {
  transport: McpTransportKind;
  url: string;
}

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isMcpTransportKind = (value: unknown): value is McpTransportKind =>
  value === "streamable_http" || value === "sse";

const normalizeMcpTransportTarget = (
  value: unknown,
): McpTransportTarget | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const transport = (value as { transport?: unknown }).transport;
  const url = (value as { url?: unknown }).url;
  if (!isMcpTransportKind(transport) || typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    new URL(trimmedUrl);
  } catch {
    return null;
  }

  return {
    transport,
    url: trimmedUrl,
  };
};

export const parseMcpTransportOrder = (
  value: unknown,
): McpTransportTarget[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMcpTransportTarget)
    .filter((target): target is McpTransportTarget => target != null);
};

export const buildDefaultMcpTransportOrder = (
  serverUrl: string,
): McpTransportTarget[] => {
  const trimmedUrl = serverUrl.trim();
  return trimmedUrl
    ? [
        {
          transport: "streamable_http",
          url: trimmedUrl,
        },
      ]
    : [];
};

export const getMcpTransportOrder = (
  serverUrl: string,
  ...configs: Array<Record<string, unknown> | undefined>
): McpTransportTarget[] => {
  for (const config of configs) {
    if (!config || !hasOwn(config, "mcpTransportOrder")) {
      continue;
    }

    const parsed = parseMcpTransportOrder(config.mcpTransportOrder);
    return parsed.length > 0 ? parsed : buildDefaultMcpTransportOrder(serverUrl);
  }

  return buildDefaultMcpTransportOrder(serverUrl);
};
